'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useAdminUIStore } from '@/features/admin/store';
import { getStaffNavSections, getNavItemByHref } from '@/features/staff/constants';
import { useSidebarBadges } from '@/features/admin/lib/use-sidebar-badges';
import { Scale, LogOut } from 'lucide-react';
import { clearAuthToken, setLoggingOut, callServerLogout } from '@/lib/api/client';
import { useTranslations } from 'next-intl';
import { RoleDisplayNames } from '@/features/auth/utils/permissions';
import type { Role } from '@/features/auth/utils/permissions';

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

function pickColor(name: string): string {
  const palette = ['#1B4D8C', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function StaffSidebar() {
  const pathname = usePathname();
  const t = useTranslations('admin');
  const authT = useTranslations('auth');
  const { isSidebarOpen, closeSidebar } = useAdminUIStore();
  const badges = useSidebarBadges();
  const { data: session, status } = useSession();

  const navItem = getNavItemByHref(pathname);
  const displayTitle = navItem ? t(navItem.labelKey) : t('staffPortal');

  const userRole = ((session?.user?.role as Role) ?? 'VIEWER');
  const sections = getStaffNavSections(userRole);

  const getBadge = (item: { badge?: number; badgeSource?: keyof typeof badges }) => {
    if (item.badgeSource) return badges[item.badgeSource] ?? 0;
    return item.badge ?? 0;
  };

  // Get user info from session (NextAuth) - not from localStorage/MockDB
  const userName = session?.user?.name ?? t('administrator');
  const roleDisplayName = RoleDisplayNames[userRole] ?? t('administrator');
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'NV';
  const bgColor = pickColor(userName);

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
            <div className="admin-sidebar__logo-sub">{t('staffPortal')}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar__nav">
          {sections.map((section, idx) => (
            <div key={section.label}>
              <div className="admin-sidebar__section-label">
                {t(section.label)}
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
              {idx < sections.length - 1 && (
                <div className="admin-sidebar__divider" />
              )}
            </div>
          ))}
        </nav>

        {/* User footer - uses session data */}
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div
              className="admin-sidebar__avatar"
              style={{
                background: `linear-gradient(135deg, ${bgColor} 0%, var(--primary) 100%)`,
                color: 'white',
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__user-name">{userName}</span>
              <span className="admin-sidebar__user-role">{roleDisplayName}</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}