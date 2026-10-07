import { PageHero } from '@/components/layout/page-hero';
import { useTranslations } from 'next-intl';

interface LawyersHeroProps {
  totalCount: number;
  totalExperience?: number;
  totalCases?: number;
  specialtyCount?: number;
}

export function LawyersHero({
  totalCount,
  totalExperience = 0,
  totalCases = 0,
  specialtyCount = 0,
}: LawyersHeroProps) {
  const t = useTranslations('public.lawyers');

  const stats =
    totalCount > 0
      ? [
          { value: String(totalCount), label: t('stats.lawyers') },
          ...(totalExperience > 0
            ? [{ value: `${totalExperience}+`, label: t('stats.experience') }]
            : []),
          ...(totalCases > 0
            ? [{ value: `${totalCases}+`, label: t('stats.cases') }]
            : []),
          ...(specialtyCount > 0
            ? [{ value: String(specialtyCount), label: t('stats.specialties') }]
            : []),
        ]
      : undefined;

  return (
    <PageHero
      eyebrow={t('hero.eyebrow')}
      title={t('hero.title')}
      highlight={t('hero.highlight')}
      subtitle={t('hero.subtitle')}
      breadcrumb={[
        { label: t('breadcrumb.home'), href: '/' },
        { label: t('breadcrumb.current') },
      ]}
      stats={stats}
    />
  );
}
