'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Shield,
  Mail,
  UserCog,
  LogOut,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import {
  AdminPageHeader,
  SearchBar,
  FilterTabs,
  Pagination,
  ConfirmDialog,
  EmptyStateWithCta,
  Modal,
} from '@/features/admin/shared';
import { useCan, notifySuccess, notifyError } from '@/features/admin/lib';
import { useAdminAuth } from './hooks/use-admin-auth';
import { UsersTable } from './components/users-table';
import { UserForm } from './components/user-form';
import { RolesTable } from './components/roles-table';
import { PermissionMatrix } from './components/permission-matrix';
import { ImpersonateDialog } from './components/impersonate-dialog';
import {
  useUsers,
  useRoles,
  useCreateUserFromValues,
  useUpdateUserFromValues,
  useDeleteUserWithAudit,
  useResetPassword,
  useToggleUserStatus,
  useBulkChangeRole,
  useBulkToggleStatus,
  useBulkDeleteUsers,
  useAuditLogs,
  ROLE_LABELS,
} from './hooks/use-users';
import type { AdminUser, Role, UserRole } from '@/features/admin/types';
import type { UserFormValues } from '@/features/admin/schema';
import type { AdminUser as ApiAdminUser, Role as ApiRole } from '@/lib/api/admin-core';
import { UserStats } from './components/user-stats';
import { BulkActionsBar } from './components/bulk-actions-bar';
import { ExportUsersButton } from './components/export-users-button';
import { UserActivityDrawer } from './components/user-activity-drawer';

/** Normalise the API AdminUser (fullName) into the legacy UI AdminUser (name). */
function toUiUser(u: ApiAdminUser): AdminUser {
  return {
    ...(u as unknown as AdminUser),
    id: u.id,
    name: u.fullName ?? u.name ?? u.email,
    email: u.email,
    role: (u.role ?? 'USER') as UserRole,
    isActive: u.isActive,
    phone: u.phone,
    avatar: u.avatarUrl,
    createdAt: u.createdAt ?? new Date().toISOString(),
  };
}

function toUiRole(r: ApiRole): Role {
  return {
    ...(r as unknown as Role),
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    permissions: r.permissions ?? [],
    isSystem: r.isSystem ?? false,
    memberCount: 0,
    createdAt: new Date().toISOString(),
  };
}

type Tab = 'users' | 'roles' | 'matrix' | 'audit';

export default function UsersPage() {
  const canRead = useCan('users.read');
  const canWrite = useCan('users.write');
  const canImpersonate = useCan('users.impersonate');
  const canDelete = useCan('users.write');
  const canAudit = useCan('audit.read');
  const { currentUser, effectiveUser, isImpersonating, startImpersonate, stopImpersonate } =
    useAdminAuth();

  if (!canRead) {
    return (
      <div className="admin-view">
        <AdminPageHeader title="Người dùng & Phân quyền" />
        <div
          className="admin-card"
          style={{ padding: 32, textAlign: 'center', color: 'var(--gray-500)' }}
        >
          Bạn không có quyền xem module này.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Người dùng & Phân quyền"
        subtitle="Quản lý tài khoản, vai trò và ma trận quyền"
        actions={
          isImpersonating ? (
            <button
              type="button"
              onClick={stopImpersonate}
              className="action-btn action-btn--primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--warning, #D97706)',
              }}
            >
              <LogOut size={12} /> Thoát impersonate ({effectiveUser?.name})
            </button>
          ) : null
        }
      />

      {isImpersonating && (
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--warning-faint, #FEF3C7)',
            border: '1px solid var(--warning, #D97706)',
            borderRadius: 8,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.82rem',
            color: 'var(--warning, #B45309)',
          }}
        >
          <AlertTriangle size={16} />
          Bạn đang đăng nhập thay <strong>{effectiveUser?.name}</strong> ({effectiveUser?.email})
          dưới quyền <strong>{ROLE_LABELS[(effectiveUser?.role as UserRole) ?? 'USER']}</strong>.
          Mọi thao tác sẽ được ghi audit log.
        </div>
      )}

      <Tabs />
    </div>
  );
}

