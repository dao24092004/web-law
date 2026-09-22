import { z } from 'zod';

export const userFormSchema = z.object({
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(80),
  email: z.string().email('Email không hợp lệ'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CSKH', 'LAWYER', 'USER', 'VIEWER', 'MANAGER']),
  isActive: z.boolean(),
  phone: z.string().max(20).optional().or(z.literal('')),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').optional().or(z.literal('')),
});

export const roleFormSchema = z.object({
  name: z.string().min(2, 'Tên role tối thiểu 2 ký tự').max(40),
  description: z.string().max(200).optional().or(z.literal('')),
  permissions: z.array(z.string()).min(1, 'Chọn ít nhất 1 permission'),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
export type RoleFormValues = z.infer<typeof roleFormSchema>;