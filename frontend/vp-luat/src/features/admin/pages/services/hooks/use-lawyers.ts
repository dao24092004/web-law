'use client';

/* eslint-disable react-hooks/preserve-manual-memoization -- derived API data uses intentional memoization */

import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/lib/api/hooks';
import { ghiAudit, notifySuccess, notifyError } from '@/features/admin/lib';

// Re-export Service type so components can import from one place
export type { Service } from './use-services';
export type { Lawyer } from './use-services';

import type { Service, Lawyer } from './use-services';
import { mapToLawyer } from './use-services';

// ─── Query hooks ───────────────────────────────────────────────────────────────

export interface LawyerFilter {
  search?: string;
  isActive?: boolean;
  positionVi?: string;
  serviceId?: string;
  page?: number;
  size?: number;
}

export function useLawyers(filter: LawyerFilter = {}) {
  const params: Record<string, string | number | boolean> = {
    page: filter.page ?? 0,
    size: filter.size ?? 100, // admin page needs all to compute counts
  };
  if (filter.search && filter.search.trim()) params.search = filter.search.trim();
  if (typeof filter.isActive === 'boolean') params.isActive = filter.isActive;
  if (filter.positionVi && filter.positionVi.trim()) params.positionVi = filter.positionVi.trim();
  if (filter.serviceId) params.serviceId = filter.serviceId;

  const { data: pageData, error, ...rest } = useApiQuery<Record<string, unknown>>(
    ['lawyers', JSON.stringify(params)],
    '/admin/lawyers',
    params,
  );

  // Backend returns PageResponse<LawyerDTO>: { content: LawyerDTO[], page, size,
  // totalElements, totalPages, ... }.  Older clients may still hit the legacy
  // List endpoint (during the rollout window) which returned a bare array —
  // we accept both shapes.
  const rawList = useMemo<unknown[]>(
    () => (Array.isArray(pageData)
      ? pageData
      : Array.isArray((pageData as { content?: unknown[] } | undefined)?.content)
        ? (pageData as { content: unknown[] }).content
        : []),
    [pageData],
  );

  const data = useMemo(() => {
    return (rawList as Record<string, unknown>[]).map(mapToLawyer);
  }, [rawList]);

  const counts = useMemo(() => {
    const c = { total: data.length, active: 0, inactive: 0 };
    for (const l of data) {
      if (l.isActive) c.active += 1;
      else c.inactive += 1;
    }
    return c;
  }, [data]);

  const totalElements =
    (pageData as { totalElements?: number } | undefined)?.totalElements ?? data.length;

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[useLawyers] API error:', error, 'params:', params);
  }

  return { data, counts, totalElements, pageData, error, ...rest };
}

export function useLawyer(id: string | null | undefined) {
  const { data } = useApiQuery<Lawyer>(
    ['lawyers'],
    id ? `/admin/lawyers/${id}` : '/admin/lawyers',
    undefined,
    { enabled: Boolean(id) },
  );
  return data ?? null;
}

export function useLawyerServices(lawyerId: string | null | undefined) {
  const { data: services = [] } = useApiQuery<Service[]>(
    ['services'],
    '/admin/services',
    undefined,
  );
  if (!lawyerId) return [];
  return services.filter((s) => s.lawyerIds?.includes(lawyerId));
}

export function useActiveLawyers() {
  const { data: lawyers = [] } = useApiQuery<Lawyer[]>(
    ['lawyers'],
    '/admin/lawyers',
    undefined,
  );
  return useMemo(() => lawyers.filter((l) => l.isActive), [lawyers]);
}

// ─── CRUD mutations ────────────────────────────────────────────────────────────

export function useCreateLawyer() {
  const qc = useQueryClient();

  const mutation = useApiMutation<Record<string, unknown>, Record<string, unknown>>(
    'POST',
    '/admin/lawyers',
    {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ['lawyers'] });
        const mapped = mapToLawyer(data);
        ghiAudit({
          action: 'create',
          entity: 'lawyer',
          entityId: mapped.id,
          entityLabel: mapped.name,
        });
        // Notification được handle ở caller (index.tsx) để tránh double notify
        // Caller nhận data để hiển thị defaultPassword nếu có
      },
      onError: () => {
        // Error notification được handle ở caller
      },
    },
  );

  return Object.assign(
    (body: Record<string, unknown>) => {
      // body đã là payload đã mapped từ index.tsx - không cần map lại
      return new Promise<Record<string, unknown>>((resolve, reject) => {
        mutation.mutate(body, {
          onSuccess: (data) => resolve(data),
          onError: (err) => reject(err),
        });
      });
    },
    { isPending: mutation.isPending },
  );
}

export function useUpdateLawyer() {
  const qc = useQueryClient();

  // Dùng PATCH để update partial - tránh mất field khi FE không gửi đầy đủ
  // body đã là payload đã mapped từ index.tsx (có nameVi, nameEn, positionVi,...)
  const mutation = useApiMutation<Record<string, unknown>, { id: string; body: Record<string, unknown> }>(
    'PATCH',
    (vars) => `/admin/lawyers/${vars.id}`,
    {
      onSuccess: (data, vars) => {
        qc.invalidateQueries({ queryKey: ['lawyers'] });
        const mapped = mapToLawyer(data);
        ghiAudit({
          action: 'update',
          entity: 'lawyer',
          entityId: vars.id,
          entityLabel: mapped.name,
        });
        // Notification được handle ở caller (index.tsx)
      },
      onError: (e) => {
        // Error notification được handle ở caller (index.tsx)
      },
    },
  );

  return Object.assign(
    useCallback(
      (id: string, body: Record<string, unknown>) => {
        // body đã là payload đã mapped - gửi trực tiếp
        mutation.mutate({ id, body });
      },
      [mutation],
    ),
    { isPending: mutation.isPending },
  );
}

export function useDeleteLawyer() {
  const qc = useQueryClient();

  const mutation = useApiMutation<void, string>(
    'DELETE',
    (id: string) => `/admin/lawyers/${id}`,
    {
      onSuccess: (_, id) => {
        qc.invalidateQueries({ queryKey: ['lawyers'] });
        ghiAudit({
          action: 'delete',
          entity: 'lawyer',
          entityId: id,
          entityLabel: 'lawyer',
        });
        notifySuccess('Đã xóa luật sư');
      },
      onError: () => {
        // Error notification được handle ở caller
      },
    },
  );

  return useCallback(
    (id: string) => mutation.mutate(id),
    [mutation],
  );
}
