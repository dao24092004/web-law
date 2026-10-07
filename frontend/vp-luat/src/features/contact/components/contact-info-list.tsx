'use client';

import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { PublicSiteContent } from '@/features/home/api/site-content-api';
import { useTranslations } from 'next-intl';

export function ContactInfoList({ contact }: { contact: PublicSiteContent['contact'] }) {
  const t = useTranslations('contactPage.info');
  const items = [
    { icon: MapPin, label: t('address'), value: contact.address, sub: t('addressSub') },
    { icon: Phone, label: t('phone'), value: contact.hotline, sub: t('phoneSub') },
    { icon: Mail, label: t('email'), value: contact.email, sub: t('emailSub') },
    { icon: Clock, label: t('hours'), value: t('hoursValue'), sub: t('hoursSub') },
  ];

  return (
    <div className="info-list">
      {items
        .filter((item) => item.value)
        .map(({ icon: Icon, label, value, sub }) => (
          <div className="info-card" key={label}>
            <div className="info-card__icon">
              <Icon size={20} />
            </div>
            <div className="info-card__content">
              <div className="info-card__label">{label}</div>
              <div className="info-card__value">{value}</div>
              <div className="info-card__sub">{sub}</div>
            </div>
          </div>
        ))}
    </div>
  );
}
