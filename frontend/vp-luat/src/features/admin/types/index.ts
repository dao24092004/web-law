// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  appointments_today: number;
  appointments_change: number;
  leads_week: number;
  leads_change: number;
  conversion_rate: number;
  conversion_change: number;
  chatbot_conversations: number;
  chatbot_change: number;
}

export interface ChartDataPoint {
  date: string;
  visits: number;
  leads: number;
}

export interface DonutSegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

// ─── CRM / Leads ────────────────────────────────────────────────────────────

export type LeadStatus = 'new' | 'contacted' | 'progress' | 'converted' | 'lost';
export type LeadSource = 'facebook' | 'google_ads' | 'organic' | 'chatbot' | 'referral' | 'other';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  source: LeadSource;
  status: LeadStatus;
  assignedTo: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadKanbanCard {
  id: string;
  name: string;
  service: string;
  time: string;
  priority: 'low' | 'medium' | 'high';
  status: LeadStatus;
}

// ─── Lead timeline / notes (Phase 7) ───────────────────────────────────────

export interface LeadTimelineEntry {
  id: string;
  leadId: string;
  type: 'note' | 'call' | 'email' | 'status_change' | 'booking_created' | 'assignment_change';
  content: string;
  authorId: string;
  authorName: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Bookings ─────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type BookingMethod = 'office' | 'online' | 'phone';

export interface Booking {
  id: string;
  leadId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: string;
  lawyer: string;
  method: BookingMethod;
  date: string;
  time: string;
  durationMinutes?: number;
  status: BookingStatus;
  /** Free-form notes from admin (internal). */
  notes?: string;
  /** Client's description of their legal issue, populated from the booking form. */
  issueSummary?: string;
  reminders?: Array<{ type: '24h' | '2h' | '30m'; scheduledAt: string; sent: boolean; channel: 'email' | 'sms' }>;
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LawyerSchedule {
  id: string;
  lawyerId: string;
  dayOfWeek: number; // 0-6, 0=Sunday
  isOff: boolean;
  slots: Array<{ start: string; end: string }>;
  effectiveFrom?: string;
  effectiveTo?: string;
}

// ─── Blog ────────────────────────────────────────────────────────────────

export type PostStatus = 'draft' | 'published' | 'scheduled';

export interface PostSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  noindex?: boolean;
  canonical?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: PostStatus;
  author: string;
  thumbnail?: string;
  publishedAt?: string;
  scheduledAt?: string;
  seo?: PostSeo;
  createdAt: string;
  updatedAt: string;
}

export interface PostRevision {
  id: string;
  postId: string;
  title: string;
  content: string;
  excerpt?: string;
  author: string;
  reason?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  postCount: number;
  createdAt?: string;
}

// Aliases theo plan Phase 7 §17.3
export type BlogCategory = Category;
export type BlogTag = Tag;
export type BlogRevision = PostRevision;
export type BlogSEO = Required<Pick<PostSeo, 'metaTitle' | 'metaDescription' | 'noindex'>> & {
  ogImage?: string;
  canonicalUrl?: string;
};

// ─── Services & Lawyers ─────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string;
  price?: number;
  duration?: number;
  category: string;
  isActive: boolean;
  lawyerIds: string[];
  createdAt: string;
}

export interface Lawyer {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar?: string;
  specialties: string[];
  email: string;
  phone: string;
  experience: number;
  isActive: boolean;
  serviceIds: string[];
  createdAt: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Review {
  id: string;
  authorName: string;
  authorEmail: string;
  rating: number; // 1-5
  content: string;
  service: string;
  lawyer?: string;
  status: ReviewStatus;
  reply?: string;
  repliedByName?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  reason: ReportReason;
  description?: string;
  reportedByName: string;
  status: ReportStatus;
  resolvedAt?: string;
  resolvedByName?: string;
  createdAt: string;
}

// ─── Chatbot ─────────────────────────────────────────────────────────────

export type ChatbotSessionStatus = 'active' | 'ended' | 'abandoned' | 'handoff';
export type ChatbotSender = 'user' | 'bot' | 'system' | 'agent';

export interface ChatbotMessage {
  id: string;
  from: ChatbotSender;
  content: string;
  timestamp: string;
  intentId?: string;
  confidence?: number;
}

export interface ChatbotHandoff {
  to: string;
  toUserId?: string;
  at: string;
  reason?: string;
  resolved?: boolean;
  notes?: string;
}

export interface ChatbotSession {
  id: string;
  sessionId: string;
  messages: ChatbotMessage[];
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  intent?: string;
  intentId?: string;
  startedAt: string;
  endedAt?: string;
  status: ChatbotSessionStatus;
  messageCount: number;
  handoff?: ChatbotHandoff | null;
  source?: 'web' | 'facebook' | 'zalo' | 'other';
  userAgent?: string;
  convertedToLeadId?: string;
  convertedToBookingId?: string;
}

export interface ChatbotIntent {
  id: string;
  name: string;
  description?: string;
  sampleUtterances: string[];
  responseTemplate: string;
  handoffEnabled: boolean;
  handoffTo?: string;
  handoffToUserId?: string;
  handoffKeywords?: string[];
  isActive: boolean;
  matchCount: number;
  createdAt: string;
  updatedAt?: string;
}

// ─── Newsletter ─────────────────────────────────────────────────────────

export type SubscriberStatus = 'active' | 'unsubscribed';
export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'sending' | 'failed';
export type CampaignSegment = 'all' | 'fdi' | 'realestate' | 'custom';

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: string;
  status: SubscriberStatus;
  unsubscribedAt?: string;
  source?: string;
  tags?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: CampaignStatus;
  segment: CampaignSegment;
  customEmails?: string[];
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubRate: number;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Users ─────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'CSKH' | 'LAWYER' | 'USER' | 'VIEWER' | 'MANAGER';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  phone?: string;
  impersonatedBy?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  memberCount: number;
  createdAt: string;
}

