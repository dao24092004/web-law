import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/types/api';

export interface PublicSiteContent {
  contact: { hotline: string; email: string; address: string; workingHours: string; zaloUrl: string; mapUrl?: string };
  socialLinks: { facebook: string; linkedin: string; youtube: string; instagram: string };
  legalLinks: { privacyPolicy: string; termsOfUse: string };
  offices: Array<{ city: string; address: string; phone: string; email: string; workingHours: string; isMain?: boolean }>;
  heroStats: { successfulCases: number; successRate: number; yearsExperience: number; clients: number };
  processSteps: Array<{ step: number; title: string; description: string }>;
  faqs: Array<{ id: string; question: string; answer: string }>;
}

export async function getPublicSiteContent(locale: string): Promise<PublicSiteContent> {
  const { data } = await apiClient.get<ApiResponse<PublicSiteContent>>('/public/site-content', { params: { locale } });
  return data.success && data.data ? data.data : {
    contact: { hotline: '', email: '', address: '', workingHours: '', zaloUrl: '' },
    socialLinks: { facebook: '', linkedin: '', youtube: '', instagram: '' },
    legalLinks: { privacyPolicy: '', termsOfUse: '' },
    offices: [],
    heroStats: { successfulCases: 0, successRate: 0, yearsExperience: 0, clients: 0 },
    processSteps: [],
    faqs: [],
  };
}
