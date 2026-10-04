// lib/api/admin-email.ts
// Email Test API

import { api } from './hooks';

export interface EmailStatus {
  enabled: boolean;
  host: string;
  port: number;
  username: string | null;
  fromAddress: string;
  fromName: string;
}

export interface TestEmailResponse {
  message?: string;
  error?: string;
}

export const emailApi = {
  getStatus: () =>
    api.get<EmailStatus>('/admin/email/status'),

  sendTestEmail: (to: string) =>
    api.post<TestEmailResponse>('/admin/email/test', { to }),

  sendAppointmentConfirmation: (to: string) =>
    api.post<TestEmailResponse>('/admin/email/test/appointment-confirmation', { to }),

  sendAppointmentReminder: (to: string) =>
    api.post<TestEmailResponse>('/admin/email/test/appointment-reminder', { to }),
};