function Tabs() {
  const [tab, setTab] = useState<Tab>('users');
  const canAudit = useCan('audit.read');

  const tabs: Array<{ value: Tab; label: string; icon: React.ReactNode; show: boolean }> = [
    { value: 'users', label: 'Người dùng', icon: <UserCog size={12} />, show: true },
    { value: 'roles', label: 'Vai trò', icon: <Shield size={12} />, show: true },
    { value: 'matrix', label: 'Permission Matrix', icon: <Mail size={12} />, show: true },
    { value: 'audit', label: 'Audit log', icon: <Activity size={12} />, show: canAudit },
  ];
  const visible = tabs.filter((t) => t.show);

  return (
    <>
      <FilterTabs
        tabs={visible.map((t) => ({
          value: t.value,
          label: t.label,
          icon: t.icon,
        }))}
        activeValue={tab}
        onChange={(v) => setTab(v as Tab)}
      />
      <div style={{ height: 12 }} />
      {tab === 'users' && <UsersTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'matrix' && <MatrixTab />}
      {tab === 'audit' && canAudit && <AuditTab />}
    </>
  );
}

// ─── USERS TAB ─────────────────────────────────────────────────
function UsersTab() {
  const canWrite = useCan('users.write');
  const canDelete = useCan('users.write');
  const canImpersonate = useCan('users.impersonate');
  const { data: apiUsers, counts } = useUsers();
  const users = useMemo(() => (apiUsers ?? []).map(toUiUser), [apiUsers]);
  const { data: apiRoles } = useRoles();
  const roles = useMemo(() => (apiRoles ?? []).map(toUiRole), [apiRoles]);
  const createUser = useCreateUserFromValues();
  const updateUser = useUpdateUserFromValues();
  const deleteUser = useDeleteUserWithAudit();
  const resetPassword = useResetPassword();
  const toggleStatus = useToggleUserStatus();
  const bulkChangeRole = useBulkChangeRole();
  const bulkToggleStatus = useBulkToggleStatus();
  const bulkDelete = useBulkDeleteUsers();
  const { startImpersonate, currentUser, isImpersonating } = useAdminAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [confirmReset, setConfirmReset] = useState<AdminUser | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<AdminUser | null>(null);
  const [viewingActivityUser, setViewingActivityUser] = useState<AdminUser | null>(null);
  const LIMIT = 20;

  const filtered = useMemo(() => {
    let r = users;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone ?? '').toLowerCase().includes(q),
      );
    }
    if (roleFilter !== 'all') r = r.filter((u) => u.role === roleFilter);
    if (statusFilter !== 'all') r = r.filter((u) =>
      statusFilter === 'active' ? u.isActive : !u.isActive,
    );
    return r;
  }, [users, search, roleFilter, statusFilter]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const roleTabs: Array<{ value: 'all' | UserRole; label: string; count: number }> = [
    { value: 'all', label: 'Tất cả', count: counts.total },
    { value: 'SUPER_ADMIN', label: 'Super Admin', count: counts.byRole.SUPER_ADMIN },
    { value: 'ADMIN', label: 'Admin', count: counts.byRole.ADMIN },
    { value: 'EDITOR', label: 'Editor', count: counts.byRole.EDITOR },
    { value: 'CSKH', label: 'CSKH', count: counts.byRole.CSKH },
    { value: 'LAWYER', label: 'Luật sư', count: counts.byRole.LAWYER },
    { value: 'USER', label: 'Khách hàng', count: counts.byRole.USER },
  ];

  return (
    <>
      {/* Stats summary */}
      <UserStats
        total={counts.total}
        active={counts.active}
        inactive={counts.inactive}
        byRole={counts.byRole}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <FilterTabs
              tabs={roleTabs}
              activeValue={roleFilter}
              onChange={(v) => {
                setRoleFilter(v as typeof roleFilter);
                setPage(1);
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterTabs
              tabs={[
                { value: 'all', label: 'Tất cả', count: counts.total },
                { value: 'active', label: 'Hoạt động', count: counts.active },
                { value: 'inactive', label: 'Bị khóa', count: counts.inactive },
              ]}
              activeValue={statusFilter}
              onChange={(v) => {
                setStatusFilter(v as typeof statusFilter);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <ExportUsersButton users={filtered} />
          {canWrite && (
            <button
              type="button"
              className="action-btn action-btn--primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={12} /> Tạo người dùng
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions appear when at least one row is selected. */}
      <BulkActionsBar
        selectedIds={selectedIds}
        users={users}
        currentUserId={currentUser?.id ?? ''}
        canDelete={canDelete}
        canWrite={canWrite}
        onClearSelection={() => setSelectedIds([])}
        onBulkActivate={async (ids) => {
          await bulkToggleStatus(ids, true);
          setSelectedIds([]);
        }}
        onBulkDeactivate={async (ids) => {
          await bulkToggleStatus(ids, false);
          setSelectedIds([]);
        }}
        onBulkDelete={async (ids) => {
          await bulkDelete(ids);
          setSelectedIds([]);
        }}
        onBulkChangeRole={async (ids, role) => {
          await bulkChangeRole(ids, role as Parameters<typeof bulkChangeRole>[1]);
          setSelectedIds([]);
        }}
      />

      <div className="admin-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Tìm theo tên, email..."
          />
          <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
            {filtered.length} / {users.length} users
          </span>
        </div>

        {users.length === 0 ? (
          <EmptyStateWithCta
            title="Chưa có user nào"
            description="Tạo tài khoản đầu tiên cho đội ngũ admin."
            action={
              canWrite ? (
                <button
                  type="button"
                  className="action-btn action-btn--primary"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Plus size={12} /> Tạo ngay
                </button>
              ) : null
            }
          />
        ) : (
          <UsersTable
            data={paginated}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onEdit={(u) => {
              setEditing(u);
              setFormOpen(true);
            }}
            onDelete={(u) => setConfirmDelete(u)}
            onResetPassword={(u) => setConfirmReset(u)}
            onToggleStatus={(u) => toggleStatus(u as unknown as Parameters<typeof toggleStatus>[0])}
            onImpersonate={(u) => setImpersonateTarget(u)}
            onViewActivity={(u) => setViewingActivityUser(u)}
            currentUserId={currentUser?.id ?? ''}
            canWrite={canWrite}
            canDelete={canDelete}
            canImpersonate={canImpersonate && !isImpersonating}
          />
        )}

        <Pagination
          page={page}
          limit={LIMIT}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>

      <UserForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={async (values) => {
          if (editing) {
            const ok = await updateUser(editing.id, values);
            if (ok) notifySuccess('Đã cập nhật người dùng');
          } else {
            const id = await createUser(values);
            if (id) notifySuccess('Đã tạo người dùng');
          }
          setFormOpen(false);
          setEditing(null);
        }}
        initial={editing}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Xóa người dùng"
        message={
          confirmDelete
            ? `Xóa "${confirmDelete.name}"? Hành động không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={async () => {
          if (!confirmDelete) return;
          try {
            await deleteUser(confirmDelete as unknown as Parameters<typeof deleteUser>[0]);
          } catch (e) {
            notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể xóa');
          } finally {
            setConfirmDelete(null);
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmReset)}
        title="Reset mật khẩu"
        message={
          confirmReset
            ? `Gửi email reset mật khẩu cho ${confirmReset.email}?`
            : ''
        }
        confirmLabel="Gửi email"
        cancelLabel="Hủy"
        variant="primary"
        onConfirm={async () => {
          if (!confirmReset) return;
          await resetPassword(confirmReset as unknown as Parameters<typeof resetPassword>[0]);
          setConfirmReset(null);
        }}
        onClose={() => setConfirmReset(null)}
      />

      <ImpersonateDialog
        isOpen={Boolean(impersonateTarget)}
        user={impersonateTarget}
        onConfirm={() => {
          if (impersonateTarget) {
            startImpersonate(impersonateTarget.id);
            setImpersonateTarget(null);
          }
        }}
        onClose={() => setImpersonateTarget(null)}
      />

      <UserActivityDrawer
        user={viewingActivityUser as unknown as ApiAdminUser}
        onClose={() => setViewingActivityUser(null)}
      />

      {void roles}
    </>
  );
}

// ─── ROLES TAB ─────────────────────────────────────────────────
function RolesTab() {
  const { data: apiRoles } = useRoles();
  const roles = useMemo(() => (apiRoles ?? []).map(toUiRole), [apiRoles]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const LIMIT = 20;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter(
      (role) => role.name.toLowerCase().includes(query) || role.description.toLowerCase().includes(query),
    );
  }, [roles, search]);

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <SearchBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Tìm role..." />
        <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>{filtered.length} / {roles.length} roles</span>
      </div>
      <p style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginBottom: 12 }}>
        Role được định nghĩa cố định trên backend và chỉ đọc tại giao diện này.
      </p>
      <RolesTable
        data={paginated}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        onEdit={() => undefined}
        onDelete={() => undefined}
        canWrite={false}
        canDelete={false}
      />
      <Pagination page={page} limit={LIMIT} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}

// ─── MATRIX TAB ────────────────────────────────────────────────
function MatrixTab() {
  const { data: apiRoles } = useRoles();
  const roles = useMemo(() => (apiRoles ?? []).map(toUiRole), [apiRoles]);

  return (
    <>
      <div style={{ padding: 10, background: 'var(--blue-faint, #DBEAFE)', border: '1px solid var(--blue, #2563EB)', borderRadius: 8, marginBottom: 12, fontSize: '0.78rem', color: 'var(--blue, #1E40AF)' }}>
        Quyền được định nghĩa cố định trên backend. Permission Matrix chỉ hiển thị để đối chiếu và chưa hỗ trợ chỉnh sửa.
      </div>
      <PermissionMatrix roles={roles} onSave={async () => false} readOnly />
    </>
  );
}

// ─── AUDIT TAB ─────────────────────────────────────────────────
function AuditTab() {
  const { data: logs } = useAuditLogs();
  const [filter, setFilter] = useState<'all' | 'impersonate' | 'user'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let r = logs;
    if (filter === 'impersonate') r = r.filter((l) => l.action === 'impersonate' || l.action === 'login');
    if (filter === 'user') r = r.filter((l) => l.entity === 'user' || l.entity === 'role');
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (l) =>
          l.actorName.toLowerCase().includes(q) ||
          (l.entityLabel?.toLowerCase().includes(q) ?? false) ||
          l.action.toLowerCase().includes(q),
      );
    }
    return r;
  }, [logs, filter, search]);

  const actionColor = (a: string): 'red' | 'blue' | 'green' | 'yellow' | 'gray' => {
    if (a === 'create') return 'green';
    if (a === 'delete') return 'red';
    if (a === 'update') return 'blue';
    if (a === 'impersonate') return 'red';
    if (a === 'login' || a === 'logout') return 'yellow';
    return 'gray';
  };

  return (
    <div className="admin-card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <FilterTabs
          tabs={[
            { value: 'all', label: 'Tất cả', count: logs.length },
            {
              value: 'impersonate',
              label: 'Impersonate',
              count: logs.filter((l) => l.action === 'impersonate' || l.action === 'login').length,
            },
            {
              value: 'user',
              label: 'User/Role',
              count: logs.filter((l) => l.entity === 'user' || l.entity === 'role').length,
            },
          ]}
          activeValue={filter}
          onChange={(v) => setFilter(v as typeof filter)}
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm actor, action..." />
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-500)' }}>
          Chưa có audit log
        </div>
      ) : (
        <div
          style={{
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 8,
            maxHeight: '70vh',
            overflow: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: 'var(--gray-50)' }}>
                <th style={th()}>Thời gian</th>
                <th style={th()}>Actor</th>
                <th style={th()}>Action</th>
                <th style={th()}>Entity</th>
                <th style={th()}>Diff</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={td()}>
                    <span style={{ color: 'var(--gray-500)' }}>
                      {new Intl.DateTimeFormat('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(l.createdAt))}
                    </span>
                  </td>
                  <td style={td()}>
                    <strong>{l.actorName}</strong>
                  </td>
                  <td style={td()}>
                    <span
                      style={{
                        padding: '2px 8px',
                        background: 'var(--primary-faint, #EFF3F8)',
                        color: 'var(--primary)',
                        borderRadius: 999,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {l.action}
                    </span>
                  </td>
                  <td style={td()}>
                    <div style={{ fontWeight: 600 }}>{l.entity}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                      {l.entityLabel ?? l.entityId}
                    </div>
                  </td>
                  <td style={td()}>
                    {l.diff ? (
                      <code
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--gray-600)',
                          background: 'var(--gray-50)',
                          padding: '2px 4px',
                          borderRadius: 3,
                        }}
                      >
                        {Object.keys(l.diff).length} field(s)
                      </code>
                    ) : (
                      <span style={{ color: 'var(--gray-300)' }}>—</span>
                    )}
                    {void actionColor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function th(): React.CSSProperties {
  return {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '2px solid var(--gray-200)',
    fontWeight: 600,
  };
}
function td(): React.CSSProperties {
  return { padding: '6px 10px' };
}