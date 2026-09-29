'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, RefreshCw, Check } from 'lucide-react';
import { ALL_PERMISSIONS } from '@/features/admin/types';
import type { Role } from '@/features/admin/types';

interface PermissionMatrixProps {
  roles: Role[];
  onSave: (roleId: string, permissions: string[]) => Promise<boolean>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function PermissionMatrix({ roles, onSave, isLoading, readOnly = false }: PermissionMatrixProps) {
  const grouped = useMemo(() => {
    return ALL_PERMISSIONS.reduce<Record<string, typeof ALL_PERMISSIONS>>((acc, p) => {
      if (!acc[p.group]) acc[p.group] = [];
      acc[p.group].push(p);
      return acc;
    }, {});
  }, []);

  // State: matrix[roleId][permKey] = boolean
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    for (const r of roles) init[r.id] = new Set(r.permissions);
    return init;
  });
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  // When `roles` changes, re-sync the matrix — but only for roles that the
  // user hasn't edited yet. We previously did this in a `useMemo` which was
  // unsafe: `useMemo` must be pure, and calling `setMatrix` from inside it
  // could trigger an infinite re-render when the parent re-creates the
  // `roles` array on every render. `useEffect` runs after commit and gives
  // React a chance to short-circuit if the next state is referentially equal.
  useEffect(() => {
    setMatrix((prev) => {
      const next: Record<string, Set<string>> = {};
      let changed = false;
      for (const r of roles) {
        const fromServer = new Set(r.permissions);
        const existing = prev[r.id];
        const value = dirty.has(r.id) ? existing ?? fromServer : fromServer;
        next[r.id] = value;
        // Bail out early if nothing actually changed to keep this effect idempotent.
        if (!existing || existing.size !== value.size || ![...existing].every((p) => value.has(p))) {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [roles, dirty]);

  const toggle = (roleId: string, perm: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (readOnly || role?.isSystem) return; // backend hiện chỉ cung cấp role read-only
    setMatrix((prev) => {
      const set = new Set(prev[roleId] ?? []);
      if (set.has(perm)) set.delete(perm);
      else set.add(perm);
      return { ...prev, [roleId]: set };
    });
    setDirty((prev) => new Set(prev).add(roleId));
  };

  const toggleGroup = (roleId: string, group: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (readOnly || role?.isSystem) return;
    const perms = grouped[group].map((p) => p.key);
    const current = matrix[roleId] ?? new Set();
    const allSelected = perms.every((p) => current.has(p));
    const next = new Set(current);
    if (allSelected) perms.forEach((p) => next.delete(p));
    else perms.forEach((p) => next.add(p));
    setMatrix((prev) => ({ ...prev, [roleId]: next }));
    setDirty((prev) => new Set(prev).add(roleId));
  };

  const handleSave = async (roleId: string) => {
    if (readOnly) return;
    setSavingId(roleId);
    try {
      const ok = await onSave(roleId, Array.from(matrix[roleId] ?? []));
      if (ok) {
        setDirty((prev) => {
          const n = new Set(prev);
          n.delete(roleId);
          return n;
        });
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleRevert = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    setMatrix((prev) => ({ ...prev, [roleId]: new Set(role.permissions) }));
    setDirty((prev) => {
      const n = new Set(prev);
      n.delete(roleId);
      return n;
    });
  };

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: 8,
        overflow: 'auto',
        maxHeight: '70vh',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.78rem',
        }}
      >
        <thead>
          <tr style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--gray-50)' }}>
            <th
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderBottom: '2px solid var(--gray-200)',
                fontWeight: 700,
                position: 'sticky',
                left: 0,
                background: 'var(--gray-50)',
                zIndex: 2,
                minWidth: 180,
              }}
            >
              Permission
            </th>
            {roles.map((r) => (
              <th
                key={r.id}
                style={{
                  textAlign: 'center',
                  padding: '10px 8px',
                  borderBottom: '2px solid var(--gray-200)',
                  fontWeight: 600,
                  minWidth: 110,
                  background: dirty.has(r.id) ? 'var(--warning-faint, #FEF3C7)' : 'var(--gray-50)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span>{r.name}</span>
                  {r.isSystem && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--primary)',
                        fontWeight: 400,
                      }}
                    >
                      System
                    </span>
                  )}
                  {dirty.has(r.id) && (
                    <button
                      type="button"
                        onClick={() => handleSave(r.id)}
                        disabled={readOnly || savingId === r.id || r.isSystem}
                        hidden={readOnly}
                      className="action-btn action-btn--primary"
                      style={{
                        padding: '2px 6px',
                        fontSize: '0.65rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                      title={r.isSystem ? 'System role' : 'Lưu'}
                    >
                      {savingId === r.id ? (
                        <RefreshCw size={9} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Save size={9} />
                      )}
                      Lưu
                    </button>
                  )}
                  {dirty.has(r.id) && !readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRevert(r.id)}
                      className="action-btn"
                      style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                      title="Hoàn tác"
                    >
                      Revert
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([group, perms]) => (
            <>
              <tr key={`g-${group}`}>
                <td
                  colSpan={roles.length + 1}
                  style={{
                    background: 'var(--primary-faint, #EFF3F8)',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    padding: '6px 12px',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                  }}
                >
                  {group}
                </td>
              </tr>
              {perms.map((perm) => (
                <tr key={perm.key} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td
                    style={{
                      padding: '8px 12px',
                      position: 'sticky',
                      left: 0,
                      background: 'white',
                      borderRight: '1px solid var(--gray-100)',
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{perm.label}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)' }}>{perm.key}</div>
                  </td>
                  {roles.map((r) => {
                    const isChecked = matrix[r.id]?.has(perm.key) ?? false;
                    const isSystem = r.isSystem;
                    return (
                      <td
                        key={r.id}
                        style={{
                          textAlign: 'center',
                          padding: 6,
                          background: isChecked ? 'var(--success-faint, #D1FAE5)' : 'transparent',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggle(r.id, perm.key)}
                          disabled={readOnly || isSystem}
                          title={readOnly ? 'Role được quản lý trên backend' : isSystem ? 'Role hệ thống' : ''}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: readOnly || isSystem ? 'not-allowed' : 'pointer',
                            padding: 4,
                            color: isChecked ? 'var(--success, #10B981)' : 'var(--gray-300)',
                          }}
                        >
                          {isChecked ? <Check size={14} /> : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
      {isLoading && (
        <div style={{ padding: 8, textAlign: 'center', color: 'var(--gray-500)' }}>Đang tải...</div>
      )}
    </div>
  );
}