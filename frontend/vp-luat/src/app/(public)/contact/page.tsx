import { ContactPage } from '@/features/contact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liên hệ tư vấn pháp lý',
  description:
    'Liên hệ ICRC Law - Công ty Luật TNHH ICRC để được tư vấn pháp lý miễn phí. Hotline 0969967389, văn phòng tại Đường 381, Xã Nguyễn Văn Linh, Tỉnh Hưng Yên.',
  alternates: { canonical: '/contact' },
};

export default function Page() {
  return <ContactPage />;
}
