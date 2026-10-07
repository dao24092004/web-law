'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/features/admin/shared';
import { FormFieldInput, FormFieldSelect, FormFieldTextarea } from '@/features/admin/components';
import { leadSchema, type LeadFormValues } from '@/features/admin/schema';
import type { Lead } from '@/lib/api/admin-crm';
import type { Lawyer } from '@/features/admin/types';

const SERVICE_OPTIONS = [
  'Thành lập doanh nghiệp',
  'Tư vấn hợp đồng',
  'M&A — Mua bán & sáp nhập',
  'FDI — Đầu tư nước ngoài',
  'Luật dân sự',
  'Ly hôn & tranh chấp gia đình',
  'Đất đai & BĐS',
  'Luật lao động',
  'Luật hình sự',
  'Sở hữu trí tuệ',
  'Giấy phép kinh doanh',
  'Tư vấn đầu tư',
];

const SOURCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'organic', label: 'Tự nhiên (SEO)' },
  { value: 'chatbot', label: 'Chatbot' },
  { value: 'referral', label: 'Giới thiệu' },
  { value: 'other', label: 'Khác' },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'new', label: 'Mới' },
  { value: 'contacted', label: 'Đã liên hệ' },
  { value: 'progress', label: 'Đang xử lý' },
  { value: 'converted', label: 'Đã chuyển đổi' },
  { value: 'lost', label: 'Mất lead' },
];

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: LeadFormValues) => Promise<void> | void;
  initial?: Lead | null;
  lawyers: Lawyer[];
  isLoading?: boolean;
}

export function LeadForm({ isOpen, onClose, onSubmit, initial, lawyers, isLoading }: LeadFormProps) {
  // Normalise initial values for the form (backend uses UPPERCASE, form uses lowercase)
  const FE_STATUS: Record<string, string> = { NEW: 'new', CONTACTED: 'contacted', PROGRESS: 'progress', WON: 'converted', CONVERTED: 'converted', LOST: 'lost' };
  const assignedToName = typeof initial?.assignedTo === 'object' && initial?.assignedTo !== null
    ? (initial.assignedTo as { fullName: string }).fullName
    : (initial?.assignedTo as string | undefined) ?? '';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          phone: initial.phone ?? '',
          email: initial.email ?? '',
          service: initial.serviceName ?? '',
          source: (FE_STATUS[initial.source?.toUpperCase() ?? ''] ?? initial.source?.toLowerCase() ?? 'other') as LeadFormValues['source'],
          status: (FE_STATUS[initial.status?.toUpperCase() ?? ''] ?? initial.status?.toLowerCase() ?? 'new') as LeadFormValues['status'],
          assignedTo: assignedToName,
          notes: initial.notes ?? '',
        }
      : {
          name: '',
          phone: '',
          email: '',
          service: '',
          source: 'other',
          status: 'new',
          assignedTo: lawyers[0]?.name.replace('LS. ', '') ?? '',
          notes: '',
        },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    reset();
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? `Sửa lead: ${initial.name}` : 'Thêm lead mới'}
      size="md"
      footer={
        <>
          <button type="button" className="action-btn" onClick={onClose} disabled={isLoading}>
            Hủy
          </button>
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={submit}
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu...' : initial ? 'Cập nhật' : 'Tạo lead'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <FormFieldInput
          label="Họ tên"
          required
          placeholder="Nguyễn Văn A"
          {...register('name')}
          error={errors.name?.message}
        />
        <div className="admin-grid-2" style={{ gap: 12 }}>
          <FormFieldInput
            label="Số điện thoại"
            required
            placeholder="0901 234 567"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <FormFieldInput
            label="Email"
            type="email"
            required
            placeholder="email@example.com"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>
        <Controller
          control={control}
          name="service"
          render={({ field }) => (
            <FormFieldSelect label="Dịch vụ quan tâm" required {...field} error={errors.service?.message}>
              <option value="">-- Chọn dịch vụ --</option>
              {SERVICE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </FormFieldSelect>
          )}
        />
        <div className="admin-grid-2" style={{ gap: 12 }}>
          <Controller
            control={control}
            name="source"
            render={({ field }) => (
              <FormFieldSelect label="Nguồn" required {...field} error={errors.source?.message}>
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </FormFieldSelect>
            )}
          />
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <FormFieldSelect label="Trạng thái" required {...field} error={errors.status?.message}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </FormFieldSelect>
            )}
          />
        </div>
        <Controller
          control={control}
          name="assignedTo"
          render={({ field }) => (
            <FormFieldSelect label="Người phụ trách (CSKH)" required {...field} error={errors.assignedTo?.message}>
              <option value="">-- Chọn --</option>
              {lawyers.map((l) => (
                <option key={l.id} value={l.name.replace('LS. ', '')}>
                  {l.name}
                </option>
              ))}
              <option value="Lan">Lan</option>
              <option value="Minh">Minh</option>
              <option value="Hùng">Hùng</option>
            </FormFieldSelect>
          )}
        />
        <FormFieldTextarea
          label="Ghi chú"
          rows={3}
          placeholder="Ghi chú nội bộ..."
          {...register('notes')}
          error={errors.notes?.message}
        />
      </form>
    </Modal>
  );
}
