'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/lib/api/hooks';
import { ghiAudit, notifySuccess, notifyError } from '@/features/admin/lib';

// ─── Types matching backend ServiceDTO ───────────────────────────
export interface Service {
  id: string;
  name: string;
  description: string;
  price?: number;
  duration?: number;
  category: string;
  isActive: boolean;
  lawyerIds: string[];
  createdAt: string;
}

// ─── Types matching backend LawyerDTO ─────────────────────────────
export interface Lawyer {
  id: string;
  slug: string;
  userId?: string;
  userEmail?: string;
  name: string;
  nameVi?: string;
  nameEn?: string;
  title: string;
  positionVi?: string;
  positionEn?: string;
  bio: string;
  bioVi?: string;
  bioEn?: string;
  avatar?: string;
  specialties: string[];
  barNumber?: string;
  email: string;
  phone: string;
  experience: number;
  serviceIds: string[];
  /**
   * Tên hiển thị của các dịch vụ (cùng thứ tự với serviceIds).
   * Populate từ BE qua `LawyerDTO.serviceNames` để tránh FE phải tự lookup.
   * Nếu serviceIds[i] không tồn tại trong bảng services thì serviceNames[i] = null.
   */
  serviceNames?: (string | null)[];
  workingHours?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  createdByName?: string;
}

// ─── Backend response shape ─────────────────────────────────────
interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ─── Mappers from raw API shape to page-expected shape ──────────

function mapToService(raw: Record<string, unknown>): Service {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? raw.slug ?? ''),
    description: typeof raw.description === 'string' ? raw.description : '',
    price: typeof raw.price === 'number' || typeof raw.price === 'string'
      ? Number(raw.price)
      : undefined,
    duration: typeof raw.duration === 'number' || typeof raw.duration === 'string'
      ? Number(raw.duration)
      : undefined,
    category: String(raw.category ?? raw.parentName ?? ''),
    isActive: Boolean(raw.isActive ?? true),
    lawyerIds: (Array.isArray(raw.lawyerIds) ? raw.lawyerIds : []) as string[],
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export function mapToLawyer(raw: Record<string, unknown>): Lawyer {
  const arr = Array.isArray(raw.languages) ? raw.languages : [];
  return {
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? ''),
    userId: raw.userId ? String(raw.userId) : undefined,
    userEmail: raw.userEmail ? String(raw.userEmail) : undefined,
    name: String(raw.nameVi ?? raw.nameEn ?? ''),
    nameVi: raw.nameVi ? String(raw.nameVi) : undefined,
    nameEn: raw.nameEn ? String(raw.nameEn) : undefined,
    title: String(raw.positionVi ?? raw.positionEn ?? ''),
    positionVi: raw.positionVi ? String(raw.positionVi) : undefined,
    positionEn: raw.positionEn ? String(raw.positionEn) : undefined,
    bio: String(raw.bioVi ?? raw.bioEn ?? ''),
    bioVi: raw.bioVi ? String(raw.bioVi) : undefined,
    bioEn: raw.bioEn ? String(raw.bioEn) : undefined,
    avatar: (raw.avatarUrl as string | null) ?? undefined,
    specialties: arr as string[],
    barNumber: raw.barNumber ? String(raw.barNumber) : undefined,
    email: String(raw.userEmail ?? ''),
    phone: String(raw.phone ?? ''),
    experience: Number(raw.experienceYears ?? 0),
    serviceIds: Array.isArray(raw.serviceIds) ? (raw.serviceIds as string[]) : [],
    serviceNames: Array.isArray(raw.serviceNames)
      ? (raw.serviceNames as (string | null)[])
      : undefined,
    workingHours: (raw.workingHours as Record<string, unknown>) ?? undefined,
    // BE uses isFeatured to mean "is active" — true = Hoạt động, false = Tạm dừng
    isActive: raw.isFeatured !== false,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    createdByName: (raw.createdByName as string | null) ?? undefined,
  };
}

// ─── Query hooks ─────────────────────────────────────────────────

