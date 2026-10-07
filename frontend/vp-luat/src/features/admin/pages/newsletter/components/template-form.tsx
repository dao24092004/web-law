'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, FileText } from 'lucide-react';
import { Modal } from '@/features/admin/shared';
import { FormFieldInput, FormFieldTextarea } from '@/features/admin/components';
import { templateSchema, type TemplateFormValues } from '@/features/admin/schema';
import type { NewsletterTemplate } from '@/features/admin/types';
import { CampaignEditor } from './campaign-editor';

interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TemplateFormValues) => Promise<void> | void;
  initial: NewsletterTemplate | null;
  isLoading?: boolean;
}

const DEFAULT_VALUES: TemplateFormValues = {
  name: '',
  subject: '{{subject}}',
  body: '<header>...</header><main>{{content}}</main>',
  description: '',
  isDefault: false,
};

export function TemplateForm({ isOpen, onClose, onSubmit, initial, isLoading }: TemplateFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      reset({
        name: initial.name,
        subject: initial.subject,
        body: initial.body,
        description: initial.description ?? '',
        isDefault: initial.isDefault,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [isOpen, initial, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? `Sửa template — ${initial.name}` : 'Tạo template mới'}
      size="lg"
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
            <Save size={12} /> {initial ? 'Cập nhật' : 'Tạo template'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="admin-grid-2" style={{ gap: 12 }}>
            <FormFieldInput
              label="Tên template"
              required
              placeholder="VD: Standard Header"
              {...register('name')}
              error={errors.name?.message}
            />
            <FormFieldInput
              label="Subject mặc định"
              required
              placeholder="{{subject}}"
              {...register('subject')}
              error={errors.subject?.message}
            />
          </div>
          <FormFieldTextarea
            label="Mô tả"
            rows={2}
            placeholder="Template dùng cho..."
            {...register('description')}
            error={errors.description?.message}
          />
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                marginBottom: 6,
              }}
            >
              <FileText size={11} style={{ display: 'inline', marginRight: 4 }} /> Body HTML
            </label>
            <CampaignEditor
              value={watch('body')}
              onChange={(v) => setValue('body', v)}
              rows={10}
            />
            {errors.body && (
              <div style={{ color: '#DC2626', fontSize: '0.72rem', marginTop: 4 }}>
                {errors.body.message}
              </div>
            )}
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
            <input type="checkbox" {...register('isDefault')} />
            Đặt làm template mặc định
          </label>
        </div>
      </form>
    </Modal>
  );
}