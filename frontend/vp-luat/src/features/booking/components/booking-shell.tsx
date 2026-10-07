'use client';

import { BookingFooter } from './booking-footer';
import { BookingHero } from './booking-hero';
import { BookingProgress } from './booking-progress';
import type { BookingStep } from '../types';

export function BookingShell({
  step,
  children,
}: {
  step: BookingStep;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--off-white)] text-[var(--primary)]">
      <BookingHero />
      <BookingProgress step={step} />
      <div className="mx-auto max-w-[1100px] px-4 py-10 pb-20">{children}</div>
      <BookingFooter />
    </main>
  );
}
