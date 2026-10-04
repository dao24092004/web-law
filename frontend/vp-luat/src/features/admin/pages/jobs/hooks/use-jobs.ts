'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/lib/api/hooks';
import { jobsApi, type JobPosting, type JobApplication } from '@/lib/api/admin-jobs';
import { ghiAudit, notifySuccess, notifyError } from '@/features/admin/lib';

export function useJobs(page = 0, size = 20, status?: string) {
  const { data, error, isLoading, refetch } = useApiQuery<{ content: JobPosting[]; totalElements: number; totalPages: number }>(
    ['admin', 'jobs', page, size, status],
    '/crm/jobs/all',
    { page, size, ...(status ? { status } : {}) },
    { retry: false },
  );
  return {
    data: data ?? { content: [], totalElements: 0, totalPages: 0 },
    error,
    isLoading,
    refetch,
  };
}

export function useJobApplications(page = 0, size = 20, jobId?: string, appStatus?: string) {
  const { data, error, isLoading, refetch } = useApiQuery<{ content: JobApplication[]; totalElements: number; totalPages: number }>(
    ['admin', 'job-applications', page, size, jobId, appStatus],
    '/crm/jobs/applications',
    { page, size, ...(jobId ? { jobId } : {}), ...(appStatus ? { status: appStatus } : {}) },
    { retry: false },
  );
  return {
    data: data ?? { content: [], totalElements: 0, totalPages: 0 },
    error,
    isLoading,
    refetch,
  };
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useCallback(
    async (job: Partial<JobPosting>): Promise<string | null> => {
      try {
        const created = await jobsApi.create(job);
        qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
        ghiAudit({ action: 'create', entity: 'job_posting', entityId: created.id, entityLabel: created.title });
        notifySuccess('Da tao tin tuyen dung');
        return created.id;
      } catch (err) {
        notifyError('Loi', (err as Error).message);
        return null;
      }
    },
    [qc],
  );
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useCallback(
    async (id: string, job: Partial<JobPosting>) => {
      try {
        const updated = await jobsApi.update(id, job);
        qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
        ghiAudit({ action: 'update', entity: 'job_posting', entityId: id, entityLabel: updated.title });
        notifySuccess('Da cap nhat tin tuyen dung');
        return true;
      } catch (err) {
        notifyError('Loi', (err as Error).message);
        return false;
      }
    },
    [qc],
  );
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useCallback(
    async (id: string, title?: string) => {
      try {
        await jobsApi.delete(id);
        qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
        ghiAudit({ action: 'delete', entity: 'job_posting', entityId: id, entityLabel: title ?? id });
        notifySuccess('Da xoa tin tuyen dung');
        return true;
      } catch (err) {
        notifyError('Loi', (err as Error).message);
        return false;
      }
    },
    [qc],
  );
}

export function usePublishJob() {
  const qc = useQueryClient();
  return useCallback(
    async (id: string, publish: boolean) => {
      try {
        const updated = publish ? await jobsApi.publish(id) : await jobsApi.close(id);
        qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
        ghiAudit({ action: publish ? 'publish' : 'close', entity: 'job_posting', entityId: id, entityLabel: updated.title });
        notifySuccess(publish ? 'Da xuat ban tin tuyen dung' : 'Da dong tin tuyen dung');
        return true;
      } catch (err) {
        notifyError('Loi', (err as Error).message);
        return false;
      }
    },
    [qc],
  );
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useCallback(
    async (id: string, status: string) => {
      try {
        await jobsApi.updateApplicationStatus(id, status);
        qc.invalidateQueries({ queryKey: ['admin', 'job-applications'] });
        ghiAudit({ action: 'update', entity: 'job_application', entityId: id, entityLabel: status });
        notifySuccess('Da cap nhat trang thai');
        return true;
      } catch (err) {
        notifyError('Loi', (err as Error).message);
        return false;
      }
    },
    [qc],
  );
}

export const APPLICATION_STATUS_OPTIONS = [
  { value: 'NEW', label: 'Moi', color: 'var(--blue)' },
  { value: 'REVIEWED', label: 'Da xem', color: 'var(--purple)' },
  { value: 'INTERVIEW', label: 'Phong van', color: 'var(--warning)' },
  { value: 'OFFER', label: 'Trao offer', color: 'var(--success)' },
  { value: 'REJECTED', label: 'Tu choi', color: 'var(--danger)' },
  { value: 'WITHDRAWN', label: 'Rut', color: 'var(--gray-400)' },
];

export const JOB_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Nhap', color: 'var(--gray-400)' },
  { value: 'PUBLISHED', label: 'Xuat ban', color: 'var(--success)' },
  { value: 'CLOSED', label: 'Dong', color: 'var(--warning)' },
];
