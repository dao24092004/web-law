import { LawyersPage } from '@/features/lawyers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đội ngũ luật sư',
  description:
    'Đội ngũ luật sư giàu kinh nghiệm của Công ty Luật TNHH ICRC — chuyên gia tư vấn pháp lý cho cá nhân và doanh nghiệp.',
  alternates: { canonical: '/lawyers' },
};

export default function Page() {
  return <LawyersPage />;
}
