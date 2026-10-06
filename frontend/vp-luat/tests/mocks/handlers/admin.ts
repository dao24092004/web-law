import { http, HttpResponse } from 'msw';
import type { DashboardStats, Lead, Booking, BlogPost, Review, ChatbotSession } from '@/features/admin/types';

const BASE = 'http://localhost:8080';

export const adminHandlers = [
  // Dashboard
  http.get(`${BASE}/api/admin/dashboard/stats`, () => {
    return HttpResponse.json<DashboardStats>({
      appointments_today: 24,
      appointments_change: 12,
      leads_week: 156,
      leads_change: 8,
      conversion_rate: 32,
      conversion_change: 5,
      chatbot_conversations: 892,
      chatbot_change: -3,
    });
  }),

  // Leads / CRM
  http.get(`${BASE}/api/admin/leads`, () => {
    return HttpResponse.json({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  }),
  http.get(`${BASE}/api/admin/leads/:id`, () => HttpResponse.json({})),
  http.post(`${BASE}/api/admin/leads`, () => HttpResponse.json({}, { status: 201 })),
  http.put(`${BASE}/api/admin/leads/:id`, () => HttpResponse.json({})),
  http.delete(`${BASE}/api/admin/leads/:id`, () => HttpResponse.json(null, { status: 204 })),

  // Bookings
  http.get(`${BASE}/api/admin/bookings`, () => {
    return HttpResponse.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  }),
  http.patch(`${BASE}/api/admin/bookings/:id/status`, () => HttpResponse.json({})),

  // Blog posts
  http.get(`${BASE}/api/admin/posts`, () => {
    return HttpResponse.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  }),
  http.post(`${BASE}/api/admin/posts`, () => HttpResponse.json({}, { status: 201 })),
  http.put(`${BASE}/api/admin/posts/:id`, () => HttpResponse.json({})),
  http.delete(`${BASE}/api/admin/posts/:id`, () => HttpResponse.json(null, { status: 204 })),

  // Services
  http.get(`${BASE}/api/admin/services`, () => HttpResponse.json([])),
  http.post(`${BASE}/api/admin/services`, () => HttpResponse.json({}, { status: 201 })),
  http.put(`${BASE}/api/admin/services/:id`, () => HttpResponse.json({})),
  http.delete(`${BASE}/api/admin/services/:id`, () => HttpResponse.json(null, { status: 204 })),

  // Lawyers
  http.get(`${BASE}/api/admin/lawyers`, () => HttpResponse.json([])),
  http.post(`${BASE}/api/admin/lawyers`, () => HttpResponse.json({}, { status: 201 })),
  http.put(`${BASE}/api/admin/lawyers/:id`, () => HttpResponse.json({})),
  http.delete(`${BASE}/api/admin/lawyers/:id`, () => HttpResponse.json(null, { status: 204 })),

  // Reviews
  http.get(`${BASE}/api/admin/reviews`, () => {
    return HttpResponse.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  }),
  http.patch(`${BASE}/api/admin/reviews/:id/approve`, () => HttpResponse.json({})),
  http.patch(`${BASE}/api/admin/reviews/:id/reject`, () => HttpResponse.json({})),
  http.post(`${BASE}/api/admin/reviews/:id/reply`, () => HttpResponse.json({})),

  // Chatbot
  http.get(`${BASE}/api/admin/chatbot/sessions`, () => {
    return HttpResponse.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  }),
  http.get(`${BASE}/api/admin/chatbot/sessions/:sessionId`, () => HttpResponse.json({})),

  // Newsletter
  http.get(`${BASE}/api/admin/newsletter/subscribers`, () => {
    return HttpResponse.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  }),
  http.get(`${BASE}/api/admin/newsletter/campaigns`, () => {
    return HttpResponse.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  }),

  // Users
  http.get(`${BASE}/api/admin/users`, () => {
    return HttpResponse.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  }),
  http.post(`${BASE}/api/admin/users`, () => HttpResponse.json({}, { status: 201 })),
  http.put(`${BASE}/api/admin/users/:id`, () => HttpResponse.json({})),
  http.delete(`${BASE}/api/admin/users/:id`, () => HttpResponse.json(null, { status: 204 })),

  // Settings
  http.get(`${BASE}/api/admin/settings`, () =>
    HttpResponse.json({
      siteName: 'ICRC Law - Công ty Luật TNHH ICRC',
      hotline: '1900 1234',
      email: 'contact@icrclaw.com',
      address: '123 Nguyễn Trãi, Quận 1, TP.HCM',
      workingHours: { start: '08:00', end: '18:00', daysOff: [] },
      slotDuration: 60,
      bookingLeadTime: 24,
      currency: 'VND',
    }),
  ),
  http.put(`${BASE}/api/admin/settings`, () => HttpResponse.json({})),
];
