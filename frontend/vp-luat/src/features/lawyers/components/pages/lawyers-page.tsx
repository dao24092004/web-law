'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LawyersHero } from '@/features/lawyers/components/lawyers-hero';
import { LawyersFilterChips } from '@/features/lawyers/components/lawyers-filter-chips';
import { LawyerCard } from '@/features/lawyers/components/lawyer-card';
import { LawyerProfileModal } from '@/features/lawyers/components/lawyer-profile-modal';
import { useLawyers } from '@/features/lawyers/hooks/use-lawyers';
import { useServices } from '@/features/services/hooks/use-services';
import type { LawyerApiResponse } from '@/features/lawyers/api/lawyers-api';
import { useTranslations } from 'next-intl';

export default function LawyersPage() {
  const t = useTranslations('public.lawyers');
  const common = useTranslations('common');
  const router = useRouter();
  const [active, setActive] = useState<'all' | string>('all');
  const [profileLawyer, setProfileLawyer] = useState<LawyerApiResponse | null>(null);

  const { data: services = [] } = useServices();
  const { data: lawyers = [], isLoading } = useLawyers(0, 100);

  // Map: tên dịch vụ (label đẹp) → count lawyer.
  // Nếu services API fail/trả rỗng, lấy tên từ lawyers' serviceNames để filter vẫn hiển thị.
  const serviceInfo = useMemo(() => {
    // Từ services API
    const serviceMap = new Map(services.map((s) => [s.slug, { name: s.name, icon: s.icon }]));
    // Fallback: extract từ lawyers nếu serviceMap trống
    if (serviceMap.size === 0 && lawyers.length > 0) {
      lawyers.forEach((l) => {
        const slugs = l.serviceSlugs ?? [];
        const names = l.serviceNames ?? [];
        slugs.forEach((slug, i) => {
          if (slug && !serviceMap.has(slug)) {
            serviceMap.set(slug, { name: names[i] || slug, icon: 'fa-solid fa-gavel' });
          }
        });
      });
    }
    return Array.from(serviceMap.entries()).map(([slug, info]) => ({
      slug,
      name: info.name,
      icon: info.icon,
    }));
  }, [services, lawyers]);

  const countByServiceSlug = useMemo(() => {
    const map: Record<string, number> = {};
    lawyers.forEach((l) => {
      const slugs = l.serviceSlugs ?? l.specialties ?? [];
      slugs.forEach((s) => {
        if (s) map[s] = (map[s] ?? 0) + 1;
      });
    });
    return map;
  }, [lawyers]);

  const heroStats = useMemo(() => {
    const totalExperience = lawyers.reduce((sum, l) => sum + (l.experience ?? 0), 0);
    const totalCases = lawyers.reduce((sum, l) => sum + (l.successfulCases ?? 0), 0);
    const specialtySlugs = new Set<string>();
    lawyers.forEach((l) => {
      (l.serviceSlugs ?? l.specialties ?? []).forEach((s) => s && specialtySlugs.add(s));
    });
    return {
      totalExperience,
      totalCases,
      specialtyCount: specialtySlugs.size,
    };
  }, [lawyers]);

  const filtered = useMemo(() => {
    if (active === 'all') return lawyers;
    return lawyers.filter((l) => {
      const slugs = l.serviceSlugs ?? l.specialties ?? [];
      return slugs.includes(active);
    });
  }, [active, lawyers]);

  const handleViewProfile = (lawyer: LawyerApiResponse) => setProfileLawyer(lawyer);
  const handleBook = (lawyer: LawyerApiResponse) => {
    router.push(`/booking?lawyer=${lawyer.id}`);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>{common('loading')}</p>
      </div>
    );
  }

  return (
    <>
      <LawyersHero
        totalCount={lawyers.length || 0}
        totalExperience={heroStats.totalExperience}
        totalCases={heroStats.totalCases}
        specialtyCount={heroStats.specialtyCount}
      />
      <LawyersFilterChips
        active={active}
        onChange={setActive}
        services={serviceInfo}
        totalLawyers={lawyers.length}
        countByServiceSlug={countByServiceSlug}
      />

      <section className="lawyers-section">
        <div className="container">
          <div className={`lawyers-grid${filtered.length > 0 && filtered.length <= 3 ? ' lawyers-grid--few' : ''}`}>
            {filtered.map((l) => (
              <LawyerCard
                key={l.id}
                lawyer={l}
                onViewProfile={handleViewProfile}
                onBook={handleBook}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="lawyers-empty">
              <p>{t('empty')}</p>
            </div>
          )}
        </div>
      </section>

      <LawyerProfileModal lawyer={profileLawyer} onClose={() => setProfileLawyer(null)} />
    </>
  );
}
