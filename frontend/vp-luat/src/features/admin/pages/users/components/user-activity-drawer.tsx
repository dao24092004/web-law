'use client';

import { useState } from 'react';
import { Activity, Clock, User, Shield, LogIn, LogOut, Edit3, Plus, Trash2 } from 'lucide-react';
import { Drawer, StatusBadge, type StatusVariant } from '@/features/admin/shared';
import { useApiQuery } from '@/lib/api/hooks';
import type { AdminUser } from '@/lib/api/admin-core';

interface UserActivityDrawerProps {
  user: AdminUser | null;
  onClose: () => void;
}

interface ActivityLog {
  id: string;
  actorName: string;
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  createdAt: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus size={12} />,
  update: <Edit3 size={12} />,
  delete: <Trash2 size={12} />,
  login: <LogIn size={12} />,
  logout: <LogOut size={12} />,
  impersonate: <User size={12} />,
  default: <Activity size={12} />,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'var(--success)',
  update: 'var(--primary)',
  delete: 'var(--danger)',
  login: 'var(--purple)',
  logout: 'var(--purple)',
  impersonate: 'var(--warning)',
  default: 'var(--gray-500)',
};

function getActionIcon(action: string) {
  const lower = action.toLowerCase();
  for (const key of Object.keys(ACTION_ICONS)) {
    if (lower.includes(key)) return ACTION_ICONS[key];
  }
  return ACTION_ICONS.default;
}

function getActionColor(action: string) {
  const lower = action.toLowerCase();
  for (const key of Object.keys(ACTION_COLORS)) {
    if (lower.includes(key)) return ACTION_COLORS[key];
  }
  return ACTION_COLORS.default;
}

export function UserActivityDrawer({ user, onClose }: UserActivityDrawerProps) {
  const [limit, setLimit] = useState(20);

  const { data: activities = [], isLoading } = useApiQuery<ActivityLog[]>(
    ['user', 'activity', user?.id],
    user ? `/admin/users/${user.id}/activity?limit=${limit}` : '',
    {},
    { enabled: !!user, retry: false },
  );

  if (!user) return null;

  return (
    <Drawer
      isOpen={!!user}
      onClose={onClose}
      title={`${user.fullName || user.email}`}
      width={480}
    >
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* User info summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 16,
          padding: 12,
          background: 'var(--gray-50)',
          borderRadius: 8,
        }}>
          <div style={{ fontSize: '0.78rem' }}>
            <div style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>Email</div>
            <div>{user.email}</div>
          </div>
          <div style={{ fontSize: '0.78rem' }}>
            <div style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>Vai tro</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={12} />
              {user.role}
            </div>
          </div>
          <div style={{ fontSize: '0.78rem' }}>
            <div style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>Trang thai</div>
            <StatusBadge
              label={user.isActive ? 'Hoat dong' : 'Bi khoa'}
              variant={user.isActive ? 'green' : 'red'}
            />
          </div>
          <div style={{ fontSize: '0.78rem' }}>
            <div style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>Hoat dong</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Activity size={12} />
              {activities.length} entries
            </div>
          </div>
        </div>

        {/* Activity list */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid var(--gray-200)',
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} />
            Lich su hoat dong
          </div>
          {activities.length >= limit && (
            <button
              onClick={() => setLimit((l) => l + 20)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Tai them
            </button>
          )}
        </div>

        {isLoading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-500)' }}>
            Dang tai...
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
            Chua co hoat dong nao
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {activities.map((activity, i) => {
              const color = getActionColor(activity.action);
              return (
                <div key={activity.id || i} style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid var(--gray-100)',
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: `${color}15`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {activity.summary || activity.action}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: 2 }}>
                      {new Date(activity.createdAt).toLocaleString('vi-VN')}
                      {activity.entityType && (
                        <span> - {activity.entityType}</span>
                      )}
                      {activity.entityId && (
                        <span> #{activity.entityId.slice(0, 8)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
