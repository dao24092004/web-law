'use client';

import { useState } from 'react';
import { Lock, Unlock, Trash2, ShieldCheck, X, ChevronDown } from 'lucide-react';

/**
 * Loose role type that matches the union produced by `toUiUser` (which keeps
 * the wider `UserRole` that includes `VIEWER`). The component itself only
 * reads `id` and `role`, so a partial pick is enough.
 */
interface BulkUser {
  id: string;
  role: string;
}

interface BulkActionsBarProps {
  selectedIds: string[];
  users: BulkUser[];
  currentUserId: string;
  canDelete: boolean;
  canWrite: boolean;
  onClearSelection: () => void;
  onBulkActivate: (ids: string[]) => Promise<unknown>;
  onBulkDeactivate: (ids: string[]) => Promise<unknown>;
  onBulkDelete: (ids: string[]) => Promise<unknown>;
  onBulkChangeRole: (ids: string[], role: string) => Promise<unknown>;
}

const ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'CSKH', label: 'CSKH' },
  { value: 'LAWYER', label: 'Luật sư' },
  { value: 'USER', label: 'Khách hàng' },
];

export function BulkActionsBar({
  selectedIds,
  users,
  currentUserId,
  canDelete,
  canWrite,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  onBulkChangeRole,
}: BulkActionsBarProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  // Filter out SUPER_ADMIN + current user from bulk targets.
  const filteredIds = selectedIds.filter((id) => {
    const u = users.find((x) => x.id === id);
    if (!u) return false;
    if (u.id === currentUserId) return false;
    if (u.role === 'SUPER_ADMIN') return false;
    return true;
  });
  const skipped = selectedIds.length - filteredIds.length;

  if (selectedIds.length === 0) return null;

  const handle = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--primary-faint, #EFF3F8)',
        border: '1px solid var(--primary, #1E3A5F)',
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: '0.85rem',
          color: 'var(--primary, #1E3A5F)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        Đã chọn <span style={{ fontSize: '1rem' }}>{selectedIds.length}</span> người dùng
        {skipped > 0 && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'var(--warning, #D97706)',
              background: 'var(--warning-faint, #FEF3C7)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            ({skipped} đã loại — Super Admin hoặc chính bạn)
          </span>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {canWrite && (
        <>
          <button
            type="button"
            className="action-btn"
            disabled={busy || filteredIds.length === 0}
            onClick={() => handle(() => onBulkActivate(filteredIds))}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            title="Mở khóa tài khoản đã chọn"
          >
            <Unlock size={12} color="var(--success, #10B981)" />
            Mở khóa
          </button>
          <button
            type="button"
            className="action-btn"
            disabled={busy || filteredIds.length === 0}
            onClick={() => handle(() => onBulkDeactivate(filteredIds))}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            title="Khóa tài khoản đã chọn"
          >
            <Lock size={12} color="var(--warning, #D97706)" />
            Khóa
          </button>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="action-btn"
              disabled={busy || filteredIds.length === 0}
              onClick={() => setShowRoleMenu((p) => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              title="Đổi vai trò cho users đã chọn"
            >
              <ShieldCheck size={12} color="var(--blue, #2563EB)" />
              Đổi vai trò
              <ChevronDown size={10} />
            </button>
            {showRoleMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                  onClick={() => setShowRoleMenu(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    minWidth: 180,
                    overflow: 'hidden',
                  }}
                >
                  {ROLE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setShowRoleMenu(false);
                        await handle(() => onBulkChangeRole(filteredIds, o.value));
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '0.78rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <ShieldCheck size={12} style={{ marginRight: 6 }} />
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {canDelete && (
        <button
          type="button"
          className="action-btn"
          disabled={busy || filteredIds.length === 0}
          onClick={() => {
            if (
              typeof window !== 'undefined' &&
              window.confirm(
                `Xóa ${filteredIds.length} người dùng đã chọn? Hành động không thể hoàn tác.`,
              )
            ) {
              handle(() => onBulkDelete(filteredIds));
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--danger, #DC2626)',
          }}
          title="Xóa người dùng đã chọn"
        >
          <Trash2 size={12} />
          Xóa
        </button>
      )}

      <button
        type="button"
        className="action-btn"
        onClick={onClearSelection}
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        title="Bỏ chọn tất cả"
      >
        <X size={12} />
        Bỏ chọn
      </button>
    </div>
  );
}
