'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Server, Save, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { FormFieldInput } from '@/features/admin/components';
import { smtpSettingsSchema, type SmtpSettingsValues } from '@/features/admin/schema';
import type { SmtpSettings } from './types';
import { useState } from 'react';

interface Props {
  value: SmtpSettings;
  loaded: boolean;
  onSubmit: (v: SmtpSettingsValues) => Promise<boolean> | boolean;
  isSubmitting?: boolean;
}

export function SmtpSettingsForm({ value, loaded, onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<SmtpSettingsValues>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: value,
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (loaded) reset(value);
  }, [loaded, value, reset]);

  const useTLS = watch('useTLS');

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(v))}
      style={{
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          padding: 10,
          background: 'var(--warning-faint, #FEF3C7)',
          borderRadius: 6,
          fontSize: '0.78rem',
          color: 'var(--warning, #B45309)',
        }}
      >
        <AlertCircle size={14} />
        <span>
          Mật khẩu SMTP được mã hoá trong DB. Khi lưu, mật khẩu sẽ được hash và không thể xem lại
          — chỉ có thể ghi đè.
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid var(--gray-200)',
        }}
      >
        <Server size={16} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
          Cấu hình Email/SMTP
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <FormFieldInput
          label="Tên người gửi (From Name)"
          required
          {...register('fromName')}
          error={errors.fromName?.message}
        />
        <FormFieldInput
          label="Email gửi (From Email)"
          required
          type="email"
          {...register('fromEmail')}
          error={errors.fromEmail?.message}
        />
        <FormFieldInput
          label="Reply-to"
          type="email"
          placeholder="reply@icrclaw.com"
          {...register('replyTo')}
          error={errors.replyTo?.message}
        />
        <FormFieldInput
          label="SMTP Host"
          required
          leftIcon={<Server size={14} color="var(--gray-400)" />}
          placeholder="smtp.gmail.com"
          {...register('smtpHost')}
          error={errors.smtpHost?.message}
        />
        <FormFieldInput
          label="SMTP Port"
          required
          type="number"
          placeholder="587"
          {...register('smtpPort', { valueAsNumber: true })}
          error={errors.smtpPort?.message}
        />
        <FormFieldInput
          label="SMTP Username"
          required
          {...register('smtpUser')}
          error={errors.smtpUser?.message}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
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
            SMTP Password
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Để trống nếu không đổi"
              {...register('smtpPassword')}
              style={{
                flex: 1,
                padding: '8px 10px',
                border: '1.5px solid var(--gray-200)',
                borderRadius: 6,
                fontSize: '0.85rem',
                fontFamily: 'monospace',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="action-btn"
              style={{ padding: '8px 10px' }}
              title={showPassword ? 'Ẩn' : 'Hiện'}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            background: useTLS ? 'var(--success-faint, #D1FAE5)' : 'var(--gray-50)',
            borderRadius: 6,
            cursor: 'pointer',
            marginTop: 22,
            transition: 'all 0.15s',
          }}
        >
          <input type="checkbox" {...register('useTLS')} style={{ width: 18, height: 18 }} />
          <Lock size={14} color={useTLS ? 'var(--success, #10B981)' : 'var(--gray-500)'} />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sử dụng TLS/SSL</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
              Mã hoá kết nối SMTP (khuyến nghị)
            </div>
          </div>
        </label>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 16,
          borderTop: '1px solid var(--gray-200)',
        }}
      >
        <button
          type="button"
          className="action-btn"
          onClick={() => {
            if (typeof window !== 'undefined' && window.confirm('Gửi email test đến admin@icrclaw.com?')) {
              // mock
              alert('Đã gửi email test (mock). Kiểm tra inbox trong vài phút.');
            }
          }}
        >
          Gửi email test
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="action-btn"
            onClick={() => reset(value)}
            disabled={!isDirty || isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="action-btn action-btn--primary"
            disabled={!isDirty || isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Save size={12} /> {isSubmitting ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </form>
  );
}