'use client';

import { useApiQuery } from '@/lib/api/hooks';
import { rolesApi, type Role } from '@/lib/api/admin-roles';

export function useRoles() {
  const { data, error, isLoading, refetch } = useApiQuery<Role[]>(
    ['admin', 'roles'],
    '/admin/roles',
    {},
    { retry: false },
  );
  return { data: data ?? [], error, isLoading, refetch };
}
