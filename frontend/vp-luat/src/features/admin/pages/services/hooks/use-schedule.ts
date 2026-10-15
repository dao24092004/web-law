'use client';

import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/lib/api/hooks';
import { lawyerScheduleApi, type TimeSlot, type SlotUpdate } from '@/lib/api/admin-booking';
import { ghiAudit, notifySuccess, notifyError } from '@/features/admin/lib';

export const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;
export const DAY_LABELS = [
  'Chủ nhật',
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
] as const;

export interface DaySchedule {
  isOff: boolean;
  slots: TimeSlot[];
}

const DEFAULT_SCHEDULE: Record<number, DaySchedule> = {
  0: { isOff: true, slots: [] },
  1: { isOff: false, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
  2: { isOff: false, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
  3: { isOff: false, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
  4: { isOff: false, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
  5: { isOff: false, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
  6: { isOff: true, slots: [] },
};

export function useLawyerSchedule(lawyerId: string | null | undefined) {
  const qc = useQueryClient();

  const queryResult = useApiQuery<
    Awaited<ReturnType<typeof lawyerScheduleApi.getSchedule>>
  >(
    ['lawyer-schedule', lawyerId],
    `/admin/lawyers/${lawyerId}/schedule`,
    undefined,
    { enabled: Boolean(lawyerId) },
  );

  const scheduleByDay = useMemo(() => {
    const map: Record<number, DaySchedule> = { ...DEFAULT_SCHEDULE };
    if (!lawyerId || !queryResult.data) return map;
    for (const s of queryResult.data) {
      if (s && typeof s.dayOfWeek === 'number') {
        map[s.dayOfWeek] = { isOff: s.isOff ?? true, slots: s.slots ?? [] };
      }
    }
    return map;
  }, [lawyerId, queryResult.data]);

  // Bound saveSchedule — closes over lawyerId so callers only pass updates
  const saveScheduleMutation = useApiMutation<unknown, { lawyerId: string; body: SlotUpdate[] }>(
    'PUT',
    (vars) => `/admin/lawyers/${vars.lawyerId}/schedule`,
    {
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: ['lawyer-schedule', vars.lawyerId] });
        ghiAudit({
          action: 'update',
          entity: 'lawyer_schedule',
          entityId: vars.lawyerId,
          entityLabel: 'lịch làm việc',
        });
        notifySuccess('Đã lưu lịch làm việc');
      },
      onError: (e) => {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể lưu lịch');
      },
    },
  );

  const saveSchedule = useCallback(
    (updates: Record<number, DaySchedule>): Promise<void> => {
      if (!lawyerId) return Promise.resolve();
      const slotUpdates: SlotUpdate[] = Object.entries(updates).map(([dayOfWeek, day]) => ({
        dayOfWeek: Number(dayOfWeek),
        isOff: day.isOff,
        slots: day.slots,
      }));
      return new Promise<void>((resolve, reject) => {
        saveScheduleMutation.mutate(
          { lawyerId, body: slotUpdates },
          {
            onSuccess: () => resolve(),
            onError: (e) => reject(e),
          },
        );
      });
    },
    [lawyerId, saveScheduleMutation],
  );

  return {
    scheduleByDay,
    saveSchedule,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
  };
}

export function useSaveSchedule() {
  const qc = useQueryClient();

  const mutation = useApiMutation<unknown, { lawyerId: string; body: SlotUpdate[] }>(
    'PUT',
    (vars) => `/admin/lawyers/${vars.lawyerId}/schedule`,
    {
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: ['lawyer-schedule', vars.lawyerId] });
        ghiAudit({
          action: 'update',
          entity: 'lawyer_schedule',
          entityId: vars.lawyerId,
          entityLabel: 'lịch làm việc',
        });
        notifySuccess('Đã lưu lịch làm việc');
      },
      onError: (e) => {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể lưu lịch');
      },
    },
  );

  return useCallback(
    (lawyerId: string, updates: SlotUpdate[]) =>
      mutation.mutate({ lawyerId, body: updates }),
    [mutation],
  );
}

export function useCreateScheduleOverride() {
  const qc = useQueryClient();

  const mutation = useApiMutation<
    Awaited<ReturnType<typeof lawyerScheduleApi.createOverride>>,
    { lawyerId: string; request: Parameters<typeof lawyerScheduleApi.createOverride>[1] }
  >(
    'POST',
    (vars) => `/admin/lawyers/${vars.lawyerId}/schedule/override`,
    {
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: ['lawyer-schedule', vars.lawyerId] });
        ghiAudit({
          action: 'create',
          entity: 'lawyer_schedule_override',
          entityId: vars.lawyerId,
          entityLabel: 'ghi đè lịch',
        });
        notifySuccess('Đã tạo ghi đè lịch');
      },
      onError: (e) => {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể tạo ghi đè');
      },
    },
  );

  return useCallback(
    (lawyerId: string, request: Parameters<typeof lawyerScheduleApi.createOverride>[1]) =>
      mutation.mutate({ lawyerId, request }),
    [mutation],
  );
}

export function useDeleteScheduleOverride() {
  const qc = useQueryClient();

  const mutation = useApiMutation<void, { lawyerId: string; date: string }>(
    'DELETE',
    (vars) =>
      `/admin/lawyers/${vars.lawyerId}/schedule/override?date=${encodeURIComponent(vars.date)}`,
    {
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: ['lawyer-schedule', vars.lawyerId] });
        ghiAudit({
          action: 'delete',
          entity: 'lawyer_schedule_override',
          entityId: vars.lawyerId,
          entityLabel: `ngày ${vars.date}`,
        });
        notifySuccess('Đã xóa ghi đè lịch');
      },
      onError: (e) => {
        notifyError('Lỗi', e instanceof Error ? e.message : 'Không thể xóa ghi đè');
      },
    },
  );

  return useCallback(
    (lawyerId: string, date: string) => mutation.mutate({ lawyerId, date }),
    [mutation],
  );
}
