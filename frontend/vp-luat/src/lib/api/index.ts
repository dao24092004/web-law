// Re-exports for the API layer.
export { apiClient } from './client';
export { serverFetch } from './server-client';
export { queryClient } from './query-client';
export { useApiQuery, useApiMutation, api } from './hooks';
export type { ApiEnvelope, PageResponse } from './hooks';

export { adminDashboardApi } from './admin-dashboard';
export type {
  DashboardStats,
  TimeSeriesPoint,
  DistributionSlice,
  LeadFunnel,
  ActivityLog,
  AppointmentSummary,
} from './admin-dashboard';

export { leadApi, reviewApi, serviceApi, lawyerApi, chatbotApi, newsletterApi } from './admin-crm';
export type {
  Lead,
  Review,
  LeadTimelineEntry,
  Service,
  Lawyer,
  ChatbotSession,
  Subscriber,
  Campaign,
  Booking,
} from './admin-crm';

export { bookingApi, lawyerScheduleApi } from './admin-booking';
export type {
  Appointment,
  BookingStats,
  LawyerSchedule,
} from './admin-booking';

export { postApi, documentApi, auditLogApi, reportsApi, notificationApi, leadPipelineApi, categoryApi, tagApi } from './admin-content';
export { caseStudyApi } from './admin-case-study';
export type { CaseStudy, CaseStudyRequest } from './admin-case-study';
export type {
  Post,
  Notification,
  LeadPipelineStats,
  Category,
  CategoryCreateRequest,
  Tag,
} from './admin-content';

export { userApi, roleApi, settingsApi, meApi, auditApi } from './admin-core';
export type {
  AdminUser,
  Role,
  SystemSettings,
  AuditLogEntry,
} from './admin-core';

export { landingPageApi } from './admin-landing-pages';
export type { LandingPage, LandingPageBlock, LandingPageStats } from './admin-landing-pages';

export { jobsApi } from './admin-jobs';
export type { JobPosting, JobApplication } from './admin-jobs';

export { rolesApi, PERMISSION_GROUPS } from './admin-roles';
export type { Role as RoleWithPermissions, PermissionGroup } from './admin-roles';

export { emailApi } from './admin-email';
export type { EmailStatus, TestEmailResponse } from './admin-email';

export { leadDetailApi } from './crm-leads';
export type { LeadNote as LeadNoteDetail, ActivityLog as ActivityLogDetail, AppointmentForLead } from './crm-leads';

export { fileApi } from './admin-files';
export type { FileUploadResult, FileItem } from './admin-files';

export { lawyerScheduleApi as adminLawyerScheduleApi } from './admin-lawyers';
export type { LawyerScheduleSlot, LawyerScheduleDTO, LawyerScheduleOverrideDTO, LawyerScheduleResponse } from './admin-lawyers';

export { siteContentApi } from './admin-site-content';
export type { SiteContent } from './admin-site-content';
