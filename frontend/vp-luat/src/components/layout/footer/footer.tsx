'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FooterBrand, FooterColumns } from './footer-columns';
import { usePublicSiteContent } from '@/features/home/hooks/use-site-content';

function LegalLink({ href, label }: { href: string; label: string }) {
  if (/^https?:\/\//i.test(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>;
  }
  return <Link href={href}>{label}</Link>;
}

export function Footer() {
  const pathname = usePathname();
  const t = useTranslations('footer');
  const { data: siteContent } = usePublicSiteContent();
  const legalLinks = siteContent?.legalLinks ?? { privacyPolicy: '', termsOfUse: '' };
  const hidden =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/staff') ||
    pathname === '/booking' ||
    false;
  if (hidden) return null;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <FooterBrand />
          <FooterColumns />
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} Công ty Luật TNHH ICRC. Giữ bản quyền.
          </p>
          <div className="footer__legal">
            {legalLinks.privacyPolicy.trim() && (
              <LegalLink href={legalLinks.privacyPolicy.trim()} label={t('privacy')} />
            )}
            {legalLinks.termsOfUse.trim() && (
              <LegalLink href={legalLinks.termsOfUse.trim()} label={t('terms')} />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