export interface ServiceFilter {
  search?: string;
  isActive?: boolean;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export function useServices(filter: ServiceFilter = {}) {
  const params: Record<string, string | number | boolean> = {
    page: filter.page ?? 0,
    size: filter.size ?? 200,
  };
  if (filter.search && filter.search.trim()) params.search = filter.search.trim();
  if (typeof filter.isActive === 'boolean') params.isActive = filter.isActive;
  if (filter.category && filter.category !== 'all' && filter.category.trim())
    params.category = filter.category.trim();
  if (filter.dateFrom) params.dateFrom = filter.dateFrom;
  if (filter.dateTo) params.dateTo = filter.dateTo;

  const { data, error, ...rest } = useApiQuery<PageResponse<Record<string, unknown>>>(
    ['services', JSON.stringify(params)],
    '/admin/services',
    params,
  );

  // The API response is normalized once so the table and counters share the same objects.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const services = useMemo(() => {
    return (data?.content ?? []).map(mapToService);
  }, [data?.content]);

  const counts = useMemo(() => {
    const c = { total: services.length, active: 0, inactive: 0 };
    for (const s of services) {
      if (s.isActive) c.active += 1;
      else c.inactive += 1;
    }
    return c;
  }, [services]);

  // Surface API error so the UI can show it instead of silently rendering empty.
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[useServices] API error:', error, 'params:', params);
  }

  return {
    data: services,
    counts,
    totalElements: data?.totalElements ?? services.length,
    error,
    ...rest,
  };
}

export function useService(id: string | null | undefined) {
  const { data } = useApiQuery<Service>(
    ['services'],
    id ? `/admin/services/${id}` : '/admin/services',
    undefined,
    { enabled: Boolean(id) },
  );
  return data ?? null;
}

export function useServiceLawyers(serviceId: string | null | undefined) {
  const { data: lawyers = [] } = useApiQuery<Lawyer[]>(
    ['lawyers'],
    '/admin/lawyers',
    undefined,
  );
  if (!serviceId) return [];
  return lawyers.filter((l) => l.serviceIds?.includes(serviceId));
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SERVICE_CATEGORIES = [
  'Doanh nghiệp',
  'Pháp luật',
  'Nhà đất',
  'Sở hữu trí tuệ',
  'Gia đình',
  'Hợp đồng',
  'Thương mại',
  'Lao động',
  'Hình sự',
  'Hành chính',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

// ─── CRUD mutations ────────────────────────────────────────────────────────────

export function useCreateService() {
  const qc = useQueryClient();

  const mutation = useApiMutation<Record<string, unknown>, Omit<Service, 'id'>>(
    'POST',
    '/admin/services',
    {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ['services'] });
        const mapped = mapToService(data);
        ghiAudit({
          action: 'create',
          entity: 'service',
          entityId: mapped.id,
          entityLabel: mapped.name,
        });
        // Notification được handle ở caller
      },
      onError: () => {
        // Error notification được handle ở caller
      },
    },
  );

  return mutation;
}

export function useUpdateService() {
  const qc = useQueryClient();

  const mutation = useApiMutation<Record<string, unknown>, { id: string; body: Partial<Omit<Service, 'id'>> }>(
    'PUT',
    (vars) => `/admin/services/${vars.id}`,
    {
      onSuccess: (data, vars) => {
        qc.invalidateQueries({ queryKey: ['services'] });
        const mapped = mapToService(data);
        ghiAudit({
          action: 'update',
          entity: 'service',
          entityId: vars.id,
          entityLabel: mapped.name,
        });
        // Notification được handle ở caller
      },
      onError: () => {
        // Error notification được handle ở caller
      },
    },
  );

  return mutation;
}

export function useDeleteService() {
  const qc = useQueryClient();

  const mutation = useApiMutation<void, string>(
    'DELETE',
    (id: string) => `/admin/services/${id}`,
    {
      onSuccess: (_, id) => {
        qc.invalidateQueries({ queryKey: ['services'] });
        ghiAudit({
          action: 'delete',
          entity: 'service',
          entityId: id,
          entityLabel: 'service',
        });
        // Notification được handle ở caller
      },
      onError: () => {
        // Error notification được handle ở caller
      },
    },
  );

  return mutation;
}
