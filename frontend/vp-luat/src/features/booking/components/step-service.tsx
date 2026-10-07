'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { trackBookingLawyerSelected, trackBookingServiceSelected } from '../analytics';
import { useBookingStore, useLawyerByIdQuery, useLawyersQuery } from '../hooks';
import { useBookingServices } from '../hooks/use-booking-services';
import { ServiceGrid } from './service-grid';
import { LawyerSection } from './lawyer-section';
import type { BookingLawyerOption } from '../types';

function toBookingLawyerOption(lawyer: {
  id: string;
  nameVi?: string;
  nameEn?: string;
  positionVi?: string;
  avatarUrl?: string;
  isFeatured?: boolean;
  rating?: number | null;
  reviewCount?: number;
  isAvailableToday?: boolean;
}, getAvailabilityLabel: (key: 'availableToday' | 'unavailableToday') => string): BookingLawyerOption {
  const name = lawyer.nameVi || lawyer.nameEn || 'Lawyer';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const gradients = [
    'linear-gradient(135deg, #1E3A5F, #2A4F7A)',
    'linear-gradient(135deg, #2A4F7A, #C9A84C)',
    'linear-gradient(135deg, #152A45, #1E3A5F)',
    'linear-gradient(135deg, #3B2F7A, #6B4FA0)',
    'linear-gradient(135deg, #1A4A3A, #2E7D5E)',
  ];
  const gradientIndex = parseInt(lawyer.id.replace(/-/g, '').slice(0, 8), 16) % gradients.length;

  const result: BookingLawyerOption = {
    id: lawyer.id,
    name,
    initials,
    specialty: lawyer.positionVi || '',
    avatarGradient: gradients[gradientIndex],
    avatarUrl: lawyer.avatarUrl,
  };

  // Only attach rating/availability when the API actually returned them —
  // never fabricate "5.0" or "Còn lịch hôm nay" for every lawyer.
  if (typeof lawyer.rating === 'number' && Number.isFinite(lawyer.rating)) {
    result.rating = lawyer.rating;
  }
  if (typeof lawyer.reviewCount === 'number') {
    result.reviewCount = lawyer.reviewCount;
  }
  if (lawyer.isAvailableToday === true) {
    result.isAvailableToday = true;
    result.availabilityLabel = getAvailabilityLabel('availableToday');
  } else if (lawyer.isAvailableToday === false) {
    result.isAvailableToday = false;
    result.availabilityLabel = getAvailabilityLabel('unavailableToday');
  }

  return result;
}

export function StepService({ onNext }: { onNext: () => void }) {
  const t = useTranslations('booking');
  const searchParams = useSearchParams();
  const presetLawyerId = searchParams.get('lawyer');

  const service = useBookingStore((state) => state.service);
  const lawyer = useBookingStore((state) => state.lawyer);
  const setService = useBookingStore((state) => state.setService);
  const setLawyer = useBookingStore((state) => state.setLawyer);

  const { services: allServices } = useBookingServices();

  // When arriving from a lawyer's profile ("Đặt lịch tư vấn"), the lawyer is
  // preset via ?lawyer=<id> — fetch that lawyer's own data instead of making
  // the user pick a lawyer again.
  const isLawyerPreset = Boolean(presetLawyerId);
  const { data: presetLawyer } = useLawyerByIdQuery(presetLawyerId);

  // Fetch lawyers filtered by selected service slug (only used in the
  // "no preset lawyer" flow where the user picks service then lawyer).
  const { data: rawLawyers = [], refetch } = useLawyersQuery(
    isLawyerPreset ? undefined : service?.slug,
  );

  // Refetch when service changes to get relevant lawyers
  useEffect(() => {
    if (!isLawyerPreset && service?.slug) {
      refetch();
    }
  }, [isLawyerPreset, service?.slug, refetch]);

  // Reset lawyer selection when service changes (only relevant to the
  // manual-pick flow; the preset lawyer must never be cleared this way).
  const prevServiceId = useBookingStore((state) => state.service?.id);
  useEffect(() => {
    if (!isLawyerPreset && prevServiceId && service?.id && prevServiceId !== service.id) {
      setLawyer(null as unknown as BookingLawyerOption);
    }
  }, [isLawyerPreset, service?.id, prevServiceId, setLawyer]);

  // Lock the preset lawyer into the store as soon as it's fetched.
  const appliedPresetLawyerId = useRef<string | null>(null);
  useEffect(() => {
    if (!isLawyerPreset || !presetLawyer) {
      return;
    }
    if (appliedPresetLawyerId.current === presetLawyer.id && lawyer?.id === presetLawyer.id) {
      return;
    }
    appliedPresetLawyerId.current = presetLawyer.id;
    setLawyer(toBookingLawyerOption(presetLawyer, (key) => t(key)));
  }, [isLawyerPreset, presetLawyer, lawyer?.id, setLawyer, t]);

  // Narrow the service list down to only the services this lawyer actually
  // offers, so the user "just has to pick a service".
  const bookingServices = useMemo(() => {
    if (!isLawyerPreset) {
      return allServices;
    }
    if (!presetLawyer) {
      return [];
    }
    const slugs = new Set(presetLawyer.serviceSlugs ?? []);
    if (slugs.size === 0) {
      return allServices;
    }
    return allServices.filter((svc) => slugs.has(svc.slug));
  }, [isLawyerPreset, allServices, presetLawyer]);

  const bookingLawyers: BookingLawyerOption[] = rawLawyers.map((lawyer) =>
    toBookingLawyerOption(lawyer, (key) => t(key)),
  );

  const canProceed = Boolean(service && lawyer);

  const handleSelectService = (svc: typeof service) => {
    if (svc) {
      setService(svc);
      trackBookingServiceSelected(svc.slug, svc.id);
    }
  };

  const handleSelectLawyer = (l: BookingLawyerOption) => {
    if (l) {
      setLawyer(l);
      trackBookingLawyerSelected(l.id, l.name);
    }
  };

  return (
    <section className="animate-in fade-in slide-in-from-right-1 duration-300">
      <h2 className="mb-1.5 font-heading text-[1.5rem] font-bold text-[var(--primary)]">
        {t('serviceTitle')}
      </h2>
      <p className="mb-7 text-[0.875rem] text-[var(--gray-500)]">
        {isLawyerPreset && presetLawyer
          ? t('serviceSubtitleWithLawyer', { name: presetLawyer.nameVi || presetLawyer.nameEn || '' })
          : t('serviceSubtitle')}
      </p>

      <ServiceGrid
        services={bookingServices}
        selectedServiceId={service?.id ?? null}
        onSelect={handleSelectService}
      />

      {!isLawyerPreset && (
        <LawyerSection
          lawyers={bookingLawyers}
          visible={Boolean(service)}
          selectedLawyerId={lawyer?.id ?? null}
          onSelect={handleSelectLawyer}
        />
      )}

      <div className="mt-8 flex justify-end border-t border-[var(--gray-100)] pt-6">
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
