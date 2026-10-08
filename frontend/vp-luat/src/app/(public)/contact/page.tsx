import { ContactPage } from '@/features/contact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liên hệ tư vấn pháp lý',
  description:
    'Liên hệ ICRC Law - Công ty Luật TNHH ICRC để được tư vấn pháp lý miễn phí. Hotline 0969 967 389, hệ thống văn phòng tại Hưng Yên.',
  alternates: { canonical: '/contact' },
};

export default function Page() {
  return <ContactPage />;
}
