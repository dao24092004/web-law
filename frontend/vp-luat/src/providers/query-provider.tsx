'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
  timeZone?: string;
}

export function Providers({ children, locale, messages, timeZone }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="top-right"
            expand={false}
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: 'var(--font-body)',
              },
            }}
          />
        </QueryClientProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
