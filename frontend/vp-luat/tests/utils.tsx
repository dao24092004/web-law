import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import viMessages from '../src/i18n/messages/vi.json';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface RenderOptions {
  session?: { user?: { id: string; name: string; email: string; role: string } };
  locale?: string;
  messages?: Record<string, unknown>;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions = {}
) {
  const queryClient = createTestQueryClient();
  const locale = options.locale ?? 'vi';
  const messages = options.messages ?? (viMessages as unknown as Record<string, unknown>);

  return render(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}

export * from '@testing-library/react';
export * from '@testing-library/jest-dom';
