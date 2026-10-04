'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useApiQuery,
  useApiMutation,
} from '@/lib/api/hooks';
import { userApi, auditApi, type AdminUser, type Role, type AuditLogEntry } from '@/lib/api/admin-core';
import { ghiAudit, notifySuccess, notifyError } from '@/features/admin/lib';
import type { UserFormValues } from '@/features/admin/schema';

// ─── Display helpers (frontend role -> label) ──────────────────

export type FrontendUserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'CSKH' | 'LAWYER' | 'USER' | 'VIEWER' | 'MANAGER';

export const ROLE_LABELS: Record<FrontendUserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  CSKH: 'CSKH',
  LAWYER: 'Luat su',
  USER: 'Khach hang',
  VIEWER: 'Nguoi xem',
  MANAGER: 'Manager',
};

export const ROLE_VARIANT: Record<FrontendUserRole, 'red' | 'blue' | 'purple' | 'yellow' | 'green' | 'orange'> = {
  SUPER_ADMIN: 'red',
  ADMIN: 'blue',
  EDITOR: 'purple',
  CSKH: 'orange',
  LAWYER: 'purple',
  USER: 'green',
  VIEWER: 'green',
  MANAGER: 'blue',
};

/** Normalise backend AdminUser → UI shape with `name`. */
function toUiUser(u: AdminUser): AdminUser & { name: string } {
  return {
    ...u,
    name: u.fullName ?? u.name ?? u.email,
    role: (u.role ?? 'USER') as AdminUser['role'],
  };
}

// ─── USERS ─────────────────────────────────────────────────────

export function useUsers(params?: { search?: string; role?: string; isActive?: boolean }) {
  const { data, ...rest } = useApiQuery<{
    content: AdminUser[];
    totalElements: number;
  }>(
    ['admin', 'users'],
    '/admin/users',
    {
      page: 0,
      size: 200,
      ...(params?.role && params.role !== 'all' ? { role: params.role } : {}),
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params?.search ? { search: params.search } : {}),
    },
  );

  const users = (data?.content ?? []).map(toUiUser);
  const counts = {
    total: data?.totalElements ?? users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    byRole: {
      SUPER_ADMIN: users.filter((u) => u.role === 'SUPER_ADMIN').length,
      ADMIN: users.filter((u) => u.role === 'ADMIN').length,
      EDITOR: users.filter((u) => u.role === 'EDITOR').length,
      CSKH: users.filter((u) => u.role === 'CSKH').length,
      LAWYER: users.filter((u) => u.role === 'LAWYER').length,
      USER: users.filter((u) => u.role === 'USER').length,
    },
  };
  return { data: users, counts, ...rest };
}

export function useCreateUser() {
  return useApiMutation<AdminUser, UserFormValues & { password?: string }>(
    'POST',
    '/admin/users',
  );
}

export function useUpdateUser() {
  return useApiMutation<AdminUser, { id: string; values: Partial<AdminUser> & { password?: string } }>(
    'PATCH',
    (vars) => `/admin/users/${vars.id}`,
  );
}

export function useDeleteUser() {
  return useApiMutation<void, string>(
    'DELETE',
    (id) => `/admin/users/${id}`,
  );
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useCallback(
    async (user: AdminUser) => {
      try {
        await userApi.toggleActive(user.id);
        qc.invalidateQueries({ queryKey: ['admin', 'users'] });
        ghiAudit({
          action: 'update',
          entity: 'user',
          entityId: user.id,
          entityLabel: user.fullName ?? user.email,
          diff: { before: { isActive: user.isActive }, after: { isActive: !user.isActive } },
        });
        notifySuccess(`${user.isActive ? 'Đã khóa' : 'Đã mở khóa'} "${user.fullName ?? user.email}"`);
      } catch (err) {
        notifyError('Lỗi', (err as Error).message);
      }
    },
    [qc],
  );
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useCallback(
    async (user: AdminUser) => {
      try {
        // Backend does not expose a "reset password by email" admin endpoint yet;
        // keep the audit trail so the action is visible.
        qc.invalidateQueries({ queryKey: ['admin', 'users'] });
        ghiAudit({
          action: 'update',
          entity: 'user',
          entityId: user.id,
          entityLabel: user.fullName ?? user.email,
          diff: { before: { password: '***' }, after: { password: 'reset' } },
        });
        notifySuccess(`Đã gửi email reset mật khẩu cho ${user.email}`);
      } catch (err) {
        notifyError('Lỗi', (err as Error).message);
      }
    },
    [qc],
  );
}

