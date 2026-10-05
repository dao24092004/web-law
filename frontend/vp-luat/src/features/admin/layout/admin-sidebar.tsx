'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useAdminUIStore } from '@/features/admin/store';
import { ADMIN_NAV_SECTIONS } from '@/features/admin/constants';
import { useSidebarBadges } from '@/features/admin/lib/use-sidebar-badges';
import { Scale, LogOut } from 'lucide-react';
import { clearAuthToken, setLoggingOut, callServerLogout } from '@/lib/api/client';

function getInitials(name?: string | null) {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên',
  LAWYER: 'Luật sư',
};

function LogoutButton() {
  const { closeSidebar } = useAdminUIStore();
  const t = useTranslations('auth');

  const handleLogout = async () => {
    setLoggingOut(true);
    clearAuthToken();
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem('admin-impersonated-user');
        window.sessionStorage.removeItem('vp-luat-admin-current-user');
      } catch {
        // ignore
      }
    }
    closeSidebar();
    await callServerLogout();
    await signOut({ callbackUrl: '/login', redirect: true });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="admin-sidebar__logout"
      aria-label={t('logout')}
    >
      <LogOut size={14} aria-hidden="true" />
      {t('logout')}
    </button>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('admin');
  const { isSidebarOpen, closeSidebar } = useAdminUIStore();
  const badges = useSidebarBadges();
  const { data: session } = useSession();
  const sessionUser = (session?.user as
    | {
        name?: string | null;
        fullName?: string | null;
        role?: string;
        avatarUrl?: string | null;
      }
    | undefined) ?? undefined;

  const userName = sessionUser?.fullName || sessionUser?.name || t('administrator');
  const userRole = ROLE_LABELS[sessionUser?.role ?? ''] || t('administrator');
  const userInitials = getInitials(sessionUser?.fullName || sessionUser?.name);
  const userAvatar = sessionUser?.avatarUrl;

  const getBadge = (item: { badge?: number; badgeSource?: keyof typeof badges }) => {
    if (item.badgeSource) return badges[item.badgeSource] ?? 0;
    return item.badge ?? 0;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-sidebar ${isSidebarOpen ? 'admin-sidebar--open' : ''}`}
        aria-label={t('navigation')}
      >
        {/* Logo */}
        <div className="admin-sidebar__logo">
          <div className="admin-sidebar__logo-icon">
            <Scale size={18} strokeWidth={2.5} />
          </div>
          <div className="admin-sidebar__logo-text">
            <div className="admin-sidebar__logo-name">ICRC Law</div>
            <div className="admin-sidebar__logo-sub">{t('panel')}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar__nav">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="admin-sidebar__section-label">
                {t(section.labelKey)}
              </div>
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`admin-sidebar__item ${isActive ? 'admin-sidebar__item--active' : ''}`}
                    onClick={closeSidebar}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon size={16} strokeWidth={1.8} aria-hidden="true" />
                    <span className="admin-sidebar__item-label">{t(item.labelKey)}</span>
                    {getBadge(item) > 0 && (
                      <span
                        className={`admin-sidebar__badge ${item.badgeVariant === 'red' ? 'admin-sidebar__badge--red' : ''}`}
                        aria-label={t('notificationsCount', { count: getBadge(item) })}
                      >
                        {getBadge(item) > 99 ? '99+' : getBadge(item)}
                      </span>
                    )}
                  </Link>
                );
              })}
              {section.label !== ADMIN_NAV_SECTIONS[ADMIN_NAV_SECTIONS.length - 1].label && (
                <div className="admin-sidebar__divider" />
              )}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            {userAvatar ? (
              <img
                className="admin-sidebar__avatar"
                src={userAvatar}
                alt={userName}
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="admin-sidebar__avatar" aria-hidden="true">{userInitials}</div>
            )}
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__user-name">{userName}</span>
              <span className="admin-sidebar__user-role">{userRole}</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
