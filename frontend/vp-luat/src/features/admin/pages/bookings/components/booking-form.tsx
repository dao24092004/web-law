'use client';

import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/features/admin/shared';
import { FormFieldInput, FormFieldSelect, FormFieldTextarea } from '@/features/admin/components';
import { bookingSchema, type BookingFormValues } from '@/features/admin/schema';
import { ReminderConfig } from './booking-reminder-config';
import { useServices } from '@/features/services/hooks/use-services';
import type { Booking, Lawyer } from '@/features/admin/types';
import type { Lead as CrmLead } from '@/lib/api/admin-crm';

const METHOD_OPTIONS = [
  { value: 'office', label: 'Tại Văn Phòng' },
  { value: 'online', label: 'Online (Zoom/Meet)' },
  { value: 'phone', label: 'Qua Điện thoại' },
];

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: BookingFormValues) => Promise<void> | void;
  initial?: Partial<Booking> | null;
  leads: CrmLead[];
  lawyers: Lawyer[];
  isLoading?: boolean;
  /** Slot prefilled khi click từ calendar */
  defaultDate?: string;
  defaultTime?: string;
  defaultLawyer?: string;
}

export function BookingForm({
  isOpen,
  onClose,
  onSubmit,
  initial,
  leads,
  lawyers,
  isLoading,
  defaultDate,
  defaultTime,
  defaultLawyer,
}: BookingFormProps) {
  const [leadSearch, setLeadSearch] = useState('');
  const [showLeadMenu, setShowLeadMenu] = useState(false);
  const [reminderType, setReminderType] = useState<'24h' | '2h' | '30m' | null>('24h');

  // Lấy danh sách dịch vụ động từ BE để đồng bộ với trang public.
  const { data: services = [] } = useServices();
  const serviceOptions = useMemo(
    () => services.map((s) => ({ slug: s.slug, label: s.name })),
    [services],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: initial?.customerName ?? '',
      customerEmail: initial?.customerEmail ?? '',
      customerPhone: initial?.customerPhone ?? '',
      leadId: initial?.leadId,
      service: initial?.service ?? '',
      lawyer: initial?.lawyer ?? defaultLawyer ?? '',
      method: (initial?.method as 'office' | 'online' | 'phone') ?? 'office',
      date: initial?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10),
      time: initial?.time ?? defaultTime ?? '09:00',
      durationMinutes: initial?.durationMinutes ?? 30,
      notes: initial?.notes ?? '',
      reminders: reminderType ? [{ type: reminderType, scheduledAt: '', sent: false, channel: 'email' as const }] : [],
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit({ ...values, reminders: reminderType ? [{ type: reminderType, scheduledAt: '', sent: false, channel: 'email' }] : [] });
  });

  const leadMatches = useMemo(() => {
    if (!leadSearch) return leads.slice(0, 6);
    const q = leadSearch.toLowerCase();
    return leads
      .filter((l) => l.name.toLowerCase().includes(q) || l.phone?.includes(q) || (l.email ?? '').toLowerCase().includes(q))
      .slice(0, 6);
  }, [leadSearch, leads]);

  const selectLead = (lead: CrmLead) => {
    setValue('leadId', lead.id);
    setValue('customerName', lead.name);
    setValue('customerPhone', lead.phone ?? '');
    setValue('customerEmail', lead.email ?? '');
    setValue('service', lead.serviceName ?? lead.serviceId ?? '');
    setShowLeadMenu(false);
    setLeadSearch('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial?.id ? `Sửa lịch hẹn` : 'Tạo lịch hẹn mới'}
      size="lg"
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
            {isLoading ? 'Đang lưu...' : initial?.id ? 'Cập nhật' : 'Tạo lịch hẹn'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--gray-700)',
              marginBottom: 6,
            }}
          >
            Tìm khách hàng có sẵn
          </label>
          <input
            type="text"
            className="action-btn"
            style={{ width: '100%', padding: '8px 12px', textAlign: 'left' }}
            placeholder="Gõ tên, SĐT, email..."
            value={leadSearch}
            onChange={(e) => {
              setLeadSearch(e.target.value);
              setShowLeadMenu(true);
            }}
            onFocus={() => setShowLeadMenu(true)}
            onBlur={() => setTimeout(() => setShowLeadMenu(false), 150)}
          />
          {showLeadMenu && leadMatches.length > 0 && (
            <ul
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--white)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-md, 8px)',
                boxShadow: '0 4px 12px rgb(15 23 42 / 0.1)',
                listStyle: 'none',
                margin: 0,
                padding: 4,
                zIndex: 20,
                maxHeight: 240,
                overflow: 'auto',
              }}
            >
              {leadMatches.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => selectLead(l)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{l.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                      {l.phone} · {l.serviceName ?? l.serviceId ?? ''}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-grid-2" style={{ gap: 12 }}>
          <FormFieldInput
            label="Họ tên"
            required
            placeholder="Nguyễn Văn A"
            {...register('customerName')}
            error={errors.customerName?.message}
          />
          <FormFieldInput
            label="Số điện thoại"
            required
            placeholder="0901 234 567"
            {...register('customerPhone')}
            error={errors.customerPhone?.message}
          />
        </div>
        <FormFieldInput
          label="Email"
          type="email"
          required
          placeholder="email@example.com"
          {...register('customerEmail')}
          error={errors.customerEmail?.message}
        />
        <Controller
          control={control}
          name="service"
          render={({ field }) => (
            <FormFieldSelect label="Dịch vụ" required {...field} error={errors.service?.message}>
              <option value="">-- Chọn dịch vụ --</option>
              {serviceOptions.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </FormFieldSelect>
          )}
        />
        <div className="admin-grid-2" style={{ gap: 12 }}>
          <Controller
            control={control}
            name="lawyer"
            render={({ field }) => (
              <FormFieldSelect label="Luật sư" required {...field} error={errors.lawyer?.message}>
                <option value="">-- Chọn LS --</option>
                {lawyers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </FormFieldSelect>
            )}
          />
          <Controller
            control={control}
            name="method"
            render={({ field }) => (
              <FormFieldSelect label="Hình thức" required {...field} error={errors.method?.message}>
                {METHOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </FormFieldSelect>
            )}
          />
        </div>
        <div className="admin-grid-3" style={{ gap: 12 }}>
          <FormFieldInput
            label="Ngày"
            type="date"
            required
            {...register('date')}
            error={errors.date?.message}
          />
          <FormFieldInput
            label="Giờ"
            type="time"
            required
            {...register('time')}
            error={errors.time?.message}
          />
          <Controller
            control={control}
            name="durationMinutes"
            render={({ field: { value, onChange, ...rest } }) => (
              <FormFieldSelect
                label="Thời lượng"
                value={String(value ?? 30)}
                onChange={(e) => onChange(Number(e.target.value))}
                {...rest}
              >
                <option value="30">30 phút</option>
                <option value="45">45 phút</option>
                <option value="60">1 giờ</option>
                <option value="90">1.5 giờ</option>
                <option value="120">2 giờ</option>
              </FormFieldSelect>
            )}
          />
        </div>
        <FormFieldTextarea
          label="Ghi chú"
          rows={3}
          placeholder="Ghi chú nội bộ..."
          {...register('notes')}
          error={errors.notes?.message}
        />

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
          <ReminderConfig
            reminders={reminderType ? [{ type: reminderType, scheduledAt: '', sent: false, channel: 'email' as const }] : []}
            onToggle={(type) => setReminderType(type === 'h24' ? '24h' : type === 'h2' ? '2h' : '30m')}
          />
        </div>
      </form>
    </Modal>
  );
}
