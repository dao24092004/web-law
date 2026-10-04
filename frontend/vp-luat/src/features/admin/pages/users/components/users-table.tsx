'use client';

import { Edit3, Trash2, KeyRound, Lock, Unlock, LogIn, CheckSquare, Square, Activity } from 'lucide-react';
import { DataTableV2, type DataTableColumn } from '@/features/admin/components';
import { StatusBadge, type StatusVariant } from '@/features/admin/shared';
import type { AdminUser } from '@/features/admin/types';
import { ROLE_LABELS, ROLE_VARIANT, type FrontendUserRole } from '../hooks/use-users';

interface UsersTableProps {
  data: AdminUser[];
  isLoading?: boolean;
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onEdit: (u: AdminUser) => void;
  onDelete: (u: AdminUser) => void;
  onResetPassword: (u: AdminUser) => void;
  onToggleStatus: (u: AdminUser) => void;
  onImpersonate: (u: AdminUser) => void;
  onViewActivity: (u: AdminUser) => void;
  currentUserId: string;
  canWrite: boolean;
  canDelete: boolean;
  canImpersonate: boolean;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function UsersTable({
  data,
  isLoading,
  selectedIds,
  onSelectChange,
  onEdit,
  onDelete,
  onResetPassword,
  onToggleStatus,
  onImpersonate,
  onViewActivity,
  currentUserId,
  canWrite,
  canDelete,
  canImpersonate,
}: UsersTableProps) {
  const allSelected = data.length > 0 && data.every((u) => selectedIds.includes(u.id));
  const someSelected = data.some((u) => selectedIds.includes(u.id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) onSelectChange([]);
    else onSelectChange(data.map((u) => u.id));
  };
  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) onSelectChange(selectedIds.filter((x) => x !== id));
    else onSelectChange([...selectedIds, id]);
  };

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'select',
      header: '',
      width: 40,
      cell: (u) => (
        <button
          type="button"
          onClick={() => toggleOne(u.id)}
          className="action-btn"
          style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}
          aria-label="Chọn"
        >
          {selectedIds.includes(u.id) ? (
            <CheckSquare size={14} color="var(--primary)" />
          ) : (
            <Square size={14} color="var(--gray-400)" />
          )}
        </button>
      ),
    },
    {
      key: 'name',
      header: 'Người dùng',
      sortable: true,
      cell: (u) => (
        <div>
          <div
            style={{
              fontWeight: 600,
              color: 'var(--gray-800)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {u.name}
            {u.id === currentUserId && (
              <span
                style={{
                  padding: '1px 6px',
                  background: 'var(--success-faint, #D1FAE5)',
                  color: 'var(--success, #10B981)',
                  borderRadius: 999,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                }}
              >
                Bạn
              </span>
            )}
            {u.impersonatedBy && (
              <span
                style={{
                  padding: '1px 6px',
                  background: 'var(--warning-faint, #FEF3C7)',
                  color: 'var(--warning, #D97706)',
                  borderRadius: 999,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                }}
              >
                Đang giả lập
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{u.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      width: 130,
      cell: (u) => {
        const roleKey = (u.role ?? 'USER') as FrontendUserRole;
        return <StatusBadge variant={ROLE_VARIANT[roleKey] as StatusVariant} label={ROLE_LABELS[roleKey] ?? u.role} />;
      },
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      width: 110,
      cell: (u) => (
        <StatusBadge
          variant={u.isActive ? 'green' : 'red'}
          label={u.isActive ? 'Hoạt động' : 'Bị khóa'}
        />
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Đăng nhập cuối',
      width: 140,
      cell: (u) => (
        <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
          {formatDate(u.lastLoginAt)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      width: 110,
      cell: (u) => (
        <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
          {formatDate(u.createdAt).split(' ')[0]}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 240,
      cell: (u) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {canImpersonate && u.isActive && u.id !== currentUserId && u.role !== 'SUPER_ADMIN' && (
            <button
              type="button"
              className="action-btn"
              style={{ padding: '4px 6px' }}
              title="Đăng nhập thay"
              onClick={() => onImpersonate(u)}
            >
              <LogIn size={11} color="var(--blue, #2563EB)" />
            </button>
          )}
          {canWrite && (
            <button
              type="button"
              className="action-btn"
              style={{ padding: '4px 6px' }}
              title="Sua"
              onClick={() => onEdit(u)}
            >
              <Edit3 size={11} />
            </button>
          )}
          <button
            type="button"
            className="action-btn"
            style={{ padding: '4px 6px' }}
            title="Xem hoat dong"
            onClick={() => onViewActivity(u)}
          >
            <Activity size={11} />
          </button>
          {canWrite && u.id !== currentUserId && (
            <button
              type="button"
              className="action-btn"
              style={{ padding: '4px 6px' }}
              title="Reset mật khẩu"
              onClick={() => onResetPassword(u)}
            >
              <KeyRound size={11} color="var(--blue, #2563EB)" />
            </button>
          )}
          {canWrite && u.id !== currentUserId && (
            <button
              type="button"
              className="action-btn"
              style={{ padding: '4px 6px' }}
              title={u.isActive ? 'Khóa' : 'Mở khóa'}
              onClick={() => onToggleStatus(u)}
            >
              {u.isActive ? (
                <Lock size={11} color="var(--warning, #D97706)" />
              ) : (
                <Unlock size={11} color="var(--success, #10B981)" />
              )}
            </button>
          )}
          {canDelete && u.id !== currentUserId && u.role !== 'SUPER_ADMIN' && (
            <button
              type="button"
              className="action-btn"
              style={{ padding: '4px 6px' }}
              title="Xóa"
              onClick={() => onDelete(u)}
            >
              <Trash2 size={11} color="var(--danger, #DC2626)" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {data.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            padding: '6px 10px',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-md, 6px)',
            fontSize: '0.78rem',
          }}
        >
          <button
            type="button"
            onClick={toggleAll}
            className="action-btn"
            style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {allSelected ? (
              <CheckSquare size={14} color="var(--primary)" />
            ) : someSelected ? (
              <CheckSquare size={14} color="var(--primary)" style={{ opacity: 0.5 }} />
            ) : (
              <Square size={14} color="var(--gray-400)" />
            )}
          </button>
          <span style={{ color: 'var(--gray-600)' }}>
            {selectedIds.length > 0
              ? `Đã chọn ${selectedIds.length} / ${data.length}`
              : `${data.length} users`}
          </span>
        </div>
      )}
      <DataTableV2<AdminUser>
        columns={columns}
        data={data}
        isLoading={isLoading}
        rowKey={(u) => u.id}
        emptyTitle="Chưa có user nào"
        emptyDescription="Tạo tài khoản đầu tiên cho đội ngũ admin."
      />
    </div>
  );
}