// lib/api/admin-site-content.ts
// Public Site Content API — must mirror the backend PUBLIC_SITE settings shape
// produced by InitialSeedService / PublicSiteContentService on the backend:
// { contact, socialLinks, offices, heroStats, processSteps, faqs }

import { api } from './hooks';

export interface SiteContactInfo {
  hotline: string;
  email: string;
  address: string;
  workingHours: string;
  zaloUrl?: string;
}

export interface SiteSocialLinks {
  facebook: string;
  linkedin: string;
  youtube: string;
  instagram: string;
}

export interface SiteOffice {
  city: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  isMain?: boolean;
}

export interface SiteHeroStats {
  successfulCases: number;
  successRate: number;
  yearsExperience: number;
  clients: number;
}

export interface SiteProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface SiteFaq {
  id: string;
  question: string;
  answer: string;
}

export interface SiteContent {
  contact: SiteContactInfo;
  socialLinks: SiteSocialLinks;
  legalLinks: { privacyPolicy: string; termsOfUse: string };
  offices: SiteOffice[];
  heroStats: SiteHeroStats;
  processSteps: SiteProcessStep[];
  faqs: SiteFaq[];
}

export const EMPTY_SITE_CONTENT: SiteContent = {
  contact: { hotline: '', email: '', address: '', workingHours: '', zaloUrl: '' },
  socialLinks: { facebook: '', linkedin: '', youtube: '', instagram: '' },
  legalLinks: { privacyPolicy: '', termsOfUse: '' },
  offices: [],
  heroStats: { successfulCases: 0, successRate: 0, yearsExperience: 0, clients: 0 },
  processSteps: [],
  faqs: [],
};

export const siteContentApi = {
  /** Public read, locale-specific (no auth required). */
  get: (locale: string = 'vi') =>
    api.get<SiteContent>(`/public/site-content?locale=${locale}`),

  /**
   * Admin read of the raw namespace (contains both `vi` and `en` keys).
   * Mirrors `useSetting`/`settingsApi` conventions used elsewhere in admin.
   */
  getAdmin: () =>
    api.get<Record<string, SiteContent>>('/admin/settings/PUBLIC_SITE'),

  /**
   * Admin update — PUT merges top-level keys into the stored JSON, so the
   * payload must include the full locale object (e.g. `{ vi: {...} }`) to
   * avoid losing sibling fields within that locale.
   */
  updateAdmin: (body: Record<string, Partial<SiteContent>>) =>
    api.put<Record<string, SiteContent>>('/admin/settings/PUBLIC_SITE', body),

  empty: (): SiteContent => EMPTY_SITE_CONTENT,
};
