import { NewsPage } from '@/features/news';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tin tức & Blog pháp lý',
  description:
    'Cập nhật tin tức pháp luật, nghị định mới, bài viết chuyên môn từ Công ty Luật TNHH ICRC.',
  alternates: { canonical: '/news' },
};

export default function Page() {
  return <NewsPage />;
}
