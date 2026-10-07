'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Send, Clock, FileText, Mail } from 'lucide-react';
import { Modal } from '@/features/admin/shared';
import { FormFieldInput, FormFieldTextarea, FormFieldSelect } from '@/features/admin/components';
import { campaignSchema, type CampaignFormValues } from '@/features/admin/schema';
import type { Campaign, NewsletterTemplate, Subscriber } from '@/features/admin/types';
import { CampaignEditor } from './campaign-editor';
import { CAMPAIGN_SEGMENT_LABELS } from '../hooks/use-newsletter';

interface CampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CampaignFormValues, action: 'draft' | 'schedule' | 'send') => Promise<void> | void;
  initial: Campaign | null;
  templates: NewsletterTemplate[];
  subscribers: Subscriber[];
  isLoading?: boolean;
}

const DEFAULT_VALUES: CampaignFormValues = {
  name: '',
  subject: '',
  body: '<p>Chào {{name}},</p><p>...</p>',
  segment: 'all',
  customEmails: [],
  scheduledAt: '',
  templateId: '',
};

export function CampaignForm({
  isOpen,
  onClose,
  onSubmit,
  initial,
  templates,
  subscribers,
  isLoading,
}: CampaignFormProps) {
  const [mode, setMode] = useState<'draft' | 'schedule' | 'send'>('draft');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      reset({
        name: initial.name,
        subject: initial.subject,
        body: initial.body,
        segment: initial.segment,
        customEmails: initial.customEmails ?? [],
        scheduledAt: initial.scheduledAt ? toLocal(initial.scheduledAt) : '',
        templateId: '',
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [isOpen, initial, reset]);

  const segment = watch('segment');
  const body = watch('body');
  const scheduledAt = watch('scheduledAt');

  const handleTemplate = (templateId: string) => {
    setValue('templateId', templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      if (!watch('subject')) setValue('subject', tpl.subject);
      if (body === DEFAULT_VALUES.body || !body) {
        setValue('body', tpl.body);
      }
    }
  };

  const recipientCount =
    segment === 'all'
      ? subscribers.filter((s) => s.status === 'active').length
      : segment === 'custom'
        ? (watch('customEmails')?.length ?? 0)
        : subscribers.filter(
            (s) => s.status === 'active' && (s.tags ?? []).includes(segment),
          ).length;

  const handleSave = (values: CampaignFormValues) => {
    onSubmit(values, mode);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? `Sửa campaign — ${initial.name}` : 'Tạo campaign mới'}
      size="lg"
      footer={
        <>
          <button type="button" className="action-btn" onClick={onClose} disabled={isLoading}>
            <X size={12} /> Hủy
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => {
              setMode('draft');
              void handleSubmit(handleSave)();
            }}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Save size={12} /> Lưu nháp
          </button>
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={() => {
              if (mode === 'send' || !scheduledAt) {
                setMode('send');
              } else {
                setMode('schedule');
              }
              void handleSubmit(handleSave)();
            }}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {mode === 'send' || !scheduledAt ? (
              <>
                <Send size={12} /> Gửi ngay
              </>
            ) : (
              <>
                <Clock size={12} /> Lên lịch
              </>
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(handleSave)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="admin-grid-2" style={{ gap: 12 }}>
            <FormFieldInput
              label="Tên campaign (nội bộ)"
              required
              placeholder="VD: Bản tin tháng 5/2026"
              {...register('name')}
              error={errors.name?.message}
            />
            <FormFieldInput
              label="Tiêu đề email (subject)"
              required
              placeholder="Chào {{name}}, cập nhật mới..."
              {...register('subject')}
              error={errors.subject?.message}
            />
          </div>

          <div className="admin-grid-2" style={{ gap: 12 }}>
            <FormFieldSelect
              label="Template"
              {...register('templateId')}
              error={errors.templateId?.message}
            >
              <option value="">— Không dùng template —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isDefault ? '(mặc định)' : ''}
                </option>
              ))}
            </FormFieldSelect>
            <FormFieldSelect
              label="Phân khúc người nhận"
              required
              {...register('segment')}
              error={errors.segment?.message}
              onChange={(e) => {
                setValue('segment', e.target.value as CampaignFormValues['segment']);
              }}
            >
              {Object.entries(CAMPAIGN_SEGMENT_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </FormFieldSelect>
          </div>

          {segment === 'custom' && (
            <CustomEmailsField
              value={watch('customEmails') ?? []}
              onChange={(list) => setValue('customEmails', list)}
            />
          )}

          <div
            style={{
              padding: 10,
              background: 'var(--primary-faint, #EFF3F8)',
              borderRadius: 6,
              fontSize: '0.78rem',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Mail size={12} />
            Sẽ gửi tới <strong>{recipientCount}</strong> người nhận
          </div>

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
              Lên lịch (tuỳ chọn)
            </label>
            <input
              type="datetime-local"
              className="action-btn"
              value={watch('scheduledAt')}
              onChange={(e) => setValue('scheduledAt', e.target.value)}
              style={{ padding: '8px 10px', fontSize: '0.85rem', width: '100%' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: 4 }}>
              Để trống để gửi ngay. Hệ thống tự động gửi campaign khi đến hạn.
            </div>
          </div>

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
              Nội dung email
            </label>
            <CampaignEditor value={body} onChange={(v) => setValue('body', v)} rows={10} />
            {errors.body && (
              <div style={{ color: '#DC2626', fontSize: '0.72rem', marginTop: 4 }}>
                {errors.body.message}
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

function CustomEmailsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setInput('');
      return;
    }
    onChange([...value, trimmed]);
    setInput('');
  };
  return (
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
        Danh sách email tùy chọn
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="email@example.com, Enter để thêm"
          className="action-btn"
          style={{ flex: 1, padding: '8px 10px', fontSize: '0.85rem' }}
        />
        <button type="button" className="action-btn" onClick={add}>
          Thêm
        </button>
      </div>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {value.map((e) => (
            <span
              key={e}
              style={{
                padding: '4px 8px',
                background: 'var(--primary-faint, #EFF3F8)',
                color: 'var(--primary)',
                borderRadius: 999,
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {e}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== e))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--primary)',
                  padding: 0,
                  fontSize: '0.85rem',
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function toLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

void FileText;