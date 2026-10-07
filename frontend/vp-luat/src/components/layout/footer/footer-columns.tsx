'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useFeaturedServices } from '@/features/services/hooks/use-services';
import { usePublicSiteContent } from '@/features/home/hooks/use-site-content';

const MAX_FOOTER_SERVICES = 5;

function normalizeExternalUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YoutubeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

const FOOTER_LINKS = {
  contact: {
    items: [
      { icon: MapPin, key: 'address' },
      { icon: Phone, key: 'hotline' },
      { icon: Mail, key: 'email' },
    ],
  },
};

export function FooterColumns() {
  const t = useTranslations('footer');
  const { data: featuredServices = [] } = useFeaturedServices();
  const { data: siteContent } = usePublicSiteContent();
  const contactValues = {
    address: siteContent?.contact.address?.trim() ?? '',
    hotline: siteContent?.contact.hotline?.trim() ?? '',
    email: siteContent?.contact.email?.trim() ?? '',
  };
  const serviceLinks = featuredServices
    .slice(0, MAX_FOOTER_SERVICES)
    .map((service) => ({ label: service.name, href: `/services/${service.slug}` }));
  const companyLinks = [
    { label: 'lawyers', href: '/lawyers' },
    { label: 'news', href: '/news' },
    { label: 'booking', href: '/booking' },
    { label: 'contact', href: '/contact' },
  ];

  return (
    <>
      <div>
        <div className="footer__col-title">{t('services')}</div>
        <div className="footer__links">
          {serviceLinks.map((link) => (
            <Link key={link.href} href={link.href} className="footer__link">
              {link.label}
            </Link>
          ))}
          <Link href="/services" className="footer__link">
            {t('allServices')}
          </Link>
        </div>
      </div>

      <div>
        <div className="footer__col-title">{t('company')}</div>
        <div className="footer__links">
          {companyLinks.map((link) => (
            <Link key={link.href} href={link.href} className="footer__link">
              {t(link.label)}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="footer__col-title">{t('contact')}</div>
        <div>
          {FOOTER_LINKS.contact.items.map((item, index) => (
            <div key={index} className="footer__contact-item">
              <item.icon className="footer__contact-icon" size={16} />
              <span>{contactValues[item.key as keyof typeof contactValues] || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function FooterBrand() {
  const t = useTranslations('footer');
  const { data: siteContent } = usePublicSiteContent();
  const socialLinks = {
    facebook: normalizeExternalUrl(siteContent?.socialLinks?.facebook) || 'https://facebook.com/vpluat',
    linkedin: normalizeExternalUrl(siteContent?.socialLinks?.linkedin) || 'https://linkedin.com/company/vpluat',
    youtube: normalizeExternalUrl(siteContent?.socialLinks?.youtube) || 'https://youtube.com/@vpluat',
    instagram: normalizeExternalUrl(siteContent?.socialLinks?.instagram) || 'https://instagram.com/vpluat',
  };
  const socials = [
    { label: 'Facebook', href: socialLinks.facebook, icon: FacebookIcon },
    { label: 'LinkedIn', href: socialLinks.linkedin, icon: LinkedinIcon },
    { label: 'YouTube', href: socialLinks.youtube, icon: YoutubeIcon },
    { label: 'Instagram', href: socialLinks.instagram, icon: InstagramIcon },
  ].filter((social) => social.href.trim());

  return (
    <div>
      <div className="footer__brand-logo">
        <div className="footer__brand-icon">VP</div>
        <span className="footer__brand-name">{t('brandName')}</span>
      </div>
      <p className="footer__brand-desc">
        {t('description')}
      </p>
      <div className="footer__socials">
        {socials.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="footer__social"
            aria-label={label}
          >
            <Icon size={18} />
          </a>
        ))}
      </div>
    </div>
  );
}
