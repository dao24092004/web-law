// lib/api/admin-lawyers.ts
// Lawyer Schedule API

import { api } from './hooks';

export interface LawyerScheduleSlot {
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface LawyerScheduleDTO {
  lawyerId: string;
  lawyerName: string;
  slots: LawyerScheduleSlot[];
}

export interface LawyerScheduleOverrideDTO {
  id: string;
  lawyerId: string;
  overrideDate: string;
  type: 'off' | 'custom';
  slots?: LawyerScheduleSlot[];
  reason?: string;
}

export interface LawyerScheduleResponse {
  regular: LawyerScheduleDTO[];
  overrides: Record<string, LawyerScheduleOverrideDTO[]>;
}

export const lawyerScheduleApi = {
  // Lay lich lam viec cua 1 luat su
  getSchedule: (lawyerId: string) =>
    api.get<LawyerScheduleDTO[]>(`/admin/lawyers/${lawyerId}/schedule`),

  // Lay lich lam viec cua tat ca luat su trong khoang ngay
  getAllSchedules: (from: string, to: string) =>
    api.get<Record<string, LawyerScheduleResponse>>(`/admin/lawyers/schedules?from=${from}&to=${to}`),

  // Luu lich lam viec
  saveSchedule: (lawyerId: string, slots: LawyerScheduleSlot[]) =>
    api.put(`/admin/lawyers/${lawyerId}/schedule`, slots),

  // Tao override (nghi, gio dac biet)
  createOverride: (
    lawyerId: string,
    overrideDate: string,
    type: 'off' | 'custom',
    slots?: LawyerScheduleSlot[],
    reason?: string,
  ) =>
    api.post(`/admin/lawyers/${lawyerId}/schedule/override`, {
      overrideDate,
      type,
      slots,
      reason,
    }),

  // Xoa override
  deleteOverride: async (lawyerId: string, date: string): Promise<void> => {
    await api.del(`/admin/lawyers/${lawyerId}/schedule/override?date=${date}`);
  },
};
