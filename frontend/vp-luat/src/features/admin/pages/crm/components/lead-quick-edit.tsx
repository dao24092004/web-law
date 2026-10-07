'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, type LeadFormValues } from '@/features/admin/schema';
import { FormFieldInput, FormFieldSelect, FormFieldTextarea } from '@/features/admin/components';
import type { Lead } from '@/lib/api/admin-crm';
import type { Lawyer, LeadStatus, LeadSource } from '@/features/admin/types';

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: 'Mới' },
  { value: 'contacted', label: 'Đã liên hệ' },
  { value: 'progress', label: 'Đang xử lý' },
  { value: 'converted', label: 'Đã chuyển đổi' },
  { value: 'lost', label: 'Mất lead' },
];

const SOURCE_OPTIONS: Array<{ value: LeadSource; label: string }> = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'organic', label: 'Tự nhiên' },
  { value: 'chatbot', label: 'Chatbot' },
  { value: 'referral', label: 'Giới thiệu' },
  { value: 'other', label: 'Khác' },
];

interface LeadQuickEditProps {
  lead: Lead;
  lawyers: Lawyer[];
  onClose: () => void;
  onSave: (values: LeadFormValues) => void;
  isSaving?: boolean;
}

const FE_STATUS: Record<string, string> = { NEW: 'new', CONTACTED: 'contacted', PROGRESS: 'progress', WON: 'converted', CONVERTED: 'converted', LOST: 'lost' };

export function LeadQuickEdit({ lead, lawyers, onClose, onSave, isSaving }: LeadQuickEditProps) {
  const assignedToName = typeof lead.assignedTo === 'object' && lead.assignedTo !== null
    ? (lead.assignedTo as { fullName: string }).fullName
    : (lead.assignedTo as string | undefined) ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: lead.name,
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      service: lead.serviceName ?? '',
      source: (FE_STATUS[lead.source?.toUpperCase() ?? ''] ?? lead.source?.toLowerCase() ?? 'other') as LeadFormValues['source'],
      status: (FE_STATUS[lead.status?.toUpperCase() ?? ''] ?? lead.status?.toLowerCase() ?? 'new') as LeadFormValues['status'],
      assignedTo: assignedToName,
      notes: lead.notes ?? '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => onSave(v))}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>Sửa lead</h2>
          <button type="button" onClick={onClose} className="modal__close" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>
        <FormFieldInput label="Họ tên" required {...register('name')} error={errors.name?.message} />
        <div className="admin-grid-2" style={{ gap: 12 }}>
          <FormFieldInput label="SĐT" required {...register('phone')} error={errors.phone?.message} />
          <FormFieldInput label="Email" type="email" required {...register('email')} error={errors.email?.message} />
        </div>
        <FormFieldInput label="Dịch vụ" required {...register('service')} error={errors.service?.message} />
        <div className="admin-grid-2" style={{ gap: 12 }}>
          <FormFieldSelect label="Nguồn" required {...register('source')} error={errors.source?.message}>
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </FormFieldSelect>
          <FormFieldSelect label="Trạng thái" required {...register('status')} error={errors.status?.message}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </FormFieldSelect>
        </div>
        <FormFieldSelect label="CSKH" required {...register('assignedTo')} error={errors.assignedTo?.message}>
          <option value="">--</option>
          {lawyers.map((l) => (
            <option key={l.id} value={l.name.replace('LS. ', '')}>{l.name}</option>
          ))}
          <option value="Lan">Lan</option>
          <option value="Minh">Minh</option>
          <option value="Hùng">Hùng</option>
        </FormFieldSelect>
        <FormFieldTextarea label="Ghi chú" rows={4} {...register('notes')} error={errors.notes?.message} />
      </div>
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <button type="button" className="action-btn" onClick={onClose} disabled={isSaving}>
          Hủy
        </button>
        <button
          type="submit"
          className="action-btn action-btn--primary"
          disabled={!isDirty || isSaving}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Save size={12} />
          {isSaving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
}
