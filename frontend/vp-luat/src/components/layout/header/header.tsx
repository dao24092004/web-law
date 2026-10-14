'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { NavLinks } from './nav-links';
import { LanguageSwitcher } from './language-switcher';
import { MobileMenu } from './mobile-menu';
import { BrandLogo } from '@/components/layout/brand-logo';

const HIDDEN_PREFIXES = ['/admin', '/staff', '/login', '/landing-builder'];
const HIDDEN_EXACT: string[] = [];

function shouldHide(pathname: string | null) {
  if (!pathname) return false;
  if (HIDDEN_EXACT.includes(pathname)) return true;
  return HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { mobileMenuOpen, toggleMobileMenu } = useUIStore();
  const t = useTranslations('header');
  const pathname = usePathname();
  const hidden = shouldHide(pathname);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (hidden) return null;

  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar__inner">
          {/* Logo */}
          <BrandLogo variant="header" subline={t('brandSubline')} />

          {/* Desktop Menu */}
          <NavLinks layout="desktop" />

          {/* Actions */}
          <div className="navbar__actions">
            <LanguageSwitcher layout="desktop" />
            <Link href="/booking" className="navbar__cta">
              {t('bookConsultation')}
            </Link>
            <button
              className={`navbar__hamburger ${mobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMobileMenu}
              aria-label={t('toggleMenu')}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu />
    </>
  );
}
