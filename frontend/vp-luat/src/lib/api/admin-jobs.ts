// lib/api/admin-jobs.ts

import { api } from './hooks';
import type { PageResponse } from './hooks';

export interface JobPosting {
  id: string;
  title: string;
  titleEn?: string;
  slug: string;
  excerpt: string;
  excerptEn?: string;
  content: string;
  contentEn?: string;
  category: string;
  employmentType: string;
  location: string;
  salary?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  applicationCount?: number;
  thumbnailUrl?: string;
  metaTitle?: string;
  metaDesc?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  cvUrl?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  status: 'NEW' | 'REVIEWED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  notes?: string;
  appliedAt: string;
  updatedAt: string;
}

export const jobsApi = {
  // Public
  listPublic: (page = 0, size = 20) =>
    api.get<PageResponse<JobPosting>>('/crm/jobs', { page, size }),

  getPublic: (id: string) =>
    api.get<JobPosting>('/crm/jobs/' + id),

  apply: (id: string, body: unknown) =>
    api.post<JobApplication>('/crm/jobs/' + id + '/apply', body),

  // Admin - Jobs
  list: (page = 0, size = 20, status?: string) =>
    api.get<PageResponse<JobPosting>>('/crm/jobs/all', { page, size, ...(status ? { status } : {}) }),

  get: (id: string) =>
    api.get<JobPosting>('/crm/jobs/' + id),

  create: (body: unknown) =>
    api.post<JobPosting>('/crm/jobs', body),

  update: (id: string, body: unknown) =>
    api.put<JobPosting>('/crm/jobs/' + id, body),

  publish: (id: string) =>
    api.patch<JobPosting>('/crm/jobs/' + id + '/publish', {}),

  close: (id: string) =>
    api.patch<JobPosting>('/crm/jobs/' + id + '/close', {}),

  delete: (id: string) =>
    api.del<void>('/crm/jobs/' + id),

  // Admin - Applications
  listApplications: (page = 0, size = 20, jobId?: string, status?: string) =>
    api.get<PageResponse<JobApplication>>('/crm/jobs/applications', {
      page, size, ...(jobId ? { jobId } : {}), ...(status ? { status } : {})
    }),

  getApplication: (id: string) =>
    api.get<JobApplication>('/crm/jobs/applications/' + id),

  updateApplicationStatus: (id: string, status: string) =>
    api.patch<JobApplication>('/crm/jobs/applications/' + id + '/status', { status }),
};
