// lib/api/admin-landing-pages.ts
// Landing Pages API

import { api } from './hooks';

export interface LandingPageBlock {
  id: string;
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'faq' | 'stats' | 'text' | 'image' | 'video' | 'form';
  props: Record<string, unknown>;
  order: number;
}

export interface LandingPage {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  status: 'draft' | 'published';
  blocks: LandingPageBlock[];
  metaTitle?: string;
  metaDesc?: string;
  thumbnailUrl?: string;
  visits?: number;
  conversions?: number;
  conversionRate?: number;
  lastViewedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageStats {
  pageId: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  lastViewedAt: string | null;
}

export const landingPageApi = {
  list: () => api.get<LandingPage[]>('/admin/landing-pages'),

  get: (id: string) => api.get<LandingPage>(`/admin/landing-pages/${id}`),

  create: (body: Partial<LandingPage>) => api.post<LandingPage>('/admin/landing-pages', body),

  update: (id: string, body: Partial<LandingPage>) =>
    api.put<LandingPage>(`/admin/landing-pages/${id}`, body),

  patch: (id: string, body: Partial<LandingPage>) =>
    api.patch<LandingPage>(`/admin/landing-pages/${id}`, body),

  delete: (id: string) => api.del<void>(`/admin/landing-pages/${id}`),

  publish: (id: string) =>
    api.patch<LandingPage>(`/admin/landing-pages/${id}`, { status: 'published' }),

  unpublish: (id: string) =>
    api.patch<LandingPage>(`/admin/landing-pages/${id}`, { status: 'draft' }),

  stats: (id: string) => api.get<LandingPageStats>(`/admin/landing-pages/${id}/stats`),
};
