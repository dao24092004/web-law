'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  X,
  Mail,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { AdminPageHeader, SearchBar, FilterTabs } from '@/features/admin/shared';
import { useBookingUpcomingAlerts } from './lib/use-booking-upcoming-alerts';
import { NotificationItem } from '@/features/admin/layout/notification-item';
import { useApiMutation, useApiQuery, type PageResponse } from '@/lib/api/hooks';
import { type Notification } from '@/lib/api';
import type { AdminNotification } from '@/features/admin/store';

const TYPE_TABS: Array<{ value: string; label: string; types: AdminNotification['type'][] }> = [
  { value: 'all', label: 'Tất cả', types: [] },
  {
    value: 'business',
    label: 'Nghiệp vụ',
    types: ['lead_new', 'booking_upcoming', 'booking_cancelled', 'review_new', 'campaign_sent'],
  },
  { value: 'system', label: 'Hệ thống', types: ['system', 'success', 'error', 'warning', 'info'] },
  { value: 'unread', label: 'Chưa đọc', types: [] },
];

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  in_app: <Bell size={12} />,
  email: <Mail size={12} />,
  // sms: <Smartphone size={12} />, // disabled - webhook not configured
};

const CHANNEL_LABELS: Record<string, string> = {
  in_app: 'In-app',
  email: 'Email',
  // sms: 'SMS', // disabled - webhook not configured
};

export default function NotificationsPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  useBookingUpcomingAlerts();

  const notificationsQuery = useApiQuery<PageResponse<Notification>>(
    ['admin-notifications'],
    '/notifications',
    { page: 0, size: 100 },
  );

  useEffect(() => {
    const timer = window.setInterval(() => notificationsQuery.refetch(), 30_000);
    return () => window.clearInterval(timer);
  }, [notificationsQuery.refetch]);
  const notifications = notificationsQuery.data?.content ?? [];
  const markReadMutation = useApiMutation<{ ok: boolean }, { id: string }>(
    'PATCH',
    ({ id }) => `/notifications/${id}/read`,
    { onSuccess: () => notificationsQuery.refetch() },
  );
  const markAllReadMutation = useApiMutation<{ updated: number }, void>(
    'PATCH',
    '/notifications/read-all',
    { onSuccess: () => notificationsQuery.refetch() },
  );

  const toAdminNotification = (notification: Notification): AdminNotification => ({
    id: notification.id,
    type: notification.type as AdminNotification['type'],
    title: notification.title,
    message: notification.message,
    link: notification.link,
    read: notification.isRead,
    createdAt: notification.createdAt,
  });
  const apiNotifications: AdminNotification[] = notifications.map(toAdminNotification);

  const counts = useMemo(() => {
    const r = {
      all: apiNotifications.length,
      business: 0,
      system: 0,
      unread: 0,
    };
    for (const n of apiNotifications) {
      if (!n.read) r.unread++;
      if (
        ['lead_new', 'booking_upcoming', 'booking_cancelled', 'review_new', 'campaign_sent'].includes(
          n.type,
        )
      ) {
        r.business++;
      } else {
        r.system++;
      }
    }
    return r;
  }, [apiNotifications]);

  const filtered = useMemo(() => {
    let r = apiNotifications;
    if (tab === 'unread') r = r.filter((n) => !n.read);
    if (tab === 'business') {
      r = r.filter((n) =>
        ['lead_new', 'booking_upcoming', 'booking_cancelled', 'review_new', 'campaign_sent'].includes(
          n.type,
        ),
      );
    }
    if (tab === 'system') {
      r = r.filter((n) =>
        ['system', 'success', 'error', 'warning', 'info'].includes(n.type),
      );
    }
    if (channelFilter !== 'all') {
      r = r.filter((n) => n.channels?.includes(channelFilter as 'in_app' | 'email' | 'sms'));
    }
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (n) => n.title.toLowerCase().includes(q) || (n.message?.toLowerCase().includes(q) ?? false),
      );
    }
    return r;
  }, [apiNotifications, tab, channelFilter, search]);

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate({ id });
  };

  const handleRefresh = () => {
    if (typeof window === 'undefined') return;
    // Clear the dedupe flag so the upcoming-booking alert fires again,
    // then reload so the page refetches everything from the API.
    try {
      window.localStorage.removeItem('vp-luat-booking-upcoming-alert');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Trung tâm thông báo"
        subtitle={`Quản lý tất cả thông báo trong hệ thống — ${counts.unread} chưa đọc / ${counts.all} tổng`}
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="action-btn"
              onClick={handleRefresh}
              title="Làm mới"
              aria-label="Làm mới"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RefreshCw size={12} />
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={() => markAllReadMutation.mutate(undefined)}
              disabled={counts.unread === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <CheckCheck size={12} /> Đánh dấu đã đọc hết
            </button>
          </div>
        }
      />

      <div
        style={{
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div
          className="admin-grid-3col-filter"
          style={{ alignItems: 'end', marginBottom: 12 }}
        >
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm trong tiêu đề / nội dung..." />
          <div>
            <label style={lbl()}>Kênh gửi</label>
            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} style={selStyle()}>
              <option value="all">Tất cả kênh</option>
              <option value="in_app">In-app</option>
              <option value="email">Email</option>
              {/* <option value="sms">SMS</option> disabled - webhook not configured */}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: 'var(--gray-500)' }}>
            <Filter size={12} />
            {filtered.length} / {notifications.length} kết quả
          </div>
        </div>

        <FilterTabs
          tabs={[
            { value: 'all', label: 'Tất cả', count: counts.all },
            { value: 'unread', label: 'Chưa đọc', count: counts.unread },
            { value: 'business', label: 'Nghiệp vụ', count: counts.business },
            { value: 'system', label: 'Hệ thống', count: counts.system },
          ]}
          activeValue={tab}
          onChange={setTab}
        />
      </div>

      <div
        style={{
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: 'center',
              color: 'var(--gray-500)',
              fontSize: '0.85rem',
            }}
          >
            <Bell size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {notifications.length === 0 ? 'Chưa có thông báo nào' : 'Không có kết quả'}
            </div>
            <div style={{ fontSize: '0.78rem' }}>
              {notifications.length === 0
                ? 'Thông báo sẽ tự động xuất hiện khi có sự kiện mới trong hệ thống.'
                : 'Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.'}
            </div>
          </div>
        ) : (
          <div>
            {filtered.map((n) => (
              <div key={n.id} style={{ position: 'relative' }}>
                <NotificationItem
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onRemove={() => undefined}
                />
                {n.channels && n.channels.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 36,
                      display: 'flex',
                      gap: 3,
                    }}
                  >
                    {n.channels.map((c) => (
                      <span
                        key={c}
                        title={CHANNEL_LABELS[c] ?? c}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          padding: '2px 6px',
                          fontSize: '0.65rem',
                          background: 'var(--gray-100)',
                          color: 'var(--gray-600)',
                          borderRadius: 999,
                          fontWeight: 600,
                        }}
                      >
                        {CHANNEL_ICONS[c]} {CHANNEL_LABELS[c] ?? c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: '0.72rem',
          color: 'var(--gray-400)',
          textAlign: 'right',
        }}
      >
        Hệ thống lưu tối đa 50 thông báo gần nhất.
      </div>

    </div>
  );
}

function lbl(): React.CSSProperties {
  return {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--gray-600)',
    marginBottom: 4,
  };
}
function selStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '6px 8px',
    border: '1.5px solid var(--gray-200)',
    borderRadius: 6,
    fontSize: '0.78rem',
    background: 'white',
  };
}