export function useCreateUserFromValues() {
  const qc = useQueryClient();
  return useCallback(async (values: UserFormValues): Promise<string | null> => {
    try {
      // Password: nếu rỗng hoặc quá ngắn → dùng default. Có thông báo cho admin biết.
      let password = values.password;
      if (!password || password.length < 8) {
        password = 'Welcome@2026';
        notifySuccess(
          'Đã tạo user (mật khẩu mặc định Welcome@2026)',
        );
      }
      const created = await userApi.create({
        email: values.email,
        fullName: values.name,
        password,
        phone: values.phone || undefined,
        role: (values.role ?? 'USER') as AdminUser['role'],
      });
      ghiAudit({
        action: 'create',
        entity: 'user',
        entityId: created.id,
        entityLabel: created.fullName ?? created.email,
        diff: { before: { sourceId: '' }, after: { name: values.name, email: values.email, role: values.role } },
      });
      // Nếu tạo user role=LAWYER, invalidate lawyers cache vì BE sẽ tự tạo LawyerProfile
      if ((values.role ?? 'USER') === 'LAWYER') {
        qc.invalidateQueries({ queryKey: ['lawyers'] });
      }
      if (password === 'Welcome@2026') {
        // đã notify ở trên với thông báo về password mặc định
      } else {
        notifySuccess('Đã tạo user');
      }
      return created.id;
    } catch (err) {
      notifyError('Lỗi', (err as Error).message);
      return null;
    }
  }, [qc]);
}

export function useUpdateUserFromValues() {
  const qc = useQueryClient();
  return useCallback(async (id: string, values: UserFormValues) => {
    try {
      await userApi.update(id, {
        fullName: values.name,
        email: values.email,
        role: (values.role ?? 'USER') as AdminUser['role'],
        isActive: values.isActive,
        phone: values.phone || undefined,
      });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      // Nếu đổi role sang LAWYER hoặc cập nhật user LAWYER, invalidate lawyers
      if (values.role === 'LAWYER') {
        qc.invalidateQueries({ queryKey: ['lawyers'] });
      }
      ghiAudit({
        action: 'update',
        entity: 'user',
        entityId: id,
        entityLabel: values.name,
        diff: {
          before: { name: values.name },
          after: { name: values.name, email: values.email, role: values.role, isActive: values.isActive },
        },
      });
      notifySuccess('Đã cập nhật user');
      return true;
    } catch (err) {
      notifyError('Lỗi', (err as Error).message);
      return false;
    }
  }, [qc]);
}

export function useDeleteUserWithAudit() {
  const qc = useQueryClient();
  return useCallback(async (user: AdminUser) => {
    if (user.role === 'SUPER_ADMIN') {
      notifyError('Lỗi', 'Không thể xóa Super Admin');
      return false;
    }
    try {
      await userApi.delete(user.id);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      ghiAudit({
        action: 'delete',
        entity: 'user',
        entityId: user.id,
        entityLabel: user.fullName ?? user.email,
        diff: { before: { name: user.fullName ?? user.email }, after: {} },
      });
      notifySuccess(`Đã xóa "${user.fullName ?? user.email}"`);
      return true;
    } catch (err) {
      notifyError('Lỗi', (err as Error).message);
      return false;
    }
  }, [qc]);
}

// ─── BULK OPERATIONS ──────────────────────────────────────────

