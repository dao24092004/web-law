'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';
import { useFeaturedLawyers } from '@/features/lawyers/hooks/use-lawyers';
import type { LawyerApiResponse } from '@/features/lawyers/api/lawyers-api';
import { getDisplayLabel } from '@/lib/display-labels';

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function getSpecialtyLabels(lawyer: LawyerApiResponse, specialtyLabel: string): string[] {
  if (lawyer.serviceNames && lawyer.serviceNames.length > 0) {
    return lawyer.serviceNames
      .filter((s): s is string => !!s)
      .map((serviceName) => getDisplayLabel(serviceName, specialtyLabel));
  }
  return (lawyer.specialties ?? []).map((specialty) => getDisplayLabel(specialty, specialtyLabel));
}

export function LawyersSection() {
  const t = useTranslations('homeSections.lawyers');
  const { data: lawyers = [], isLoading } = useFeaturedLawyers();

  const featuredLawyers = useMemo(() => lawyers.slice(0, 4), [lawyers]);

  return (
    <section className="section section--gray">
      <div className="container">
        <div className="section__header">
          <span className="section__label">{t('label')}</span>
          <h2 className="section__title">{t('title')}</h2>
          <p className="section__subtitle">{t('subtitle')}</p>
        </div>

        <div className="team__grid">
          {!isLoading && featuredLawyers.length === 0 && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>
              {t('empty')}
            </p>
          )}
          {isLoading && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>
              {t('loading')}
            </p>
          )}
          {featuredLawyers.map((lawyer) => {
            const tags = getSpecialtyLabels(lawyer, t('specialty'));
            return <LawyerCardItem key={lawyer.id} lawyer={lawyer} tags={tags} experienceLabel={t('experience')} viewProfileLabel={t('viewProfile')} facebookLabel={t('facebookOf', { name: lawyer.name })} linkedinLabel={t('linkedinOf', { name: lawyer.name })} />;
          })}
        </div>
      </div>
    </section>
  );
}

function LawyerCardItem({
  lawyer,
  tags,
  experienceLabel,
  viewProfileLabel,
  facebookLabel,
  linkedinLabel,
}: {
  lawyer: LawyerApiResponse;
  tags: string[];
  experienceLabel: string;
  viewProfileLabel: string;
  facebookLabel: string;
  linkedinLabel: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(lawyer.avatar) && !imageFailed;

  return (
    <div className="lawyer-card">
      <div className="lawyer-card__image lawyer-card__image--placeholder">
        {showImage ? (
          <img
            src={lawyer.avatar}
            alt={lawyer.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="lawyer-card__avatar lawyer-card__avatar--static">{lawyer.initials}</div>
        )}
        <div className="lawyer-card__overlay">
          <div className="lawyer-card__socials">
            <a
              href={`https://facebook.com/${lawyer.slug ?? lawyer.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lawyer-card__social"
              aria-label={facebookLabel}
            >
              <FacebookIcon size={16} />
            </a>
            <a
              href={`https://linkedin.com/in/${lawyer.slug ?? lawyer.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lawyer-card__social"
              aria-label={linkedinLabel}
            >
              <LinkedinIcon size={16} />
            </a>
          </div>
        </div>
      </div>
      <div className="lawyer-card__body">
        <h3 className="lawyer-card__name">{lawyer.name}</h3>
        <p className="lawyer-card__position">{lawyer.position}</p>
        <div className="lawyer-card__tags">
          {tags.slice(0, 3).map((tag, i) => (
            <span key={`${tag}-${i}`} className="lawyer-card__tag">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="lawyer-card__tag lawyer-card__tag--more">
              +{tags.length - 3}
            </span>
          )}
        </div>
        <div className="lawyer-card__experience">
          <span className="lawyer-card__exp-icon">
            <Calendar size={14} />
          </span>
          <span className="lawyer-card__exp-text">
            <strong>{lawyer.experience} {experienceLabel}</strong>
          </span>
        </div>
        <Link
          href={`/lawyers/${lawyer.slug || lawyer.id}`}
          className="lawyer-card__btn"
        >
          {viewProfileLabel}
        </Link>
      </div>
    </div>
  );
}
