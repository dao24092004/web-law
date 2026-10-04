// lib/api/crm-leads.ts
// CRM Leads API

import { api } from './hooks';

export interface LeadNote {
  id: string;
  note: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
}

export interface ActivityLog {
  id: string;
  actorName: string;
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  createdAt: string;
}

export interface AppointmentForLead {
  id: string;
  serviceName: string;
  lawyerName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  notes?: string;
}

export interface LeadTimeline {
  id: string;
  actorName: string;
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  createdAt: string;
}

export const leadDetailApi = {
  // Lấy timeline hoạt động
  getTimeline: (leadId: string) =>
    api.get<ActivityLog[]>(`/crm/leads/${leadId}/timeline`),

  // Lấy danh sách notes
  getNotes: (leadId: string) =>
    api.get<LeadNote[]>(`/crm/leads/${leadId}/notes`),

  // Thêm note mới
  addNote: (leadId: string, note: string, actorId?: string) =>
    api.post(`/crm/leads/${leadId}/notes`, { note, actorId }),

  // Lấy bookings của lead
  getBookings: (leadId: string) =>
    api.get<AppointmentForLead[]>(`/crm/leads/${leadId}/bookings`),
};
