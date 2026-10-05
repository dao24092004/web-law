import { ServicesPage } from '@/features/services';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dịch vụ pháp lý',
  description:
    'Tổng hợp các dịch vụ pháp lý chuyên nghiệp của Công ty Luật TNHH ICRC: thành lập doanh nghiệp, tư vấn hợp đồng, ly hôn, đất đai, sở hữu trí tuệ.',
  alternates: { canonical: '/services' },
};

export default function Page() {
  return <ServicesPage />;
}

export function generateStaticParams() {
  return [];
}
