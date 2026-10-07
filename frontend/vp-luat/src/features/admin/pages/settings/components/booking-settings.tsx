'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, Users, PhoneCall, Globe, Save, RefreshCw } from 'lucide-react';
import { FormFieldInput, FormFieldSelect } from '@/features/admin/components';
import {
  bookingSettingsSchema,
  SLOT_DURATIONS,
  type BookingSettingsValues,
} from '@/features/admin/schema';
import type { BookingSettings } from './types';

interface Props {
  value: BookingSettings;
  loaded: boolean;
  onSubmit: (v: BookingSettingsValues) => Promise<boolean> | boolean;
  isSubmitting?: boolean;
}

export function BookingSettingsForm({ value, loaded, onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<BookingSettingsValues>({
    resolver: zodResolver(bookingSettingsSchema),
    defaultValues: value,
  });

  useEffect(() => {
    if (loaded) reset(value);
  }, [loaded, value, reset]);

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
      <Section icon={<Clock size={16} />} title="Slot & Lead time">
        <div className="admin-grid-3" style={{ gap: 14 }}>
          <FormFieldSelect
            label="Thời lượng slot"
            required
            {...register('slotDuration', { valueAsNumber: true })}
            error={errors.slotDuration?.message}
          >
            {SLOT_DURATIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </FormFieldSelect>
          <FormFieldInput
            label="Lead time tối thiểu (giờ)"
            type="number"
            min={0}
            max={168}
            {...register('bookingLeadTime', { valueAsNumber: true })}
            error={errors.bookingLeadTime?.message}
          />
          <FormFieldInput
            label="Max bookings/ngày"
            type="number"
            min={1}
            max={100}
            {...register('maxBookingsPerDay', { valueAsNumber: true })}
            error={errors.maxBookingsPerDay?.message}
          />
        </div>
      </Section>

      <Section icon={<Globe size={16} />} title="Kênh đặt lịch">
        <SwitchRow
          icon={<Globe size={14} />}
          title="Cho phép đặt online"
          desc="Khách đặt lịch qua website mà không cần gọi"
          name="allowOnline"
          register={register}
        />
        <SwitchRow
          icon={<PhoneCall size={14} />}
          title="Cho phép đặt qua điện thoại"
          desc="Nhân viên tạo booking thay khách qua hotline"
          name="allowPhone"
          register={register}
        />
        <SwitchRow
          icon={<RefreshCw size={14} />}
          title="Tự động xác nhận"
          desc="Bỏ qua bước duyệt thủ công khi khách đặt lịch"
          name="autoConfirm"
          register={register}
        />
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

function SwitchRow({
  icon,
  title,
  desc,
  name,
  register,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  name: 'allowOnline' | 'allowPhone' | 'autoConfirm';
  register: ReturnType<typeof useForm<BookingSettingsValues>>['register'];
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 10,
        background: 'var(--gray-50)',
        borderRadius: 6,
        marginBottom: 8,
        cursor: 'pointer',
      }}
    >
      <input type="checkbox" {...register(name)} style={{ width: 18, height: 18 }} />
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: 'var(--primary-faint, #EFF3F8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{desc}</div>
      </div>
    </label>
  );
}

void Calendar;
void Users;