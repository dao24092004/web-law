'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BOOKING_CONSULTATION_TYPES } from '../lib';
import { trackBookingDateSelected, trackBookingSlotConflict, trackBookingSlotReserved } from '../analytics';
import { useAvailabilityQuery, useBookingStore, useReleaseReservationMutation, useReserveSlotMutation } from '../hooks';
import { createDayMatrix, createMonthLabel, formatBookingDateLabel, toLocalDateString } from '../utils';
import { BookingIcon } from './booking-icon';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function parseDateValue(value: string | null) {
  if (!value) {
    return null;
  }

  // value is a YYYY-MM-DD string in the user's local timezone. Build a
  // local-midnight Date so subsequent toISOString() round-trips don't drift.
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!Number.isNaN(date.getTime())) {
      date.setHours(0, 0, 0, 0);
      return date;
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

export function StepDatetime({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations('booking');
  const tCommon = useTranslations('common');
  const lawyer = useBookingStore((state) => state.lawyer);
  const date = useBookingStore((state) => state.date);
  const timeSlot = useBookingStore((state) => state.timeSlot);
  const consultationType = useBookingStore((state) => state.consultationType);
  const reservation = useBookingStore((state) => state.reservation);
  const setDate = useBookingStore((state) => state.setDate);
  const setTimeSlot = useBookingStore((state) => state.setTimeSlot);
  const setConsultationType = useBookingStore((state) => state.setConsultationType);
  const setReservation = useBookingStore((state) => state.setReservation);

  const [currentMonth, setCurrentMonth] = useState(() => parseDateValue(date) ?? new Date());
  const selectedDate = useMemo(() => parseDateValue(date), [date]);
  const dayMatrix = useMemo(() => createDayMatrix(currentMonth, selectedDate), [currentMonth, selectedDate]);

  const availabilityQuery = useAvailabilityQuery({
    lawyerId: lawyer?.id ?? null,
    date: date ? date.slice(0, 10) : null,
  });

  const reserveSlotMutation = useReserveSlotMutation();
  const releaseReservationMutation = useReleaseReservationMutation();

  const slots = availabilityQuery.data?.slots ?? [];
  const canProceed = Boolean(selectedDate && timeSlot && reservation);

  const handleSelectDate = async (nextDate: Date | null) => {
    if (!nextDate || !lawyer) {
      return;
    }

    if (reservation?.reservationId) {
      try {
        await releaseReservationMutation.mutateAsync(reservation.reservationId);
      } catch {
        toast.error(t('releaseReservationFailed'));
      }
    }

    setReservation(null);
    setTimeSlot(null);
    setDate(toLocalDateString(nextDate));
    trackBookingDateSelected(toLocalDateString(nextDate));
  };

  const handleSelectSlot = async (slotId: string) => {
    if (!selectedDate || !lawyer) {
      return;
    }

    const slot = slots.find((item) => item.slotId === slotId);
    if (!slot || slot.status === 'booked') {
      trackBookingSlotConflict(slotId);
      return;
    }

    try {
      if (reservation?.reservationId) {
        await releaseReservationMutation.mutateAsync(reservation.reservationId);
      }

      const nextReservation = await reserveSlotMutation.mutateAsync({
        lawyerId: lawyer.id,
        date: toLocalDateString(selectedDate),
        slotId,
      });

      setTimeSlot(slot);
      setReservation(nextReservation);
      trackBookingSlotReserved(slotId, slot.startTime);
    } catch {
      setTimeSlot(null);
      setReservation(null);
      trackBookingSlotConflict(slotId);
      toast.error(t('slotConflict'));
      await availabilityQuery.refetch();
    }
  };

  return (
    <section className="animate-in fade-in slide-in-from-right-1 duration-300">
      <h2 className="mb-1.5 font-heading text-[1.5rem] font-bold text-[var(--primary)]">
        {t('datetimeTitle')}
      </h2>
      <p className="mb-7 text-[0.875rem] text-[var(--gray-500)]">
        {t('datetimeSubtitle')}
      </p>

      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="rounded-[var(--radius-xl)] border border-[var(--gray-100)] bg-white p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-5 flex items-center justify-between">
            <span className="font-heading text-[1.05rem] font-bold text-[var(--primary)]">
              {createMonthLabel(currentMonth)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border-[1.5px] border-[var(--gray-200)] bg-white text-[var(--gray-600)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                aria-label={t('previousMonth')}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border-[1.5px] border-[var(--gray-200)] bg-white text-[var(--gray-600)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                aria-label={t('nextMonth')}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="py-1 text-center text-[0.72rem] font-bold tracking-[0.5px] text-[var(--gray-400)]"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dayMatrix.map((day) => {
              if (day.isPadding) {
                return <div key={day.key} className="aspect-square" />;
              }

              return (
                <button
                  key={day.key}
                  type="button"
                  disabled={day.isDisabled}
                  onClick={() => void handleSelectDate(day.date)}
                  className={cn(
                    'relative aspect-square rounded-[var(--radius-md)] border-2 border-transparent text-[0.82rem] font-medium text-[var(--primary)] transition-all duration-200',
                    day.hasSlot && 'font-bold',
                    day.isToday && 'border-[var(--primary-light)] font-bold',
                    day.isSelected &&
                      'border-[var(--accent)] bg-[var(--accent)] font-bold !text-[var(--primary-dark)]',
                    !day.isDisabled && !day.isSelected && 'hover:bg-[var(--primary-faint)]',
                    day.isDisabled && 'cursor-not-allowed text-[var(--gray-300)]',
                  )}
                >
                  {day.label}
                  {day.hasSlot ? (
                    <span
                      className={cn(
                        'absolute bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]',
                        day.isSelected && 'bg-[var(--primary-dark)]',
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--gray-100)] bg-white p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-1.5 font-heading text-[1.05rem] font-bold text-[var(--primary)]">
            {t('availableSlots')}
          </div>
          <div className="mb-[18px] flex items-center gap-1.5 text-[0.82rem] text-[var(--gray-500)]">
            <CalendarDays className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>
              {selectedDate ? formatBookingDateLabel(selectedDate) : t('chooseDate')}
            </span>
          </div>

          {selectedDate ? (
            availabilityQuery.isLoading ? (
              <div className="py-8 text-center text-[0.875rem] text-[var(--gray-400)]">
                {t('loadingSlots')}
              </div>
            ) : availabilityQuery.isError ? (
              <div className="py-8 text-center text-[0.875rem] text-[var(--gray-400)]">
                <CalendarDays className="mx-auto mb-2 h-8 w-8 text-[var(--gray-300)]" />
                <span>{t('slotsError')}</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="py-8 text-center text-[0.875rem] text-[var(--gray-400)]">
                <CalendarDays className="mx-auto mb-2 h-8 w-8 text-[var(--gray-300)]" />
                <span>{t('noSlots')}</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-3">
                {slots.map((slot) => {
                  const isSelected = timeSlot?.slotId === slot.slotId;
                  const isBooked = slot.status === 'booked';

                  return (
                    <button
                      key={slot.slotId}
                      type="button"
                      disabled={isBooked || reserveSlotMutation.isPending}
                      onClick={() => void handleSelectSlot(slot.slotId)}
                      className={cn(
                        'rounded-[var(--radius-md)] border-[1.5px] px-1.5 py-2.5 text-center text-[0.82rem] font-semibold transition-all duration-200',
                        isBooked &&
                          'cursor-not-allowed border-[var(--gray-200)] bg-[var(--gray-50)] text-[var(--gray-300)] line-through',
                        isSelected &&
                          'border-[var(--accent)] bg-[var(--accent)] text-[var(--primary-dark)]',
                        !isBooked &&
                          !isSelected &&
                          'border-[var(--gray-200)] bg-white text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-faint)]',
                      )}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="py-8 text-center text-[0.875rem] text-[var(--gray-400)]">
              <CalendarDays className="mx-auto mb-2 h-8 w-8 text-[var(--gray-300)]" />
              <span>{t('select_date')}</span>
            </div>
          )}

          <div className="mt-6 border-t border-[var(--gray-100)] pt-5">
            <div className="mb-3 text-[0.875rem] font-bold text-[var(--primary)]">{t('consultationType')}</div>
            <div className="flex flex-col gap-2">
              {BOOKING_CONSULTATION_TYPES.map((option) => {
                const selected = consultationType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setConsultationType(option.id)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-[var(--radius-md)] border-[1.5px] px-3.5 py-2.5 text-left text-[0.875rem] transition-all duration-200',
                      selected
                        ? 'border-[var(--accent)] bg-[#FEF9EF]'
                        : 'border-[var(--gray-200)] hover:border-[var(--primary)]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2',
                        selected
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-[var(--gray-300)]',
                      )}
                    >
                      {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                    </span>
                    <BookingIcon name={option.icon} className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span className="flex-1">
                      <strong className="block text-[0.875rem] text-[var(--primary)]">{t(`consultation.${option.id}`)}</strong>
                      <span className="text-[0.75rem] text-[var(--gray-500)]">{t(`consultation.${option.id}Description`)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-[var(--gray-100)] pt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border-[1.5px] border-[var(--gray-200)] bg-white px-[22px] py-[11px] text-[0.875rem] font-semibold text-[var(--gray-600)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{tCommon('back')}</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-7 py-[11px] text-[0.875rem] font-bold text-[var(--primary-dark)] transition-all duration-200 hover:-translate-y-px hover:bg-[var(--accent-dark)] hover:shadow-[0_4px_15px_rgba(201,168,76,0.3)] disabled:cursor-not-allowed disabled:bg-[var(--gray-200)] disabled:text-[var(--gray-400)] disabled:shadow-none"
        >
          <span>{t('next')}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
