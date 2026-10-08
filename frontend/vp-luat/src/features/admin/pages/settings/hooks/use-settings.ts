'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/lib/api/hooks';
import { auditApi, type SystemSettings, type AuditLogEntry } from '@/lib/api/admin-core';
import { ghiAudit, notifySuccess, notifyError } from '@/features/admin/lib';

// ─── SETTINGS ─────────────────────────────────────────────────

export interface GeneralSettings {
  siteName: string;
  hotline: string;
  email: string;
  address: string;
  timezone: string;
  defaultLanguage: 'vi' | 'en';
  maintenanceMode: boolean;
}

export interface BookingSettings {
  slotDuration: number;
  bookingLeadTime: number;
  maxBookingsPerDay: number;
  allowOnline: boolean;
  autoConfirm: boolean;
  cancellationPolicy: string;
}

export interface SmtpSettings {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  useTls: boolean;
}

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string;
  faviconUrl: string;
}

export interface IntegrationsSettings {
  sentryDsn: string;
  posthogKey: string;
  googleAnalyticsId: string;
  chatbotWebhookUrl: string;
}

export type SettingsNamespace = 'general' | 'booking' | 'smtp' | 'theme' | 'integrations';

const NS_DEFAULTS: Record<SettingsNamespace, unknown> = {
  general: {
    siteName: 'ICRC Law - Công ty Luật TNHH ICRC',
    hotline: '',
    email: 'icrclawhy@gmail.com',
    address: '',
    timezone: 'Asia/Ho_Chi_Minh',
    defaultLanguage: 'vi',
    maintenanceMode: false,
  },
  booking: {
    slotDuration: 60,
    bookingLeadTime: 24,
    maxBookingsPerDay: 30,
    allowOnline: true,
    autoConfirm: false,
    cancellationPolicy: '24h',
  },
  smtp: {
    fromName: '',
    fromEmail: '',
    replyTo: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    useTls: true,
  },
  theme: {
    primaryColor: '#1E3A5F',
    accentColor: '#C9A84C',
    fontFamily: 'Inter',
    logoUrl: '',
    faviconUrl: '',
  },
  integrations: {
    sentryDsn: '',
    posthogKey: '',
    googleAnalyticsId: '',
    chatbotWebhookUrl: '',
  },
};

/** Fetch one persisted settings namespace with a deterministic default. */
export function useSetting<T extends object>(key: SettingsNamespace, defaults: T) {
  const fallback = (NS_DEFAULTS[key] as T) ?? defaults;
  const { data, isLoading, refetch } = useApiQuery<T>(
    ['admin', 'settings', key],
    `/admin/settings/${key}`,
    {},
    { retry: false },
  );

  return {
    value: data ?? fallback,
    loaded: !isLoading,
    refetch,
  };
}

/** Persist only the active namespace, so tab forms cannot overwrite each other. */
export function useUpdateSetting<T extends object>(key: SettingsNamespace) {
  const qc = useQueryClient();
  const mutation = useApiMutation<T, Partial<T>>('PUT', `/admin/settings/${key}`);

  return useCallback(
    async (newValue: Partial<T>, label = 'Cài đặt hệ thống') => {
      try {
        const before = qc.getQueryData<T>(['admin', 'settings', key]) ?? (NS_DEFAULTS[key] as T);
        await mutation.mutateAsync(newValue);
        await qc.invalidateQueries({ queryKey: ['admin', 'settings', key] });
        ghiAudit({
          action: 'update',
          entity: 'settings',
          entityId: key,
          entityLabel: label,
          diff: {
            before: { value: before as unknown as Record<string, unknown> },
            after: { value: newValue as unknown as Record<string, unknown> },
          },
        });
        notifySuccess(`Đã lưu ${label}`);
        return true;
      } catch (error) {
        notifyError('Lỗi', error instanceof Error ? error.message : 'Không thể lưu');
        return false;
      }
    },
    [key, mutation, qc],
  );
}

// ─── AUDIT LOGS ───────────────────────────────────────────────

export function useGhiAuditWithTrim() {
  const qc = useQueryClient();
  return useCallback(
    (input: Parameters<typeof ghiAudit>[0]) => {
      ghiAudit(input);
      qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
    [qc],
  );
}

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

  return {
    data: (data?.content ?? []).slice().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  };
}

/** Clear audit logs is a privileged op — surface a confirmation, then call backend. */
export function useClearAuditLogs() {
  const qc = useQueryClient();
  return useCallback(async () => {
    try {
      const result = await auditApi.purge();
      await qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      notifySuccess(`Đã xóa ${result.deleted.toLocaleString('vi-VN')} audit log`);
      return true;
    } catch (error) {
      notifyError('Lỗi', error instanceof Error ? error.message : 'Không thể xóa audit log');
      return false;
    }
  }, [qc]);
}

export function useExportAuditLogs() {
  return useCallback((format: 'csv' | 'json', logs: AuditLogEntry[]) => {
    if (typeof window === 'undefined') return;
    const fileName = `audit-log-${new Date().toISOString().slice(0, 10)}.${format}`;
    let blob: Blob;
    if (format === 'csv') {
      const header = 'id,createdAt,actorName,action,entityType,entityId,summary\n';
      const rows = logs
        .map((l) =>
          [
            l.id,
            l.createdAt,
            l.actorName,
            l.action,
            l.entityType ?? '',
            l.entityId ?? '',
            l.summary ?? '',
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(','),
        )
        .join('\n');
      blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    } else {
      blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    ghiAudit({
      action: 'export',
      entity: 'audit_logs',
      entityId: 'export',
      entityLabel: `Exported ${logs.length} logs (${format.toUpperCase()})`,
    });
    notifySuccess(`Đã export ${logs.length} audit log (${format.toUpperCase()})`);
  }, []);
}

/** CSV download URL (backend-served, avoids the localStorage-based path). */
export function auditLogsCsvUrl(params?: { from?: string; to?: string }): string {
  return auditApi.exportCsvUrl(params);
}

/** Re-export so consumers don't need a second import. */
export type { SystemSettings, AuditLogEntry };