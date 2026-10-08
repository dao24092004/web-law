'use client';

import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { PublicSiteContent } from '@/features/home/api/site-content-api';
import { useTranslations } from 'next-intl';

export function ContactInfoList({ contact }: { contact: PublicSiteContent['contact'] }) {
  const t = useTranslations('contactPage.info');
  const items = [
    { icon: MapPin, label: t('address'), value: contact.address, sub: t('addressSub'), href: contact.mapUrl },
    { icon: Phone, label: t('phone'), value: contact.hotline, sub: t('phoneSub'), href: contact.hotline ? `tel:${contact.hotline.replace(/\s/g, '')}` : undefined },
    { icon: Mail, label: t('email'), value: contact.email, sub: t('emailSub'), href: contact.email ? `mailto:${contact.email}` : undefined },
    { icon: Clock, label: t('hours'), value: contact.workingHours, sub: t('hoursSub'), href: undefined },
  ];

  return (
    <div className="info-list">
      {items
        .filter((item) => item.value)
        .map(({ icon: Icon, label, value, sub, href }) => (
          <div className="info-card" key={label}>
            <div className="info-card__icon">
              <Icon size={20} />
            </div>
            <div className="info-card__content">
              <div className="info-card__label">{label}</div>
              <div className="info-card__value">
                {href ? (
                  <a
                    href={href}
                    {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {value}
                  </a>
                ) : (
                  value
                )}
              </div>
              <div className="info-card__sub">{sub}</div>
            </div>
          </div>
        ))}
    </div>
  );
}
