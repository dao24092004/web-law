import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import { getLocale, getMessages, getTimeZone } from 'next-intl/server';
import { Providers } from '@/providers';
import { cn } from '@/lib/utils';
import '@/app/globals.css';

const headingFont = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | VP Luật Hùng & Cộng sự',
    default: 'VP Luật Hùng & Cộng sự - Tư vấn pháp lý chuyên nghiệp',
  },
  description:
    'Văn phòng Luật Hùng & Cộng sự - Dịch vụ tư vấn pháp lý chuyên nghiệp cho cá nhân và doanh nghiệp tại Việt Nam.',
  keywords: ['luật sư', 'tư vấn pháp lý', 'văn phòng luật', 'luật doanh nghiệp', 'luật dân sự'],
  authors: [{ name: 'VP Luật Hùng & Cộng sự' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = await getTimeZone();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn(headingFont.variable, bodyFont.variable, 'font-body antialiased')}>
        <Providers locale={locale} messages={messages} timeZone={timeZone}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