export type Permission =
  | 'crm.read' | 'crm.write' | 'crm.delete'
  | 'booking.read' | 'booking.write' | 'booking.delete'
  | 'blog.read' | 'blog.write' | 'blog.publish' | 'blog.delete'
  | 'services.read' | 'services.write'
  | 'lawyers.read' | 'lawyers.write'
  | 'reviews.read' | 'reviews.moderate' | 'reviews.reply'
  | 'chatbot.read' | 'chatbot.train'
  | 'newsletter.read' | 'newsletter.send'
  | 'users.read' | 'users.write' | 'users.impersonate'
  | 'settings.read' | 'settings.write'
  | 'audit.read';

export const ALL_PERMISSIONS: Array<{ key: Permission; label: string; group: string }> = [
  { key: 'crm.read', label: 'Xem', group: 'CRM' },
  { key: 'crm.write', label: 'Sửa', group: 'CRM' },
  { key: 'crm.delete', label: 'Xóa', group: 'CRM' },
  { key: 'booking.read', label: 'Xem', group: 'Booking' },
  { key: 'booking.write', label: 'Sửa', group: 'Booking' },
  { key: 'booking.delete', label: 'Xóa', group: 'Booking' },
  { key: 'blog.read', label: 'Xem', group: 'Blog' },
  { key: 'blog.write', label: 'Sửa', group: 'Blog' },
  { key: 'blog.publish', label: 'Publish', group: 'Blog' },
  { key: 'blog.delete', label: 'Xóa', group: 'Blog' },
  { key: 'services.read', label: 'Xem', group: 'Dịch vụ' },
  { key: 'services.write', label: 'Sửa', group: 'Dịch vụ' },
  { key: 'lawyers.read', label: 'Xem', group: 'Luật sư' },
  { key: 'lawyers.write', label: 'Sửa', group: 'Luật sư' },
  { key: 'reviews.read', label: 'Xem', group: 'Đánh giá' },
  { key: 'reviews.moderate', label: 'Duyệt', group: 'Đánh giá' },
  { key: 'reviews.reply', label: 'Phản hồi', group: 'Đánh giá' },
  { key: 'chatbot.read', label: 'Xem', group: 'Chatbot' },
  { key: 'chatbot.train', label: 'Train', group: 'Chatbot' },
  { key: 'newsletter.read', label: 'Xem', group: 'Newsletter' },
  { key: 'newsletter.send', label: 'Gửi', group: 'Newsletter' },
  { key: 'users.read', label: 'Xem', group: 'Người dùng' },
  { key: 'users.write', label: 'Sửa', group: 'Người dùng' },
  { key: 'users.impersonate', label: 'Đăng nhập thay', group: 'Người dùng' },
  { key: 'settings.read', label: 'Xem', group: 'Cài đặt' },
  { key: 'settings.write', label: 'Sửa', group: 'Cài đặt' },
  { key: 'audit.read', label: 'Xem audit log', group: 'Audit' },
];

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'assign' | 'login' | 'logout' | 'impersonate' | 'publish' | 'unpublish';
  entity: string;
  entityId: string;
  entityLabel?: string;
  diff?: Record<string, { before?: unknown; after?: unknown }>;
  createdAt: string;
  ipAddress?: string;
}

// ─── Settings ──────────────────────────────────────────────────────────

export interface SystemSettings {
  siteName: string;
  hotline: string;
  email: string;
  address: string;
  workingHours: {
    start: string;
    end: string;
    daysOff: string[];
  };
  slotDuration: number;
  bookingLeadTime: number;
  currency: string;
}

// ─── Pagination ─────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface TableFilters {
  status?: string;
  source?: string;
  category?: string;
  [key: string]: string | undefined;
}

// ─── Admin API Responses ────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}
