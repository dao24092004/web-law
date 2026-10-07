// lib/api/admin-content.ts
// Posts, documents, audit log, chatbot sessions, reports, CRM.

import { api } from './hooks';
import type { PageResponse } from './hooks';

export interface Post {
  id: string;
  slug: string;
  title?: string;
  excerpt?: string;
  content?: string;
  thumbnailUrl?: string;
  ogImageUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  scheduledAt?: string;
  authorId: string;
  authorName?: string;
  categoryId?: string;
  categoryName?: string;
  views: number;
  readingTime?: number;
  isFeatured?: boolean;
  language?: string;
  metaTitle?: string;
  metaDesc?: string;
  tags?: string[];
  lawyerIds?: string[];
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export const postApi = {
  list: (params?: {
    page?: number;
    size?: number;
    status?: string;
  }) => api.get<PageResponse<Post>>(`/admin/posts`, params),

  get: (id: string) => api.get<Post>(`/admin/posts/${id}`),

  create: (body: Partial<Post>) => api.post<Post>(`/admin/posts`, body),

  update: (id: string, body: Partial<Post>) => api.put<Post>(`/admin/posts/${id}`, body),

  archive: (id: string) => api.patch<Post>(`/admin/posts/${id}/archive`, {}),

  schedule: (id: string, atIso: string) =>
    api.patch<Post>(`/admin/posts/${id}/schedule?at=${encodeURIComponent(atIso)}`, {}),

  recordRevision: (id: string, note?: string) =>
    api.post<void>(`/admin/posts/${id}/revisions?note=${encodeURIComponent(note ?? '')}`, {}),

  delete: (id: string) => api.del<void>(`/admin/posts/${id}`),

  revisions: (id: string, page = 0, size = 20) =>
    api.get<PageResponse<unknown>>(`/admin/posts/${id}/revisions`, { page, size }),

};

export interface Document {
  id: string;
  fileName: string;
  title?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  serviceId?: string;
  isPublic: boolean;
  downloadCount: number;
  createdAt?: string;
}

export const documentApi = {
  list: (params?: { serviceId?: string }) =>
    api.get<Document[]>(`/admin/documents`, params),

  upload: (input: {
    file: File;
    title?: string;
    serviceId?: string;
    isPublic?: boolean;
  }) => {
    const form = new FormData();
    form.append('file', input.file);
    if (input.title) form.append('title', input.title);
    if (input.serviceId) form.append('serviceId', input.serviceId);
    if (input.isPublic !== undefined) form.append('isPublic', String(input.isPublic));
    return api.post<Document>(`/admin/documents`, form);
  },

  delete: (id: string) => api.del<void>(`/admin/documents/${id}`),
};

export const auditLogApi = {
  list: (params?: {
    page?: number;
    size?: number;
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    from?: string;
    to?: string;
  }) => api.get<PageResponse<import('./admin-dashboard').ActivityLog>>(
    `/admin/audit-logs`, params),

  exportCsvUrl: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    return `${base}/admin/audit-logs/export/csv${qs.toString() ? '?' + qs : ''}`;
  },
};

// ============================================================
// Lead pipeline stats
// ============================================================

export interface LeadPipelineStats {
  total: number;
  newCount: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
  conversionRate: number;
}

export const leadPipelineApi = {
  stats: () => api.get<LeadPipelineStats>(`/crm/leads/pipeline`),
};

// ============================================================
// Notifications
// ============================================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
  channels?: ('in_app' | 'email' | 'sms')[];
}

export const notificationApi = {
  list: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<Notification>>(`/notifications`, params),

  unreadCount: () =>
    api.get<{ count: number }>(`/notifications/unread-count`),

  markRead: (id: string) =>
    api.patch<{ ok: boolean }>(`/notifications/${id}/read`, {}),

  markAllRead: () =>
    api.patch<{ updated: number }>(`/notifications/read-all`, {}),
};

export const reportsApi = {
  revenue: (range: string, groupBy = 'day') =>
    api.get<import('./admin-dashboard').TimeSeriesPoint[]>(
      `/admin/reports/revenue`, { range, groupBy }),

  conversion: (range: string) =>
    api.get<Record<string, unknown>>(`/admin/reports/conversion`, { range }),

  lawyerPerformance: (params?: { from?: string; to?: string }) =>
    api.get<Array<Record<string, unknown>>>(`/admin/reports/lawyer-performance`, params),

  serviceTrends: (range: string) =>
    api.get<import('./admin-dashboard').DistributionSlice[]>(
      `/admin/reports/service-trends`, { range }),

  exportCsvUrl: (reportType: string, range: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    return `${base}/admin/reports/export/${reportType}?range=${range}`;
  },
};

// ============================================================
// Categories
// ============================================================

export interface Category {
  id: string;
  slug: string;
  parentId?: string | null;
  displayOrder?: number;
  metaTitle?: string;
  metaDesc?: string;
  metaTitleVi?: string;
  metaTitleEn?: string;
  metaDescVi?: string;
  metaDescEn?: string;
  /** UI-only denormalised counter (filled by the admin client). */
  postCount?: number;
  /** Convenience display name (taken from metaTitleVi when present). */
  name?: string;
}

export interface CategoryCreateRequest {
  slug: string;
  parentId?: string | null;
  metaTitleVi: string;
  metaTitleEn?: string;
  metaDescVi?: string;
  metaDescEn?: string;
  displayOrder?: number;
}

export const categoryApi = {
  list: () => api.get<Category[]>(`/admin/categories`),
  listRoot: () => api.get<Category[]>(`/admin/categories/root`),
  get: (id: string) => api.get<Category>(`/admin/categories/${id}`),
  create: (body: CategoryCreateRequest) =>
    api.post<Category>(`/admin/categories`, body),
  update: (id: string, body: Partial<CategoryCreateRequest>) =>
    api.put<Category>(`/admin/categories/${id}`, body),
  delete: (id: string) => api.del<void>(`/admin/categories/${id}`),
};

// ============================================================
// Tags
// ============================================================

export interface Tag {
  id?: string;
  slug: string;
  name?: string;
  postCount?: number;
}

export const tagApi = {
  list: () => api.get<Tag[]>(`/admin/tags`),
  get: (slug: string) => api.get<Tag>(`/admin/tags/${slug}`),
  create: (body: { slug: string; name?: string }) =>
    api.post<Tag>(`/admin/tags`, body),
  update: (slug: string, body: { slug?: string; name?: string }) =>
    api.put<Tag>(`/admin/tags/${slug}`, body),
  delete: (slug: string) => api.del<void>(`/admin/tags/${slug}`),
};
