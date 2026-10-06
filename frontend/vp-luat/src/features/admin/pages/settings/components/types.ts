export interface GeneralSettings {
  siteName: string;
  hotline: string;
  email: string;
  address: string;
  timezone: string;
  language: 'vi' | 'en';
  workingHours: {
    start: string;
    end: string;
    daysOff: string[];
  };
}

export interface BookingSettings {
  slotDuration: number;
  bookingLeadTime: number;
  maxBookingsPerDay: number;
  allowOnline: boolean;
  allowPhone: boolean;
  autoConfirm: boolean;
}

export interface SmtpSettings {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  useTLS: boolean;
}

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: 'Inter' | 'Roboto' | 'Poppins' | 'Be Vietnam Pro' | 'Manrope';
  logoUrl: string;
  faviconUrl: string;
}

export interface IntegrationsSettings {
  sentryDsn: string;
  posthogKey: string;
  googleAnalyticsId: string;
  chatbotWebhookUrl: string;
}

export const DEFAULT_GENERAL: GeneralSettings = {
  siteName: 'ICRC Law - Công ty Luật TNHH ICRC',
  hotline: '0969 967 389 - 0975 967 364',
  email: 'contact@icrclaw.com',
  address: '123 Nguyễn Trãi, Quận 1, TP.HCM',
  timezone: 'Asia/Ho_Chi_Minh',
  language: 'vi',
  workingHours: {
    start: '08:00',
    end: '18:00',
    daysOff: ['CN'],
  },
};

export const DEFAULT_BOOKING: BookingSettings = {
  slotDuration: 60,
  bookingLeadTime: 24,
  maxBookingsPerDay: 20,
  allowOnline: true,
  allowPhone: true,
  autoConfirm: false,
};

export const DEFAULT_SMTP: SmtpSettings = {
  fromName: 'ICRC Law',
  fromEmail: 'noreply@icrclaw.com',
  replyTo: 'contact@icrclaw.com',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: 'noreply@icrclaw.com',
  smtpPassword: '',
  useTLS: true,
};

export const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#1B4D8C',
  accentColor: '#F59E0B',
  fontFamily: 'Inter',
  logoUrl: '',
  faviconUrl: '',
};

export const DEFAULT_INTEGRATIONS: IntegrationsSettings = {
  sentryDsn: '',
  posthogKey: '',
  googleAnalyticsId: '',
  chatbotWebhookUrl: '',
};