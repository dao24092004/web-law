// lib/api/admin-site-content.ts
// Public Site Content API

import { api } from './hooks';

export interface SiteContent {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    backgroundImage?: string;
  };
  about: {
    title: string;
    description: string;
    mission: string;
    vision: string;
    yearsExperience: number;
  };
  contact: {
    address: string;
    phone: string;
    email: string;
    workingHours: string;
    mapEmbed?: string;
  };
  social: {
    facebook?: string;
    youtube?: string;
    zalo?: string;
    linkedin?: string;
  };
}

export const siteContentApi = {
  get: (locale: string = 'vi') =>
    api.get<SiteContent>(`/public/site-content?locale=${locale}`),
};