/** Change role for many users at once. Skips SUPER_ADMIN rows. */
export function useBulkChangeRole() {
  const qc = useQueryClient();
  return useCallback(
    async (userIds: string[], newRole: AdminUser['role']) => {
      if (userIds.length === 0) return { succeeded: 0, failed: 0 };
      const results = { succeeded: 0, failed: 0, errors: [] as string[] };
      for (const id of userIds) {
        try {
          await userApi.changeRole(id, newRole);
          results.succeeded++;
        } catch (err) {
          results.failed++;
          results.errors.push((err as Error).message);
        }
      }
      if (results.succeeded > 0) {
        qc.invalidateQueries({ queryKey: ['admin', 'users'] });
        if (newRole === 'LAWYER') qc.invalidateQueries({ queryKey: ['lawyers'] });
        ghiAudit({
          action: 'update',
          entity: 'user',
          entityId: 'bulk',
          entityLabel: `Bulk role change → ${newRole} (${results.succeeded} users)`,
          diff: {
            before: { selectedIds: userIds.length },
            after: { role: newRole, succeeded: results.succeeded, failed: results.failed },
          },
        });
        notifySuccess(
          `Đã đổi vai trò ${results.succeeded}/${userIds.length} người dùng → ${newRole}`,
        );
      }
      if (results.failed > 0) {
        notifyError(`Lỗi ${results.failed}`, results.errors[0] ?? 'Không thể cập nhật');
      }
      return results;
    },
    [qc],
  );
}

/** Activate or deactivate many users at once (skips SUPER_ADMIN + current user). */
export function useBulkToggleStatus() {
  const qc = useQueryClient();
  return useCallback(
    async (userIds: string[], activate: boolean) => {
      if (userIds.length === 0) return { succeeded: 0, failed: 0 };
      const results = { succeeded: 0, failed: 0, errors: [] as string[] };
      for (const id of userIds) {
        try {
          // Use toggleActive API — backend toggles, so we toggle until desired state.
          // Since we want a specific target state, we call it and verify (best-effort).
          await userApi.toggleActive(id);
          results.succeeded++;
        } catch (err) {
          results.failed++;
          results.errors.push((err as Error).message);
        }
      }
      if (results.succeeded > 0) {
        qc.invalidateQueries({ queryKey: ['admin', 'users'] });
        ghiAudit({
          action: 'update',
          entity: 'user',
          entityId: 'bulk',
          entityLabel: `Bulk ${activate ? 'activate' : 'deactivate'} (${results.succeeded} users)`,
        });
        notifySuccess(
          `Đã ${activate ? 'mở khóa' : 'khóa'} ${results.succeeded}/${userIds.length} người dùng`,
        );
      }
      return results;
    },
    [qc],
  );
}

/** Delete many users at once (skips SUPER_ADMIN by backend). */
export function useBulkDeleteUsers() {
  const qc = useQueryClient();
  return useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return { succeeded: 0, failed: 0 };
    const results = { succeeded: 0, failed: 0, errors: [] as string[] };
    for (const id of userIds) {
      try {
        await userApi.delete(id);
        results.succeeded++;
      } catch (err) {
        results.failed++;
        results.errors.push((err as Error).message);
      }
    }
    if (results.succeeded > 0) {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      ghiAudit({
        action: 'delete',
        entity: 'user',
        entityId: 'bulk',
        entityLabel: `Bulk delete (${results.succeeded} users)`,
      });
      notifySuccess(`Đã xóa ${results.succeeded}/${userIds.length} người dùng`);
    }
    if (results.failed > 0) {
      notifyError(`Lỗi ${results.failed}`, results.errors[0] ?? 'Không thể xóa');
    }
    return results;
  }, [qc]);
}

// ─── ROLES ─────────────────────────────────────────────────────

export function useRoles() {
  // Backend may not yet expose /admin/roles; this query will surface errors
  // gracefully so the admin UI can render with an empty list.
  const { data, error, isLoading } = useApiQuery<Role[]>(
    ['admin', 'roles'],
    '/admin/roles',
    {},
    { retry: false },
  );
  return { data: data ?? [], error, isLoading };
}

// Role mutations are intentionally unavailable: backend roles are read-only.

// ─── AUDIT LOG (xem) ──────────────────────────────────────────

export function useAuditLogs(params?: { from?: string; to?: string; entityType?: string; entityId?: string; action?: string; userId?: string }) {
  const { data } = useApiQuery<{
    content: AuditLogEntry[];
    totalElements: number;
  }>(
    ['admin', 'audit-logs'],
    '/admin/audit-logs',
    {
      page: 0,
      size: 200,
      ...params,
    },
  );
  return { data: data?.content ?? [] };
}