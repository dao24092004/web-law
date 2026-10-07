'use client';

import { useTranslations } from 'next-intl';
import { Bolt, Lock, ShieldCheck } from 'lucide-react';

const TRUST_KEYS = ['free', 'reply', 'privacy'] as const;
const trustIcons = [ShieldCheck, Bolt, Lock];

export function BookingHero() {
  const t = useTranslations('booking');
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-dark)_100%)] px-6 pb-10 pt-[132px] text-center max-[480px]:pt-[108px]">
      <div className="relative z-10 mx-auto max-w-3xl">
        <h1 className="mb-1.5 font-heading text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-white">{t('heroTitle')}</h1>
        <p className="mb-4 text-[0.9rem] text-white/65">{t('heroSubtitle')}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 max-[480px]:gap-x-4">
          {TRUST_KEYS.map((key, index) => {
            const Icon = trustIcons[index] ?? ShieldCheck;
            return <span key={key} className="inline-flex items-center gap-1.5 text-[0.8rem] text-white/70"><Icon className="h-3 w-3 text-[var(--accent)]" /><span>{t(`trust.${key}`)}</span></span>;
          })}
        </div>
      </div>
    </section>
  );
}
