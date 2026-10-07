'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Phone, Mail, MapPin, Globe2, Clock } from 'lucide-react';
import { FormFieldInput, FormFieldSelect } from '@/features/admin/components';
import {
  generalSettingsSchema,
  TIMEZONES,
  LANGUAGES,
  ALL_DAYS,
  type GeneralSettingsValues,
} from '@/features/admin/schema';
import type { GeneralSettings } from './types';

interface Props {
  value: GeneralSettings;
  loaded: boolean;
  onSubmit: (v: GeneralSettingsValues) => Promise<boolean> | boolean;
  isSubmitting?: boolean;
}

export function GeneralSettingsForm({ value, loaded, onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: value,
  });

  useEffect(() => {
    if (loaded) reset(value);
  }, [loaded, value, reset]);

  const daysOff = watch('workingHours.daysOff') ?? [];

  const toggleDay = (d: string) => {
    const next = daysOff.includes(d) ? daysOff.filter((x) => x !== d) : [...daysOff, d];
    setValue('workingHours.daysOff', next, { shouldValidate: true, shouldDirty: true });
  };

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
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '1px solid var(--gray-200)',
        }}
      >
        <Building2 size={16} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
          Thông tin công ty & liên hệ
        </h3>
      </div>

      <div className="admin-grid-2" style={{ gap: 14, marginBottom: 20 }}>
        <FormFieldInput
          label="Tên website"
          required
          leftIcon={<Building2 size={14} color="var(--gray-400)" />}
          {...register('siteName')}
          error={errors.siteName?.message}
        />
        <FormFieldInput
          label="Hotline"
          required
          leftIcon={<Phone size={14} color="var(--gray-400)" />}
          {...register('hotline')}
          error={errors.hotline?.message}
        />
        <FormFieldInput
          label="Email liên hệ"
          required
          type="email"
          leftIcon={<Mail size={14} color="var(--gray-400)" />}
          {...register('email')}
          error={errors.email?.message}
        />
        <FormFieldInput
          label="Địa chỉ"
          required
          leftIcon={<MapPin size={14} color="var(--gray-400)" />}
          {...register('address')}
          error={errors.address?.message}
        />
        <FormFieldSelect label="Múi giờ" {...register('timezone')}>
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </FormFieldSelect>
        <FormFieldSelect label="Ngôn ngữ mặc định" {...register('language')}>
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </FormFieldSelect>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: '1px solid var(--gray-200)',
        }}
      >
        <Clock size={16} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
          Giờ làm việc
        </h3>
      </div>

      <div className="admin-grid-2" style={{ gap: 14, marginBottom: 16 }}>
        <FormFieldInput
          label="Giờ bắt đầu"
          type="time"
          {...register('workingHours.start')}
          error={errors.workingHours?.start?.message}
        />
        <FormFieldInput
          label="Giờ kết thúc"
          type="time"
          {...register('workingHours.end')}
          error={errors.workingHours?.end?.message}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--gray-700)',
            marginBottom: 8,
          }}
        >
          Ngày nghỉ
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_DAYS.map((d) => {
            const active = daysOff.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 999,
                  background: active ? 'var(--danger, #DC2626)' : 'var(--gray-100)',
                  color: active ? 'white' : 'var(--gray-700)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          paddingTop: 16,
          borderTop: '1px solid var(--gray-200)',
        }}
      >
        <button
          type="button"
          className="action-btn"
          onClick={() => reset(value)}
          disabled={!isDirty || isSubmitting}
        >
          Hủy thay đổi
        </button>
        <button
          type="submit"
          className="action-btn action-btn--primary"
          disabled={!isDirty || isSubmitting}
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </div>
    </form>
  );
}