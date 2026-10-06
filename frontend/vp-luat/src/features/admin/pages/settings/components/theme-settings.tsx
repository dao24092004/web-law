'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Upload, Palette, Type, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { FormFieldInput, FormFieldSelect } from '@/features/admin/components';
import { themeSettingsSchema, FONT_OPTIONS, type ThemeSettingsValues } from '@/features/admin/schema';
import type { ThemeSettings } from './types';

interface Props {
  value: ThemeSettings;
  loaded: boolean;
  onSubmit: (v: ThemeSettingsValues) => Promise<boolean> | boolean;
  isSubmitting?: boolean;
}

const PRESET_PRIMARY = ['#1B4D8C', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const PRESET_ACCENT = ['#F59E0B', '#10B981', '#0EA5E9', '#8B5CF6', '#EC4899', '#EF4444', '#1B4D8C'];

export function ThemeSettingsForm({ value, loaded, onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ThemeSettingsValues>({
    resolver: zodResolver(themeSettingsSchema),
    defaultValues: value,
  });

  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loaded) reset(value);
  }, [loaded, value, reset]);

  const primary = watch('primaryColor');
  const accent = watch('accentColor');
  const font = watch('fontFamily');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo tối đa 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setValue('logoUrl', reader.result as string, { shouldValidate: true, shouldDirty: true });
    };
    reader.readAsDataURL(file);
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
      <Section icon={<Palette size={16} />} title="Màu sắc thương hiệu">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ColorPicker
            label="Màu chính (Primary)"
            value={primary}
            onChange={(v) => setValue('primaryColor', v, { shouldValidate: true, shouldDirty: true })}
            presets={PRESET_PRIMARY}
            error={errors.primaryColor?.message}
          />
          <ColorPicker
            label="Màu nhấn (Accent)"
            value={accent}
            onChange={(v) => setValue('accentColor', v, { shouldValidate: true, shouldDirty: true })}
            presets={PRESET_ACCENT}
            error={errors.accentColor?.message}
          />
        </div>
      </Section>

      <Section icon={<Type size={16} />} title="Typography">
        <FormFieldSelect label="Font chữ chính" {...register('fontFamily')}>
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </FormFieldSelect>
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: 'var(--gray-50)',
            borderRadius: 6,
            fontFamily: font,
            fontSize: '1.2rem',
            fontWeight: 600,
            color: primary,
          }}
        >
          ICRC Law — {font} preview
        </div>
      </Section>

      <Section icon={<ImageIcon size={16} />} title="Logo & Favicon">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
              Logo URL
            </label>
            <FormFieldInput
              placeholder="https://..."
              {...register('logoUrl')}
              error={errors.logoUrl?.message}
            />
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="action-btn"
              style={{ marginTop: 6, fontSize: '0.72rem' }}
            >
              <Upload size={11} /> Upload từ máy
            </button>
          </div>
          <FormFieldInput
            label="Favicon URL"
            placeholder="https://...favicon.ico"
            {...register('faviconUrl')}
            error={errors.faviconUrl?.message}
          />
        </div>
        {watch('logoUrl') && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: 'var(--gray-50)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>Preview:</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={watch('logoUrl')}
              alt="Logo preview"
              style={{ maxHeight: 40, maxWidth: 200, objectFit: 'contain' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </Section>

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
          <RefreshCw size={11} /> Hủy
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
    </form>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid var(--gray-100)',
        }}
      >
        <span style={{ color: 'var(--primary)' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
  presets,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets: string[];
  error?: string;
}) {
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
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 44,
            height: 36,
            border: '1.5px solid var(--gray-200)',
            borderRadius: 6,
            cursor: 'pointer',
            background: 'white',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 10px',
            border: '1.5px solid var(--gray-200)',
            borderRadius: 6,
            fontSize: '0.85rem',
            fontFamily: 'monospace',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            title={p}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: p,
              border: value === p ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
      {error && (
        <div style={{ color: 'var(--danger, #DC2626)', fontSize: '0.72rem', marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}