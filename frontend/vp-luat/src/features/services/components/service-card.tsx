import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import type { Service } from '../types';
import { getDisplayLabel } from '@/lib/display-labels';
import { useLocale, useTranslations } from 'next-intl';

interface ServiceCardProps {
  service: Service;
}

const COLOR_CLASS: Record<string, string> = {
  primary: 'service-card__icon--primary',
  accent: 'service-card__icon--accent',
  green: 'service-card__icon--green',
  red: 'service-card__icon--red',
  blue: 'service-card__icon--blue',
  purple: 'service-card__icon--purple',
};

function formatPrice(v: number | undefined, locale: string, contactLabel: string): string {
  if (!v) return contactLabel;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}

export function ServiceCard({ service }: ServiceCardProps) {
  const t = useTranslations('public.services.serviceCard');
  const filters = useTranslations('public.filters');
  const locale = useLocale();
  const colorClass = COLOR_CLASS[service.color || 'primary'] || COLOR_CLASS.primary;
  const categoryLabel = filters.has(`categories.${service.category}`)
    ? filters(`categories.${service.category}`)
    : getDisplayLabel(service.category, filters('categories.other'));
  const features = service.features || [];
  const hasLawyer = !!service.lawyerId;
  const icon = service.icon || 'fa-solid fa-gavel';

  return (
    <article className="service-card fade-in">
      <div className="service-card__top">
        <i className={`service-card__icon ${colorClass} ${icon}`} aria-hidden="true" />
        {service.popular && (
          <span className="service-card__category">{t('popular')}</span>
        )}
        {!service.popular && (
          <span className="service-card__category">
            {categoryLabel}
          </span>
        )}
      </div>

      <h3 className="service-card__name">{service.name}</h3>
      <p className="service-card__desc">{service.shortDescription}</p>

      {features.length > 0 && (
        <ul className="service-card__list">
          {features.slice(0, 3).map((f, i) => (
            <li key={`${f}-${i}`} className="service-card__list-item">
              <Check size={12} strokeWidth={3} className="service-card__list-icon" aria-hidden="true" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {hasLawyer && (
        <div className="service-card__lawyer">
          <div className="service-card__lawyer-avatar" aria-hidden="true">
            <i className="fa-solid fa-user" />
          </div>
          <div className="service-card__lawyer-info">
            <div className="service-card__lawyer-name">{t('consultant')}</div>
            <div className="service-card__lawyer-exp">
              {t('legalExpert')}
            </div>
          </div>
        </div>
      )}

      <div className="service-card__footer">
        <div className="service-card__price">
          <span className="service-card__price-label">{t('from')}</span>
          <span className="service-card__price-value">{formatPrice(service.price, locale === 'en' ? 'en-US' : 'vi-VN', t('contact'))}</span>
        </div>
        <Link
          href={`/services/${service.slug}`}
          className="service-card__cta"
          aria-label={t('learnMoreAria', { name: service.name })}
        >
          {t('learnMore')}
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
