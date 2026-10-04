'use client';

import { useState } from 'react';
import { AdminPageHeader, FilterTabs } from '@/features/admin/shared';
import { useCan } from '@/features/admin/lib';
import { useSetting, useUpdateSetting } from './hooks/use-settings';
import { GeneralSettingsForm } from './components/general-settings';
import { BookingSettingsForm } from './components/booking-settings';
import { SmtpSettingsForm } from './components/smtp-settings';
import { ThemeSettingsForm } from './components/theme-settings';
import { IntegrationsSettingsForm } from './components/integrations-settings';
import { EmailTestPanel } from './components/email-test-panel';
import {
  DEFAULT_GENERAL,
  DEFAULT_BOOKING,
  DEFAULT_SMTP,
  DEFAULT_THEME,
  DEFAULT_INTEGRATIONS,
  type GeneralSettings,
  type BookingSettings,
  type SmtpSettings,
  type ThemeSettings,
  type IntegrationsSettings,
} from './components/types';
import type {
  GeneralSettingsValues,
  BookingSettingsValues,
  SmtpSettingsValues,
  ThemeSettingsValues,
  IntegrationsSettingsValues,
} from '@/features/admin/schema';

type Tab = 'general' | 'booking' | 'smtp' | 'email-test' | 'theme' | 'integrations';

export default function SettingsPage() {
  const canRead = useCan('settings.read');
  const general = useSetting<GeneralSettings>('general', DEFAULT_GENERAL);
  const booking = useSetting<BookingSettings>('booking', DEFAULT_BOOKING);
  const smtp = useSetting<SmtpSettings>('smtp', DEFAULT_SMTP);
  const theme = useSetting<ThemeSettings>('theme', DEFAULT_THEME);
  const integrations = useSetting<IntegrationsSettings>('integrations', DEFAULT_INTEGRATIONS);
  const updateGeneral = useUpdateSetting<GeneralSettings>('general');
  const updateBooking = useUpdateSetting<BookingSettings>('booking');
  const updateSmtp = useUpdateSetting<SmtpSettings>('smtp');
  const updateTheme = useUpdateSetting<ThemeSettings>('theme');
  const updateIntegrations = useUpdateSetting<IntegrationsSettings>('integrations');
  const [tab, setTab] = useState<Tab>('general');

  if (!canRead) {
    return (
      <div className="admin-view">
        <AdminPageHeader title="Cai dat he thong" />
        <div className="admin-card" style={{ padding: 32, textAlign: 'center', color: 'var(--gray-500)' }}>
          Ban khong co quyen xem cai dat.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-view">
      <AdminPageHeader
        title="Cai dat he thong"
        subtitle="Cau hinh cac thong so chung, booking, email, giao dien, tich hop"
      />
      <FilterTabs
        tabs={[
          { value: 'general', label: 'Chung' },
          { value: 'booking', label: 'Booking' },
          { value: 'smtp', label: 'SMTP' },
          { value: 'email-test', label: 'Test Email' },
          { value: 'theme', label: 'Theme' },
          { value: 'integrations', label: 'Tich hop' },
        ]}
        activeValue={tab}
        onChange={(value) => setTab(value as Tab)}
      />
      <div style={{ height: 12 }} />
      {tab === 'general' && <GeneralSettingsForm value={general.value} loaded={general.loaded} onSubmit={(value: GeneralSettingsValues) => updateGeneral(value as GeneralSettings, 'Cai dat chung')} isSubmitting={false} />}
      {tab === 'booking' && <BookingSettingsForm value={booking.value} loaded={booking.loaded} onSubmit={(value: BookingSettingsValues) => updateBooking(value as BookingSettings, 'Cai dat booking')} isSubmitting={false} />}
      {tab === 'smtp' && <SmtpSettingsForm value={smtp.value} loaded={smtp.loaded} onSubmit={(value: SmtpSettingsValues) => updateSmtp(value as SmtpSettings, 'Cai dat SMTP')} isSubmitting={false} />}
      {tab === 'email-test' && <EmailTestPanel />}
      {tab === 'theme' && <ThemeSettingsForm value={theme.value} loaded={theme.loaded} onSubmit={(value: ThemeSettingsValues) => updateTheme(value as ThemeSettings, 'Cai dat theme')} isSubmitting={false} />}
      {tab === 'integrations' && <IntegrationsSettingsForm value={integrations.value} loaded={integrations.loaded} onSubmit={(value: IntegrationsSettingsValues) => updateIntegrations(value as IntegrationsSettings, 'Tich hop')} isSubmitting={false} />}
    </div>
  );
}
