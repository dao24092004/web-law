'use client';

import { Fragment, useState, useMemo } from 'react';
import { Shield, Check, X, Search, Info, Lock } from 'lucide-react';
import { AdminPageHeader, SearchBar } from '@/features/admin/shared';
import { useRoles } from './hooks/use-roles';
import { PERMISSION_GROUPS } from '@/lib/api/admin-roles';
import type { Role } from '@/lib/api/admin-roles';

const ROLE_BADGE: Record<string, { color: string; bg: string }> = {
  SUPER_ADMIN: { color: 'var(--danger)', bg: 'rgba(220, 38, 38, 0.1)' },
  ADMIN: { color: 'var(--primary)', bg: 'rgba(30, 58, 95, 0.1)' },
  STAFF: { color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
  LAWYER: { color: 'var(--warning)', bg: 'rgba(217, 119, 6, 0.1)' },
  CLIENT: { color: 'var(--gray-500)', bg: 'rgba(107, 114, 128, 0.1)' },
};

export default function RolesPage() {
  const { data: roles = [], isLoading } = useRoles();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Lọc roles theo search
  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [roles, search]);

  // Tính tổng permissions cho mỗi role
  const stats = useMemo(() => {
    const total = PERMISSION_GROUPS.reduce((sum, g) => sum + g.permissions.length, 0);
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      count: r.permissions.length,
      percentage: total === 0 ? 0 : Math.round((r.permissions.length / total) * 100),
    }));
  }, [roles]);

  if (isLoading) {
    return (
      <div className="admin-view">
        <AdminPageHeader title="Roles & Permissions" subtitle="Dang tai..." />
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
          Dang tai...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Roles & Permissions"
        subtitle="Ma tran quyen cho cac role trong he thong"
      />

      {/* Role cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 16 }}>
        {stats.map((s) => {
          const role = roles.find((r) => r.id === s.id);
          const badge = ROLE_BADGE[s.id] || ROLE_BADGE.CLIENT;
          const isSelected = selectedRole?.id === s.id;
          return (
            <div
              key={s.id}
              onClick={() => setSelectedRole(role ?? null)}
              style={{
                background: 'white',
                border: '1.5px solid ' + (isSelected ? 'var(--primary)' : 'var(--gray-200)'),
                borderRadius: 10,
                padding: 14,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: badge.bg,
                    color: badge.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--gray-500)' }}>{s.id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                  {s.count} quyen
                </span>
                <div style={{ width: 80, height: 6, background: 'var(--gray-100)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: s.percentage + '%',
                      height: '100%',
                      background: badge.color,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Tim role..." />
          </div>
          <button
            type="button"
            className="action-btn"
            onClick={() => setSelectedRole(null)}
            disabled={!selectedRole}
          >
            Bo chon
          </button>
        </div>
      </div>

      {/* Matrix */}
      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>
            Ma tran quyen {selectedRole && <span style={{ color: 'var(--primary)' }}>- {selectedRole.name}</span>}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
            {filteredRoles.length} / {roles.length} roles
          </div>
        </div>

        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky' as const, left: 0, background: 'var(--gray-50)', zIndex: 1, minWidth: 220 }}>
                  Quyen
                </th>
                {filteredRoles.map((role) => {
                  const badge = ROLE_BADGE[role.id] || ROLE_BADGE.CLIENT;
                  return (
                    <th
                      key={role.id}
                      style={{
                        padding: '10px 8px',
                        textAlign: 'center',
                        minWidth: 110,
                        borderLeft: '1px solid var(--gray-100)',
                        background: selectedRole?.id === role.id ? 'var(--primary-faint, #EFF3F8)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
                        <span style={{ fontWeight: 700, color: badge.color }}>{role.name}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--gray-500)' }}>
                          {role.permissions.length}/{PERMISSION_GROUPS.reduce((s, g) => s + g.permissions.length, 0)}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) => (
                <Fragment key={group.category}>
                  <tr style={{ background: 'var(--gray-50)' }}>
                    <td
                      colSpan={filteredRoles.length + 1}
                      style={{ padding: '6px 12px', fontWeight: 700, fontSize: '0.72rem', color: 'var(--gray-600)' }}
                    >
                      {group.category}
                    </td>
                  </tr>
                  {group.permissions.map((perm) => (
                    <tr key={perm.key} style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '8px 12px', position: 'sticky' as const, left: 0, background: 'white', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <code style={{ fontSize: '0.72rem', color: 'var(--gray-700)', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 3 }}>
                            {perm.key}
                          </code>
                          <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{perm.label}</span>
                        </div>
                      </td>
                      {filteredRoles.map((role) => {
                        const has = role.permissions.includes(perm.key);
                        const isSelectedCol = selectedRole?.id === role.id;
                        return (
                          <td
                            key={role.id + '-' + perm.key}
                            style={{
                              padding: '8px',
                              textAlign: 'center',
                              borderLeft: '1px solid var(--gray-100)',
                              background: isSelectedCol ? 'var(--primary-faint, #EFF3F8)' : (has ? 'rgba(16, 185, 129, 0.04)' : 'transparent'),
                            }}
                          >
                            {has ? (
                              <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)' }}>
                                <Check size={12} strokeWidth={3} />
                              </span>
                            ) : (
                              <span style={{ color: 'var(--gray-300)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
                                <X size={12} />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel khi chọn role */}
      {selectedRole && <RoleDetailPanel role={selectedRole} onClose={() => setSelectedRole(null)} />}

      {/* Footer info */}
      <div style={{ marginTop: 16, padding: 12, background: 'rgba(30, 58, 95, 0.05)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info size={16} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: '0.72rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
          <strong>Ma tran quyen chi doc:</strong> Roles duoc dinh nghia san trong backend. De sua role moi hoac thay doi permissions, lien he Backend team.
          Click vao mot role card de xem chi tiet va danh sach user dang su dung role do.
        </div>
      </div>
    </div>
  );
}

interface RoleDetailPanelProps {
  role: Role;
  onClose: () => void;
}

function RoleDetailPanel({ role, onClose }: RoleDetailPanelProps) {
  const badge = ROLE_BADGE[role.id] || ROLE_BADGE.CLIENT;
  const groupedPermissions = PERMISSION_GROUPS.map((g) => ({
    category: g.category,
    items: g.permissions.filter((p) => role.permissions.includes(p.key)),
  })).filter((g) => g.items.length > 0);

  return (
    <div style={{ marginTop: 16, background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: 14, borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: badge.bg,
              color: badge.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{role.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{role.description}</div>
          </div>
        </div>
        <button type="button" className="action-btn" onClick={onClose}>
          Dong
        </button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {groupedPermissions.map((group) => (
            <div key={group.category} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--gray-700)', marginBottom: 6 }}>
                {group.category} ({group.items.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                {group.items.map((perm) => (
                  <div key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}>
                    <Check size={11} color="var(--success)" strokeWidth={3} />
                    <code style={{ color: 'var(--gray-700)' }}>{perm.key}</code>
                    <span style={{ color: 'var(--gray-500)' }}>- {perm.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {role.isSystem && (
          <div style={{ marginTop: 14, padding: 10, background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.2)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Lock size={14} color="var(--warning)" />
            <span style={{ fontSize: '0.72rem', color: 'var(--gray-700)' }}>
              Day la role he thong, khong the xoa hoac sua permissions truc tiep.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
