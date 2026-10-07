'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import { Modal } from '@/features/admin/shared';
import { FormFieldInput, FormFieldTextarea, FormFieldSelect } from '@/features/admin/components';
import { serviceSchema, type ServiceFormValues } from '@/features/admin/schema';
import type { Service, Lawyer } from '../hooks/use-services';
import { SERVICE_CATEGORIES } from '../hooks/use-services';

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ServiceFormValues) => Promise<void> | void;
  initial: Service | null;
  lawyers: Lawyer[];
  isLoading?: boolean;
}

const DEFAULT_VALUES: ServiceFormValues = {
  name: '',
  description: '',
  category: 'Doanh nghiệp',
  price: 0,
  duration: 7,
  isActive: true,
  lawyerIds: [],
};

export function ServiceForm({
  isOpen,
  onClose,
  onSubmit,
  initial,
  lawyers,
  isLoading,
}: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      reset({
        name: initial.name,
        description: initial.description ?? '',
        category: initial.category,
        price: initial.price ?? 0,
        duration: initial.duration ?? 1,
        isActive: initial.isActive,
        lawyerIds: initial.lawyerIds,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [isOpen, initial, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
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
                <Save size={12} /> {initial ? 'Cập nhật' : 'Tạo dịch vụ'}
              </>
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormFieldInput
            label="Tên dịch vụ"
            required
            placeholder="VD: Thành lập công ty"
            {...register('name')}
            error={errors.name?.message}
          />
          <FormFieldTextarea
            label="Mô tả"
            placeholder="Mô tả ngắn về dịch vụ..."
            rows={3}
            {...register('description')}
            error={errors.description?.message}
          />
          <FormFieldSelect
            label="Danh mục"
            required
            {...register('category')}
            error={errors.category?.message}
          >
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FormFieldSelect>
          <div className="admin-grid-2" style={{ gap: 12 }}>
            <FormFieldInput
              label="Giá (VNĐ)"
              type="number"
              min={0}
              {...register('price', { valueAsNumber: true })}
              error={errors.price?.message}
            />
            <FormFieldInput
              label="Thời gian (ngày)"
              type="number"
              min={1}
              {...register('duration', { valueAsNumber: true })}
              error={errors.duration?.message}
            />
          </div>
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
              Luật sư phụ trách
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
              {lawyers.length === 0 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                  Chưa có luật sư nào
                </span>
              )}
              {lawyers.map((l) => {
                const checked = watch('lawyerIds').includes(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      const current = watch('lawyerIds');
                      setValue(
                        'lawyerIds',
                        checked
                          ? current.filter((id) => id !== l.id)
                          : [...current, l.id],
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
                    {l.name}
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
            Kích hoạt dịch vụ
          </label>
        </div>
      </form>
    </Modal>
  );
}