import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Newspaper,
  Gavel,
  Star,
  Bot,
  Mail,
  UserCog,
  Settings,
  Bell,
  History,
  Briefcase,
  Layout,
  BriefcaseBusiness,
  BarChart3,
  Shield,
  FolderOpen,
  ImageIcon,
} from 'lucide-react';

export type SidebarBadgeSource = 'new-leads' | 'pending-bookings' | 'pending-reviews' | 'unread-notifications';

export interface NavItem {
  id: string;
  labelKey: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  badgeVariant?: 'default' | 'red';
  badgeSource?: SidebarBadgeSource;
  permission?: string[];
}

export interface NavSection {
  labelKey: string;
  label: string;
  items: NavItem[];
}

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    labelKey: 'sections.management',
    label: 'Quan ly',
    items: [
      {
        id: 'dashboard',
        labelKey: 'nav.dashboard',
        label: 'Bang dieu khien',
        icon: LayoutDashboard,
        href: '/admin/dashboard',
      },
      {
        id: 'bookings',
        labelKey: 'nav.bookings',
        label: 'Lich hen & Booking',
        icon: CalendarCheck,
        href: '/admin/bookings',
      },
      {
        id: 'crm',
        labelKey: 'nav.crm',
        label: 'Quan ly Lead / CRM',
        icon: Users,
        href: '/admin/crm',
        badgeSource: 'new-leads',
        badgeVariant: 'red',
      },
      {
        id: 'blog',
        labelKey: 'nav.blog',
        label: 'Bai viet & Blog',
        icon: Newspaper,
        href: '/admin/blog',
      },
      {
        id: 'case-studies',
        labelKey: 'nav.case_studies',
        label: 'Case Studies',
        icon: Briefcase,
        href: '/admin/case-studies',
      },
      {
        id: 'services',
        labelKey: 'nav.services',
        label: 'Dich vu & Luat su',
        icon: Gavel,
        href: '/admin/services-management',
      },
      {
        id: 'lawyer-schedules',
        labelKey: 'nav.lawyer_schedules',
        label: 'Lich Luat su',
        icon: CalendarCheck,
        href: '/admin/lawyer-schedules',
      },
      {
        id: 'reviews',
        labelKey: 'nav.reviews',
        label: 'Danh gia khach hang',
        icon: Star,
        href: '/admin/reviews',
      },
      {
        id: 'chatbot',
        labelKey: 'nav.chatbot',
        label: 'Chatbot Logs',
        icon: Bot,
        href: '/admin/chatbot',
      },
      {
        id: 'newsletter',
        labelKey: 'nav.newsletter',
        label: 'Newsletter',
        icon: Mail,
        href: '/admin/newsletter',
      },
      {
        id: 'landing-pages',
        labelKey: 'nav.landing_pages',
        label: 'Landing Pages',
        icon: Layout,
        href: '/admin/landing-pages',
      },
      {
        id: 'site-content',
        labelKey: 'nav.site_content',
        label: 'Noi dung Site',
        icon: ImageIcon,
        href: '/admin/site-content',
      },
      {
        id: 'jobs',
        labelKey: 'nav.jobs',
        label: 'Tuyen dung',
        icon: BriefcaseBusiness,
        href: '/admin/jobs',
      },
    ],
  },
  {
    labelKey: 'sections.reports',
    label: 'Bao cao',
    items: [
      {
        id: 'reports',
        labelKey: 'nav.reports',
        label: 'Bao cao chi tiet',
        icon: BarChart3,
        href: '/admin/reports',
      },
    ],
  },
  {
    labelKey: 'sections.system',
    label: 'He thong',
    items: [
      {
        id: 'users',
        labelKey: 'nav.users',
        label: 'Nguoi dung & Phan quyen',
        icon: UserCog,
        href: '/admin/users',
      },
      {
        id: 'roles',
        labelKey: 'nav.roles',
        label: 'Roles & Permissions',
        icon: Shield,
        href: '/admin/roles',
      },
      {
        id: 'notifications',
        labelKey: 'nav.notifications',
        label: 'Thong bao',
        icon: Bell,
        href: '/admin/notifications',
      },
      {
        id: 'audit',
        labelKey: 'nav.audit',
        label: 'Audit log',
        icon: History,
        href: '/admin/audit',
      },
      {
        id: 'settings',
        labelKey: 'nav.settings',
        label: 'Cai dat he thong',
        icon: Settings,
        href: '/admin/settings',
      },
      {
        id: 'files',
        labelKey: 'nav.files',
        label: 'Quan ly File',
        icon: FolderOpen,
        href: '/admin/files',
      },
    ],
  },
];

export const getNavItemByHref = (href: string): NavItem | undefined => {
  for (const section of ADMIN_NAV_SECTIONS) {
    const item = section.items.find((i) => i.href === href);
    if (item) return item;
  }
  return undefined;
};
