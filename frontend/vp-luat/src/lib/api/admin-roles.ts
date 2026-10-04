// lib/api/admin-roles.ts
// Roles & Permissions API

import { api } from './hooks';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

// Permission groups for matrix display
export interface PermissionGroup {
  category: string;
  permissions: Array<{
    key: string;
    label: string;
  }>;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: 'CRM - Leads',
    permissions: [
      { key: 'crm.read', label: 'Xem' },
      { key: 'crm.write', label: 'Sửa' },
      { key: 'crm.delete', label: 'Xóa' },
    ],
  },
  {
    category: 'Booking',
    permissions: [
      { key: 'booking.read', label: 'Xem' },
      { key: 'booking.write', label: 'Sửa' },
      { key: 'booking.delete', label: 'Xóa' },
    ],
  },
  {
    category: 'Blog',
    permissions: [
      { key: 'blog.read', label: 'Xem' },
      { key: 'blog.write', label: 'Sửa' },
      { key: 'blog.publish', label: 'Xuất bản' },
      { key: 'blog.delete', label: 'Xóa' },
    ],
  },
  {
    category: 'Dịch vụ & Luật sư',
    permissions: [
      { key: 'services.read', label: 'Xem dịch vụ' },
      { key: 'services.write', label: 'Sửa dịch vụ' },
      { key: 'lawyers.read', label: 'Xem luật sư' },
      { key: 'lawyers.write', label: 'Sửa luật sư' },
    ],
  },
  {
    category: 'Reviews',
    permissions: [
      { key: 'reviews.read', label: 'Xem' },
      { key: 'reviews.moderate', label: 'Duyệt' },
      { key: 'reviews.reply', label: 'Phản hồi' },
    ],
  },
  {
    category: 'Chatbot',
    permissions: [
      { key: 'chatbot.read', label: 'Xem' },
      { key: 'chatbot.train', label: 'Training' },
      { key: 'chatbot.handoff', label: 'Handoff' },
    ],
  },
  {
    category: 'Newsletter',
    permissions: [
      { key: 'newsletter.read', label: 'Xem' },
      { key: 'newsletter.write', label: 'Sửa' },
      { key: 'newsletter.send', label: 'Gửi' },
    ],
  },
  {
    category: 'Users',
    permissions: [
      { key: 'users.read', label: 'Xem' },
      { key: 'users.write', label: 'Sửa' },
      { key: 'users.impersonate', label: 'Đăng nhập hộ' },
    ],
  },
  {
    category: 'Settings & Audit',
    permissions: [
      { key: 'settings.read', label: 'Xem settings' },
      { key: 'settings.write', label: 'Sửa settings' },
      { key: 'audit.read', label: 'Xem audit log' },
    ],
  },
];

export const rolesApi = {
  list: () => api.get<Role[]>('/admin/roles'),
  // Lấy roles qua endpoint users/roles (alternative route)
  listViaUsers: () => api.get<Role[]>('/admin/users/roles'),
};
