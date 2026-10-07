'use client';

import { useRef, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Camera, Loader2 } from 'lucide-react';
import { Modal } from '@/features/admin/shared';
import { FormFieldInput, FormFieldTextarea } from '@/features/admin/components';
import { lawyerSchema, type LawyerFormValues } from '@/features/admin/schema';
import { uploadImage } from '@/lib/api/upload-image';
import type { Service, Lawyer } from '../hooks/use-services';

interface LawyerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: LawyerFormValues) => Promise<void> | void;
  initial: Lawyer | null;
  services: Service[];
  isLoading?: boolean;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const DEFAULT_VALUES: LawyerFormValues = {
  name: '',
  title: 'Luật sư',
  bio: '',
  avatar: '',
  specialties: [],
  email: '',
  phone: '',
  experience: 1,
  isActive: true,
  serviceIds: [],
};

export function LawyerForm({
  isOpen,
  onClose,
  onSubmit,
  initial,
  services,
  isLoading,
}: LawyerFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LawyerFormValues>({
    resolver: zodResolver(lawyerSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      reset({
        name: initial.name,
        title: initial.title,
        bio: initial.bio ?? '',
        avatar: initial.avatar ?? '',
        specialties: initial.specialties ?? [],
        email: initial.email,
        phone: initial.phone,
        experience: initial.experience,
        isActive: initial.isActive,
        serviceIds: initial.serviceIds ?? [],
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [isOpen, initial, reset]);

  const avatar = watch('avatar');

  const handleFile = async (file: File) => {
    setUploadError(null);
    if (!ACCEPTED.includes(file.type)) {
      setUploadError('Định dạng không hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF, WEBP.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(
        `Kích thước tối đa 2MB. File của bạn: ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
      );
      return;
    }
    setUploading(true);
    try {
      const result = await uploadImage(file, 'lawyers');
      if (!result.url) throw new Error('Phản hồi từ server không có URL ảnh');
      setValue('avatar', result.url);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Upload ảnh thất bại';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const specialtiesRaw = watch('specialties');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Sửa luật sư' : 'Thêm luật sư mới'}
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
          >
            {isLoading ? (
              'Đang lưu...'
            ) : (
              <>
                <Save size={12} /> {initial ? 'Cập nhật' : 'Tạo luật sư'}
              </>
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Avatar uploader */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--primary-faint, #EFF3F8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--primary)',
              }}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                watch('name')?.slice(0, 2).toUpperCase() || 'LS'
              )}
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <button
                type="button"
                className="action-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {uploading ? <Loader2 size={12} className="pe-uploader__spinner" /> : <Camera size={12} />}
                {uploading ? 'Đang tải lên...' : 'Upload avatar'}
              </button>
              {avatar && !uploading && (
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setValue('avatar', '')}
                  style={{ marginLeft: 8, fontSize: '0.75rem' }}
                >
                  Xóa ảnh
                </button>
              )}
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: 4 }}>
                JPG, PNG, WEBP, tối đa 2MB
              </div>
              {uploadError && (
                <div style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 4 }}>
                  {uploadError}
                </div>
              )}
            </div>
          </div>

          <div className="admin-grid-2" style={{ gap: 12 }}>
            <FormFieldInput
              label="Họ và tên"
              required
              placeholder="VD: Nguyễn Văn A"
              {...register('name')}
              error={errors.name?.message}
            />
            <FormFieldInput
              label="Chức danh"
              required
              placeholder="Luật sư / Luật sư cao cấp / Cố vấn"
              {...register('title')}
              error={errors.title?.message}
            />
          </div>

          <FormFieldTextarea
            label="Tiểu sử"
            rows={3}
            placeholder="Mô tả ngắn về kinh nghiệm, thế mạnh..."
            {...register('bio')}
            error={errors.bio?.message}
          />

          <div>
            <label
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Chuyên môn (phân cách bằng dấu phẩy)
            </label>
            <FormFieldInput
              placeholder="VD: Doanh nghiệp, Sở hữu trí tuệ"
              value={specialtiesRaw.join(', ')}
              onChange={(e) => {
                const list = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                setValue('specialties', list);
              }}
            />
          </div>

          <div className="admin-grid-2" style={{ gap: 12 }}>
            <FormFieldInput
              label="Email"
              type="email"
              required
              placeholder="name@icrclaw.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <FormFieldInput
              label="Số điện thoại"
              required
              placeholder="0901 234 567"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

          <FormFieldInput
            label="Số năm kinh nghiệm"
            type="number"
            min={0}
            {...register('experience', { valueAsNumber: true })}
            error={errors.experience?.message}
          />

          <div>
            <label
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Dịch vụ phụ trách
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: 10,
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-200)',
                borderRadius: 6,
                minHeight: 60,
              }}
            >
              {services.length === 0 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                  Chưa có dịch vụ nào
                </span>
              )}
              {services.map((s) => {
                const checked = watch('serviceIds').includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      const current = watch('serviceIds');
                      setValue(
                        'serviceIds',
                        checked
                          ? current.filter((id) => id !== s.id)
                          : [...current, s.id],
                      );
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: '1px solid var(--gray-200)',
                      background: checked ? 'var(--primary)' : 'white',
                      color: checked ? 'white' : 'var(--gray-700)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.85rem',
              color: 'var(--gray-700)',
            }}
          >
            <input type="checkbox" {...register('isActive')} />
            Kích hoạt luật sư
          </label>
        </div>
      </form>
    </Modal>
  );
}