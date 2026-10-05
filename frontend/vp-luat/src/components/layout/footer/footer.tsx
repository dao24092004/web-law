'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FooterBrand, FooterColumns } from './footer-columns';

export function Footer() {
  const pathname = usePathname();
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
            <Link href="/contact" aria-label="Liên hệ về chính sách bảo mật">Chính sách bảo mật</Link>
            <Link href="/contact" aria-label="Liên hệ về điều khoản sử dụng">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
