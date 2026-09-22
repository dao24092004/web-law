// lib/api/admin-dashboard.ts
// Admin dashboard API surface — backend BRS endpoints.

import { api } from './hooks';

// Backend tra LocalDate qua Jackson thanh [YYYY, MM, DD].
export type BackendDate = [number, number, number];

export function backendDateToISO(d: BackendDate | string | null | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  const [y, m, day] = d;
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface DashboardStats {
  // Legacy / top-level counters (DashboardStatsDTO)
  totalLeads?: number;
  newLeads?: number;
  convertedLeads?: number;
  totalAppointments?: number;
  pendingAppointments?: number;
  confirmedAppointments?: number;
  completedAppointments?: number;
  totalPosts?: number;
  publishedPosts?: number;
  totalReviews?: number;
  pendingReviews?: number;
  newsletterSubscribers?: number;
  jobApplications?: number;
  weeklyLeads?: { data: number[]; labels: string[] } | null;
  weeklyAppointments?: { data: number[]; labels: string[] } | null;

  // ERP extension fields
  appointmentsToday?: number;
  appointmentsChange?: number;
  leadsInRange?: number;
  leadsChange?: number;
  conversionRate?: number | string | null;
  conversionChange?: number | string | null;
  chatbotConversations?: number;
  chatbotChange?: number;
  pendingCount?: number;
  cancelledToday?: number;
  completedToday?: number;
  revenue?: number | string | null;
  revenueChange?: number | string | null;
  reviewsAvgRating?: number | string | null;
  reviewsPending?: number;
  range?: string | null;
}

export interface TimeSeriesPoint {
  date: BackendDate;
  value: number;
  label: string;
}

export interface DistributionSlice {
  label: string;
  count: number;
  percentage: number;
}

export interface LeadFunnel {
  total: number;
  contacted: number;
  qualified: number;
  converted: number;
  conversionRate: number;
}

export interface ActivityLog {
  id: string;
  actorName: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  summary: string;
  createdAt: string;
}

export interface AppointmentSummary {
  id: string;
  clientName: string;
  clientPhone: string;
  lawyerName: string | null;
  scheduledAt: string;
  status: string;
  serviceType: string | null;
  notes: string | null;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const adminDashboardApi = {
  /** Top-level counters cho header (legacy endpoint, luon tra ve ERP fields neu co). */
  stats: (range: string) =>
    api.get<DashboardStats>(`/admin/dashboard/stats/range`, { range }),

  visitors: (days = 30) =>
    api.get<TimeSeriesPoint[]>(`/admin/dashboard/charts/visitors`, { days }),

  serviceDistribution: (range: string) =>
    api.get<DistributionSlice[]>(`/admin/dashboard/charts/service-distribution`, { range }),

  leadFunnel: (range: string) =>
    api.get<LeadFunnel>(`/admin/dashboard/charts/lead-funnel`, { range }),

  revenue: (range: string) =>
    api.get<TimeSeriesPoint[]>(`/admin/dashboard/charts/revenue`, { range }),

  activity: (limit = 20) =>
    api.get<ActivityLog[]>(`/admin/dashboard/activity`, { limit }),

  todayAppointments: () =>
    api.get<AppointmentSummary[]>(`/admin/dashboard/appointments/today`),

  exportCsvUrl: (range: string) =>
    `${API_BASE}/admin/dashboard/export/csv?range=${range}`,

  // Reports (ERP)
  reportsRevenue: (range = 'week', groupBy = 'day') =>
    api.get<TimeSeriesPoint[]>(`/admin/reports/revenue`, { range, groupBy }),

  reportsConversion: (range = 'month') =>
    api.get<Record<string, unknown>>(`/admin/reports/conversion`, { range }),

  reportsLawyerPerformance: (from?: string, to?: string) =>
    api.get<Record<string, unknown>[]>(`/admin/reports/lawyer-performance`, {
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }),

  reportsServiceTrends: (range = 'month') =>
    api.get<DistributionSlice[]>(`/admin/reports/service-trends`, { range }),
};
