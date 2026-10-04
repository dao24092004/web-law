'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { bookingFormSchema, type BookingFormValues } from '../schemas';
import { trackBookingSubmitFailed, trackBookingSubmitStarted, trackBookingSubmitSucceeded } from '../analytics';
import { useBookingStore, useSubmitBookingMutation } from '../hooks';
import { SummaryCard } from './summary-card';

export function StepInfo({
  onBack,
  onSubmitSuccess,
}: {
  onBack: () => void;
  onSubmitSuccess: () => void;
}) {
  const t = useTranslations('booking');
  const tCommon = useTranslations('common');
  const service = useBookingStore((state) => state.service);
  const lawyer = useBookingStore((state) => state.lawyer);
  const customerInfo = useBookingStore((state) => state.customerInfo);
  const reservation = useBookingStore((state) => state.reservation);
  const consultationType = useBookingStore((state) => state.consultationType);
  const setCustomerInfo = useBookingStore((state) => state.setCustomerInfo);
  const setConfirmation = useBookingStore((state) => state.setConfirmation);
  const setReservation = useBookingStore((state) => state.setReservation);
  const setTimeSlot = useBookingStore((state) => state.setTimeSlot);
  const setStep = useBookingStore((state) => state.setStep);
  const submitBookingMutation = useSubmitBookingMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: 'onChange',
    defaultValues: customerInfo,
  });

  const agreedToTerms = watch('agreedToTerms');

  useEffect(() => {
    const subscription = watch((values) => {
      setCustomerInfo({
        fullName: values.fullName ?? '',
        phone: values.phone ?? '',
        email: values.email ?? '',
        issueSummary: values.issueSummary ?? '',
        agreedToTerms: Boolean(values.agreedToTerms),
      });
    });

    return () => subscription.unsubscribe();
  }, [setCustomerInfo, watch]);

  const handleReservationExpire = () => {
    setReservation(null);
    setTimeSlot(null);
    toast.error(t('reservationExpired'));
    setStep('datetime');
  };

  const onSubmit = async (values: BookingFormValues) => {
    if (!reservation || !service || !lawyer) {
      toast.error(t('reservationInvalid'));
      setStep('datetime');
      return;
    }

    trackBookingSubmitStarted();

    try {
      const confirmation = await submitBookingMutation.mutateAsync({
        reservationId: reservation.reservationId,
        serviceId: service.slug ?? service.id,
        lawyerId: lawyer.id,
        consultationType,
        customer: {
          fullName: values.fullName,
          phone: values.phone,
          email: values.email ?? '',
          issueSummary: values.issueSummary,
        },
      });

      setCustomerInfo({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email ?? '',
        issueSummary: values.issueSummary,
        agreedToTerms: Boolean(values.agreedToTerms),
      });
      setConfirmation(confirmation);
      setReservation(null);
      trackBookingSubmitSucceeded(confirmation.bookingId);
      onSubmitSuccess();
    } catch (err) {
      const errorCode = err instanceof Error ? err.message : 'UNKNOWN';
      trackBookingSubmitFailed(errorCode);

      // Try to surface the real backend error message instead of a generic toast.
      // Axios errors attach `response.data` with our standard { success, message, data } wrapper.
      const axiosErr = err as { response?: { data?: { message?: string; data?: { message?: string } } }; message?: string };
      const backendMessage =
        axiosErr.response?.data?.data?.message ||
        axiosErr.response?.data?.message ||
        axiosErr.message;

      toast.error(
        backendMessage
          ? `${t('bookingFailed')}: ${backendMessage}`
          : t('bookingFailedRetry'),
      );
    }
  };

  return (
    <section className="animate-in fade-in slide-in-from-right-1 duration-300">
      <h2 className="mb-1.5 font-heading text-[1.5rem] font-bold text-[var(--primary)]">
        {t('infoTitle')}
      </h2>
      <p className="mb-7 text-[0.875rem] text-[var(--gray-500)]">
        {t('infoSubtitle')}
      </p>

      <div className="grid gap-8 md:grid-cols-[1fr_340px] md:items-start">
        <form
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          className="rounded-[var(--radius-xl)] border border-[var(--gray-100)] bg-white p-7 shadow-[var(--shadow-sm)]"
        >
          <div className="mb-[18px]">
            <label htmlFor="booking-fullName" className="mb-1.5 block text-[0.82rem] font-bold text-[var(--primary)]">
              {t('fullName')} <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="booking-fullName"
              {...register('fullName')}
              aria-describedby={errors.fullName ? 'booking-fullName-error' : undefined}
              aria-invalid={!!errors.fullName}
              className="w-full rounded-[var(--radius-md)] border-[1.5px] border-[var(--gray-200)] px-[14px] py-[11px] text-[0.9rem] text-[var(--primary)] outline-none transition focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(30,58,95,0.07)] aria-invalid:border-[var(--error)]"
              placeholder={t('fullNamePlaceholder')}
            />
            {errors.fullName ? (
              <p id="booking-fullName-error" className="mt-1 text-[0.75rem] text-[var(--error)]" role="alert">{errors.fullName.message}</p>
            ) : null}
          </div>

          <div className="mb-[18px]">
            <label htmlFor="booking-phone" className="mb-1.5 block text-[0.82rem] font-bold text-[var(--primary)]">
              {t('phone')} <span className="text-[var(--error)]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-[14px] text-[0.875rem] text-[var(--gray-600)]">+84</span>
              <input
                id="booking-phone"
                {...register('phone')}
                aria-describedby={errors.phone ? 'booking-phone-error' : undefined}
                aria-invalid={!!errors.phone}
                className="w-full rounded-[var(--radius-md)] border-[1.5px] border-[var(--gray-200)] px-[14px] py-[11px] pl-[52px] text-[0.9rem] text-[var(--primary)] outline-none transition focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(30,58,95,0.07)] aria-invalid:border-[var(--error)]"
                placeholder={t('phonePlaceholder')}
              />
            </div>
            {errors.phone ? (
              <p id="booking-phone-error" className="mt-1 text-[0.75rem] text-[var(--error)]" role="alert">{errors.phone.message}</p>
            ) : null}
          </div>

          <div className="mb-[18px]">
            <label htmlFor="booking-email" className="mb-1.5 block text-[0.82rem] font-bold text-[var(--primary)]">{t('email')}</label>
            <input
              id="booking-email"
              {...register('email')}
              aria-describedby={errors.email ? 'booking-email-error' : undefined}
              aria-invalid={!!errors.email}
              className="w-full rounded-[var(--radius-md)] border-[1.5px] border-[var(--gray-200)] px-[14px] py-[11px] text-[0.9rem] text-[var(--primary)] outline-none transition focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(30,58,95,0.07)] aria-invalid:border-[var(--error)]"
              placeholder="email@example.com"
            />
            {errors.email ? (
              <p id="booking-email-error" className="mt-1 text-[0.75rem] text-[var(--error)]" role="alert">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="mb-[18px]">
            <label htmlFor="booking-issueSummary" className="mb-1.5 block text-[0.82rem] font-bold text-[var(--primary)]">
              {t('issueSummary')} <span className="text-[var(--error)]">*</span>
            </label>
            <textarea
              id="booking-issueSummary"
              {...register('issueSummary')}
              aria-describedby={errors.issueSummary ? 'booking-issueSummary-error' : undefined}
              aria-invalid={!!errors.issueSummary}
              className="min-h-[110px] w-full resize-y rounded-[var(--radius-md)] border-[1.5px] border-[var(--gray-200)] px-[14px] py-[11px] text-[0.9rem] text-[var(--primary)] outline-none transition focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(30,58,95,0.07)] aria-invalid:border-[var(--error)]"
              placeholder={t('issueSummaryPlaceholder')}
            />
            {errors.issueSummary ? (
              <p id="booking-issueSummary-error" className="mt-1 text-[0.75rem] text-[var(--error)]" role="alert">{errors.issueSummary.message}</p>
            ) : null}
          </div>

          <button
            type="button"
            role="checkbox"
            aria-checked={agreedToTerms}
            aria-describedby={errors.agreedToTerms ? 'booking-terms-error' : undefined}
            onClick={() => setValue('agreedToTerms', !agreedToTerms, { shouldValidate: true })}
            className="mb-4 flex items-start gap-2.5 text-left"
          >
            <span
              className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] border-2 ${
                agreedToTerms
                  ? 'border-[var(--primary)] bg-[var(--primary)]'
                  : 'border-[var(--gray-300)] bg-white'
              }`}
            >
              {agreedToTerms ? (
                <span className="h-2 w-2 rotate-[-45deg] rounded-sm border-b-2 border-l-2 border-white" />
              ) : null}
            </span>
            <span className="text-[0.82rem] leading-[1.5] text-[var(--gray-600)]">
              {t('termsAgreementPrefix')}{' '}
              <span className="font-semibold text-[var(--primary)] underline">{t('terms')}</span>{' '}
              {t('and')}{' '}
              <span className="font-semibold text-[var(--primary)] underline">{t('privacy')}</span>{' '}
              {t('termsAgreementSuffix')} <span className="text-[var(--error)]">*</span>
            </span>
          </button>
          {errors.agreedToTerms ? (
            <p id="booking-terms-error" className="mb-4 text-[0.75rem] text-[var(--error)]" role="alert">{errors.agreedToTerms.message}</p>
          ) : null}

          <button
            type="submit"
            disabled={!isValid || submitBookingMutation.isPending || !reservation}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-6 py-3.5 text-[1rem] font-bold text-[var(--primary-dark)] transition-all duration-200 hover:-translate-y-px hover:bg-[var(--accent-dark)] hover:shadow-[0_4px_15px_rgba(201,168,76,0.3)] disabled:cursor-not-allowed disabled:bg-[var(--gray-200)] disabled:text-[var(--gray-400)]"
          >
            <CalendarCheck className="h-5 w-5" />
            <span>{submitBookingMutation.isPending ? t('processing') : t('confirmBooking')}</span>
          </button>
        </form>

        <SummaryCard onReservationExpire={handleReservationExpire} />
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
      </div>
    </section>
  );
}
