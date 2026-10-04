'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, AlertCircle } from 'lucide-react';
import { Modal } from '@/features/admin/shared';
import { FormFieldInput } from '@/features/admin/components';
import { userFormSchema, type UserFormValues } from '@/features/admin/schema';
import type { AdminUser, UserRole } from '@/features/admin/types';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  initial: AdminUser | null;
  isLoading?: boolean;
  hidePassword?: boolean;
}

const DEFAULT: UserFormValues = {
  name: '',
  email: '',
  role: 'USER',
  isActive: true,
  phone: '',
  password: '',
};

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'CSKH', label: 'CSKH' },
  { value: 'LAWYER', label: 'Luật sư' },
  { value: 'USER', label: 'Khách hàng' },
  { value: 'VIEWER', label: 'Người xem' },
];

export function UserForm({ isOpen, onClose, onSubmit, initial, isLoading, hidePassword }: UserFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: DEFAULT,
  });

  // Watch role để hiển thị cảnh báo khi chọn LAWYER
  const watchedRole = useWatch({ control, name: 'role' });
  const watchedPassword = useWatch({ control, name: 'password' });

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      reset({
        name: initial.name,
        email: initial.email,
        role: (initial.role as UserRole) || 'USER',
        isActive: initial.isActive,
        phone: initial.phone ?? '',
        password: '',
      });
    } else {
      reset(DEFAULT);
    }
  }, [isOpen, initial, reset]);

  const isLawyerDowngrade = initial?.role === 'LAWYER' && watchedRole !== 'LAWYER';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? `Sửa — ${initial.name}` : 'Tạo người dùng mới'}
      size="md"
      footer={
        <>
          <button type="button" className="action-btn" onClick={onClose} disabled={isLoading}>
            <X size={12} /> Hủy
          </button>
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Save size={12} /> {initial ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {watchedRole === 'LAWYER' && !initial && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                background: '#fffbeb',
                border: '1px solid #fcd34d',
                borderRadius: 6,
                fontSize: '0.78rem',
                color: '#92400e',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Lưu ý:</strong> Khi tạo user với vai trò Luật sư, hệ thống sẽ <strong>tự động tạo hồ sơ luật sư</strong> liên kết.
                Bạn có thể bổ sung thông tin chuyên môn (bio, kinh nghiệm, dịch vụ...) tại trang Quản lý luật sư.
              </div>
            </div>
          )}

          {isLawyerDowngrade && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 6,
                fontSize: '0.78rem',
                color: '#991b1b',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Cảnh báo:</strong> Đổi vai trò từ Luật sư sang vai trò khác sẽ <strong>xóa hồ sơ luật sư</strong> liên kết.
              </div>
            </div>
          )}

          <FormFieldInput
            label="Họ và tên"
            required
            placeholder="Nguyễn Văn A"
            {...register('name')}
            error={errors.name?.message}
          />
          <FormFieldInput
            label="Email"
            required
            type="email"
            placeholder="user@vpluat.vn"
            {...register('email')}
            error={errors.email?.message}
            hint={initial ? 'Có thể đổi email nếu chưa bị trùng' : undefined}
          />
          <FormFieldInput
            label="Số điện thoại"
            placeholder="028 1234 5678"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle()}>Vai trò</label>
              <select {...register('role')} className="action-btn" style={inputStyle()}>
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle()}>Trạng thái</label>
              <div style={{ padding: '8px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                  <input type="checkbox" {...register('isActive')} /> Hoạt động
                </label>
              </div>
            </div>
          </div>
          {!hidePassword && (
            <FormFieldInput
              label={initial ? 'Mật khẩu mới (để trống = giữ nguyên)' : 'Mật khẩu'}
              type="password"
              placeholder={initial ? 'Để trống nếu không đổi' : 'Tối thiểu 8 ký tự'}
              {...register('password')}
              error={
                !initial && watchedPassword && watchedPassword.length < 8
                  ? 'Mật khẩu tối thiểu 8 ký tự (hoặc để trống để dùng mật khẩu mặc định)'
                  : errors.password?.message
              }
              hint={
                initial
                  ? 'Để trống để giữ mật khẩu hiện tại'
                  : 'Để trống sẽ dùng mật khẩu mặc định Welcome@2026'
              }
            />
          )}
        </div>
      </form>
    </Modal>
  );
}

function labelStyle(): React.CSSProperties {
  return {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--gray-700)',
    marginBottom: 6,
  };
}
function inputStyle(): React.CSSProperties {
  return { width: '100%', padding: '8px 10px', fontSize: '0.85rem' };
}