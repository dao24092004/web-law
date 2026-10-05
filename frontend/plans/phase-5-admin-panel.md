# Phase 5: Admin Panel — Full-Featured Internal CMS
## Week 8-9 — Công ty Luật TNHH ICRC

---

## Phase Overview

**Mục tiêu**: Xây dựng toàn bộ Admin Panel tái hiện 100% UI từ `frontend/demo/admin.html` — gồm Dashboard, CRM, Booking Management, Blog CRUD, Services/Lawyers CRUD, Reviews Moderation, Newsletter, User Management, và System Settings. Đây là internal tool dành cho đội ngũ ICRC Law, không phải public-facing.

**Design Reference**: `frontend/demo/admin.html` — **lines 1-1420 (styles) và 593-1340 (markup)**

**Architecture direction**: Feature-first module tại `src/features/admin/`, dùng Next.js App Router với route groups `(admin)`. Role-based access control đã có từ Phase 1 (RBAC + NextAuth). Mọi trang admin bảo vệ bởi middleware kiểm tra quyền.

---

## Demo UI Reference Summary

### Layout (từ demo)

**Sidebar** (`240px` fixed, `--primary #1E3A5F`):
- Logo: icon scales + "ICRC Law" / "Admin Panel"
- Navigation sections: "Quản lý" và "Hệ thống"
- Nav items: icon + label + badge, active state với `--accent` left border
- User footer: avatar initials + name + role + logout button
- Hover: `rgba(255,255,255,0.06)` background, color white
- Active: `rgba(255,255,255,0.1)` background, `--accent` border-left

**Topbar** (`64px` sticky):
- Left: hamburger toggle (hidden desktop), title, date
- Right: date range picker, export button (primary), notification bell (dot badge), language toggle

**Content area**: `24px` padding, background `--bg (#F0F2F5)`

**Responsive**: Mobile `< 768px` — sidebar hidden, hamburger visible, sidebar slides in with overlay

### Dashboard View

**Stats Grid**: 4 columns, gap 16px
- Each card: icon (40×40, colored bg) + trend badge + large number + label + sub text
- Colors: `--blue (#2563EB)`, `--green (#059669)`, `--yellow (#D97706)`, `--purple (#7C3AED)`
- Hover: `translateY(-2px)` + shadow

**Charts Row**: `1.6fr 1fr` grid
- Left: Line/Area chart (SVG) — 30-day access + leads
- Right: Donut chart — lead distribution by service
- Legend below each chart

**Booking Table**: white card, rounded, header with count + "Xem tất cả" link
- Columns: Giờ, Khách hàng (avatar + name + email), Dịch vụ, Luật sư, Hình thức, Trạng thái (badge), Thao tác

**Kanban + Activity**: `1.4fr 1fr` grid
- Kanban: 4 columns (Mới / Đã liên hệ / Đang tư vấn / Đã chuyển đổi)
- Activity timeline: icon circle + message + time
- Quick Actions: 4-column grid of action cards

### CRM View

**Filter bar**: pill tabs (Tất cả / Mới / Đã liên hệ / Đang tư vấn / Đã chuyển đổi / Mất), count badges

**Search bar**: icon + input, focus border `--primary`, max-width 320px

**CRM Table**: columns = Khách hàng, Điện thoại, Email, Dịch vụ, Nguồn (tag), Ngày tạo, CSKH, Trạng thái (badge), Thao tác

**Source tags**: pill badges with icon (Facebook / Organic / Chatbot / Google Ads / Referral)

### Booking View (Admin)

Placeholder trong demo — cần xây dựng:
- Calendar view (week/month)
- Booking list table với filters
- Booking detail modal

### Blog View (Admin)

Placeholder trong demo — cần xây dựng:
- Blog post list table
- TipTap rich editor
- Image upload
- Status: Draft / Published / Scheduled

### Services/Lawyers View (Admin)

Placeholder trong demo — cần xây dựng:
- Service CRUD (name, description, price, lawyer assignment)
- Lawyer CRUD (profile, bio, specialties, avatar, schedule)

### Reviews View (Admin)

Placeholder trong demo — cần xây dựng:
- Review list with approve/reject
- Rating display (stars)
- Reply functionality

### Chatbot Logs View (Admin)

Placeholder trong demo — cần xây dựng:
- Conversation history table
- Session search
- Message detail view
- Sentiment/keyword analysis

### Newsletter View (Admin)

Placeholder trong demo — cần xây dựng:
- Subscriber list
- Campaign creation
- Email template preview

### Users & Permissions View (Admin)

Placeholder trong demo — cần xây dựng:
- User list table
- Role assignment (Admin / Lawyer / Staff)
- Create/edit user form

### Settings View (Admin)

Placeholder trong demo — cần xây dựng:
- General settings (site name, contact, social links)
- Notification settings
- Booking settings (working hours, slot duration)
- SEO defaults

---

## Design Tokens to Preserve (Admin)

### Colors
```
--primary: #1E3A5F
--primary-dark: #152A45
--primary-light: #2A4F7A
--primary-faint: #EFF3F8
--accent: #C9A84C
--bg: #F0F2F5 (background)
--gray-50: #F8F9FA
--gray-100: #F0F2F5
--gray-200: #E4E8EF
--gray-300: #CBD2DC
--gray-400: #9CA3AF
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--green: #059669, --green-bg: #ECFDF5
--yellow: #D97706, --yellow-bg: #FFFBEB
--red: #DC2626, --red-bg: #FEF2F2
--blue: #2563EB, --blue-bg: #EFF6FF
--purple: #7C3AED, --purple-bg: #F5F3FF
```

### Spacing
```
--sidebar-w: 240px
--topbar-h: 64px
--content-padding: 24px
```

### Radii / Shadows
```
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05)
--shadow-sm: 0 2px 8px rgba(0,0,0,0.06)
--shadow-md: 0 4px 16px rgba(0,0,0,0.08)
--shadow-lg: 0 8px 32px rgba(0,0,0,0.10)
```

### Typography
```
--font: 'Plus Jakarta Sans' (from Google Fonts)
Font weights: 300, 400, 500, 600, 700, 800
```

---

## Architecture

### Feature-First Module

```
src/features/admin/
  layout/
    admin-sidebar.tsx
    admin-topbar.tsx
    admin-layout.tsx        ← wraps all admin routes
  dashboard/
    components/
      stats-card.tsx
      line-chart.tsx
      donut-chart.tsx
      booking-table.tsx
      lead-kanban.tsx
      activity-timeline.tsx
      quick-actions.tsx
    hooks/
    api/
    types/
    index.ts
  crm/
    components/
      crm-filters.tsx
      crm-table.tsx
      crm-lead-modal.tsx
      lead-kanban-board.tsx
    hooks/
    types/
    index.ts
  bookings/
    components/
      calendar-view.tsx
      booking-table.tsx
      booking-detail-modal.tsx
    hooks/
    types/
    index.ts
  blog/
    components/
      blog-list.tsx
      blog-editor.tsx         ← TipTap integration
      blog-post-modal.tsx
    hooks/
    types/
    index.ts
  services/
    components/
      service-list.tsx
      service-form.tsx
      lawyer-list.tsx
      lawyer-form.tsx
    hooks/
    types/
    index.ts
  reviews/
    components/
      review-list.tsx
      review-card.tsx
    hooks/
    types/
    index.ts
  chatbot-logs/
    components/
      conversation-list.tsx
      conversation-detail.tsx
    hooks/
    types/
    index.ts
  newsletter/
    components/
      subscriber-list.tsx
      campaign-form.tsx
      template-preview.tsx
    hooks/
    types/
    index.ts
  users/
    components/
      user-list.tsx
      user-form.tsx
      role-manager.tsx
    hooks/
    types/
    index.ts
  settings/
    components/
      general-settings.tsx
      notification-settings.tsx
      booking-settings.tsx
      seo-settings.tsx
    hooks/
    types/
    index.ts
  shared/
    components/
      data-table.tsx         ← TanStack Table wrapper
      pagination.tsx
      search-bar.tsx
      filter-tabs.tsx
      badge.tsx
      action-buttons.tsx
      empty-state.tsx
      confirm-dialog.tsx
      admin-error-boundary.tsx
      admin-page-header.tsx
      row-user.tsx
    hooks/
      use-admin-table.ts     ← TanStack Query + Table
    index.ts
  api/
    admin-api.ts
  types/
    index.ts
  constants/
    sidebar-nav.ts
  index.ts
```

### Route Structure

```
src/app/(admin)/
  layout.tsx                 ← imports AdminLayout from features/admin
  dashboard/
    page.tsx                 ← Dashboard
  crm/
    page.tsx                 ← CRM Lead Management
    [id]/
      page.tsx               ← Lead Detail
  bookings/
    page.tsx                 ← Booking Calendar
    [id]/
      page.tsx               ← Booking Detail
  blog/
    page.tsx                 ← Blog Post List
    new/
      page.tsx               ← New Post
    [id]/
      edit/
        page.tsx             ← Edit Post
  services/
    page.tsx                 ← Services List
  lawyers/
    page.tsx                 ← Lawyers List
  reviews/
    page.tsx                 ← Reviews Moderation
  chatbot/
    page.tsx                 ← Chatbot Logs
  newsletter/
    page.tsx                 ← Newsletter
  users/
    page.tsx                 ← Users & Permissions
  settings/
    page.tsx                 ← System Settings
```

### State Strategy

- **TanStack Query v5**: Primary for all admin data — CRUD operations, list pagination, filtering, optimistic updates
- **Zustand**: Admin UI state only (sidebar collapsed, active filters, selected rows, modal open state)
- **React Hook Form + Zod**: All admin forms
- **TipTap**: Blog editor state managed internally by TipTap

### Auth & RBAC

All admin routes protected by middleware. Permission matrix:

| Role | Dashboard | CRM | Bookings | Blog | Services | Reviews | Users | Settings |
|------|----------|-----|----------|------|----------|---------|-------|----------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| LAWYER | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| STAFF | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Suggested File Plan

### Admin Layout
- `src/features/admin/layout/admin-sidebar.tsx`
- `src/features/admin/layout/admin-topbar.tsx`
- `src/features/admin/layout/admin-layout.tsx`
- `src/features/admin/constants/sidebar-nav.ts`

### Shared Components
- `src/features/admin/shared/components/data-table.tsx`
- `src/features/admin/shared/components/pagination.tsx`
- `src/features/admin/shared/components/search-bar.tsx`
- `src/features/admin/shared/components/filter-tabs.tsx`
- `src/features/admin/shared/components/badge.tsx`
- `src/features/admin/shared/components/action-buttons.tsx`
- `src/features/admin/shared/components/empty-state.tsx`
- `src/features/admin/shared/components/confirm-dialog.tsx`
- `src/features/admin/shared/components/admin-error-boundary.tsx`
- `src/features/admin/shared/components/admin-page-header.tsx`
- `src/features/admin/shared/components/row-user.tsx`
- `src/features/admin/shared/hooks/use-admin-table.ts`
- `src/features/admin/shared/index.ts`

### Dashboard
- `src/features/admin/dashboard/components/stats-card.tsx`
- `src/features/admin/dashboard/components/line-chart.tsx`
- `src/features/admin/dashboard/components/donut-chart.tsx`
- `src/features/admin/dashboard/components/booking-table.tsx`
- `src/features/admin/dashboard/components/lead-kanban.tsx`
- `src/features/admin/dashboard/components/activity-timeline.tsx`
- `src/features/admin/dashboard/components/quick-actions.tsx`
- `src/features/admin/dashboard/hooks/index.ts`
- `src/features/admin/dashboard/api/index.ts`
- `src/features/admin/dashboard/types/index.ts`
- `src/features/admin/dashboard/index.ts`

### CRM
- `src/features/admin/crm/components/crm-filters.tsx`
- `src/features/admin/crm/components/crm-table.tsx`
- `src/features/admin/crm/components/crm-lead-modal.tsx`
- `src/features/admin/crm/components/lead-kanban-board.tsx`
- `src/features/admin/crm/hooks/index.ts`
- `src/features/admin/crm/api/index.ts`
- `src/features/admin/crm/types/index.ts`
- `src/features/admin/crm/index.ts`

### Blog
- `src/features/admin/blog/components/blog-list.tsx`
- `src/features/admin/blog/components/blog-editor.tsx` (TipTap)
- `src/features/admin/blog/components/blog-post-modal.tsx`
- `src/features/admin/blog/hooks/index.ts`
- `src/features/admin/blog/api/index.ts`
- `src/features/admin/blog/types/index.ts`
- `src/features/admin/blog/index.ts`

### Services & Lawyers
- `src/features/admin/services/components/service-list.tsx`
- `src/features/admin/services/components/service-form.tsx`
- `src/features/admin/services/components/lawyer-list.tsx`
- `src/features/admin/services/components/lawyer-form.tsx`
- `src/features/admin/services/hooks/index.ts`
- `src/features/admin/services/api/index.ts`
- `src/features/admin/services/types/index.ts`
- `src/features/admin/services/index.ts`

### Bookings
- `src/features/admin/bookings/components/booking-calendar.tsx`
- `src/features/admin/bookings/components/booking-table.tsx`
- `src/features/admin/bookings/components/booking-detail-modal.tsx`
- `src/features/admin/bookings/hooks/index.ts`
- `src/features/admin/bookings/api/index.ts`
- `src/features/admin/bookings/types/index.ts`
- `src/features/admin/bookings/index.ts`

### Reviews, Chatbot Logs, Newsletter, Users, Settings
- `src/features/admin/reviews/...`
- `src/features/admin/chatbot-logs/...`
- `src/features/admin/newsletter/...`
- `src/features/admin/users/...`
- `src/features/admin/settings/...`

### API / Types
- `src/features/admin/api/admin-api.ts`
- `src/features/admin/types/index.ts`

### Routes
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/dashboard/page.tsx`
- `src/app/(admin)/crm/page.tsx`
- `src/app/(admin)/crm/[id]/page.tsx`
- `src/app/(admin)/bookings/page.tsx`
- `src/app/(admin)/bookings/[id]/page.tsx`
- `src/app/(admin)/blog/page.tsx`
- `src/app/(admin)/blog/new/page.tsx`
- `src/app/(admin)/blog/[id]/edit/page.tsx`
- `src/app/(admin)/services/page.tsx`
- `src/app/(admin)/lawyers/page.tsx`
- `src/app/(admin)/reviews/page.tsx`
- `src/app/(admin)/chatbot/page.tsx`
- `src/app/(admin)/newsletter/page.tsx`
- `src/app/(admin)/users/page.tsx`
- `src/app/(admin)/settings/page.tsx`

### Tests / Mocks
- `tests/mocks/handlers/admin.ts`
- `tests/unit/admin-sidebar.test.tsx`
- `tests/unit/admin-store.test.tsx`
- `tests/e2e/admin-dashboard.spec.ts`
- `tests/e2e/admin-crm.spec.ts`

---

## Demo Class → React Component Mapping

| Demo class / block | React component | Ghi chú |
|---|---|---|
| `.sidebar` | `AdminSidebar` | Fixed left nav, 240px |
| `.sidebar__item.active` | Active state | accent border-left |
| `.sidebar__badge` | Notification badge | Red/gold variants |
| `.sidebar__user` | User footer | Avatar + name + logout |
| `.topbar` | `AdminTopbar` | Sticky, 64px |
| `.topbar__toggle` | Mobile hamburger | Hidden on desktop |
| `.stats-grid` | Stats grid | 4-col responsive |
| `.stat-card` | `StatsCard` | Hover lift effect |
| `.charts-row` | Charts row | 1.6fr / 1fr |
| `.chart-line` | `LineChart` | SVG area chart |
| `.donut-wrap` | `DonutChart` | SVG donut |
| `.table-wrap table` | `DataTable` | TanStack Table |
| `.badge--green/yellow/red/blue/purple` | `Badge` | Status indicators |
| `.row-user` | `RowUser` | Avatar + name + sub |
| `.action-btns` | `ActionButtons` | View/Edit/Delete |
| `.kanban` | `LeadKanban` | 4-column pipeline |
| `.activity-list` | `ActivityTimeline` | Timeline items |
| `.quick-actions` | `QuickActions` | 4-col action grid |
| `.filter-bar` | `FilterTabs` | Pill filter buttons |
| `.search-bar` | `SearchBar` | Icon + input |
| `.source-tag` | SourceTag | Lead source badge |
| `.page-header` | `AdminPageHeader` | Title + subtitle + actions |
| `.card` | `AdminCard` | White card container |
| `.card__header` | Card header | Title + action |
| `.empty-state` | `EmptyState` | No data placeholder |
| `.confirm-dialog` | `ConfirmDialog` | Destructive action confirmation |
| `.admin-error-boundary` | `AdminErrorBoundary` | Error fallback |

---

## Detailed UI Specification

### AdminSidebar

**Visual Spec**:
- Width: 240px, min-height: 100vh, background: `--primary`
- Logo area: padding 20px 16px, border-bottom `1px solid rgba(255,255,255,0.08)`
- Logo icon: 36×36px, `--accent` background, `--primary-dark` text, font-weight 800
- Nav items: padding 10px 16px, font-size 0.84rem, color `rgba(255,255,255,0.6)`
- Active: color white, bg `rgba(255,255,255,0.1)`, left border 3px `--accent`
- Hover: bg `rgba(255,255,255,0.06)`, color white
- Section label: font-size 0.65rem, weight 700, color `rgba(255,255,255,0.3)`, letter-spacing 1px uppercase
- Badge: `--accent` bg, `--primary-dark` text, border-radius 9999px, min-width 18px
- User footer: avatar 34×34px, initials, name 0.8rem weight 600, role 0.68rem color `rgba(255,255,255,0.4)`
- Logout: bg `rgba(220,38,38,0.15)`, text `#fca5a5`, hover `rgba(220,38,38,0.25)`

**Behavior**:
- Mobile: hidden by default, slides in from left (-240px → 0), backdrop overlay
- Toggle via topbar hamburger
- Active item determined by current route
- Notification badge on CRM menu item

### AdminTopbar

**Visual Spec**:
- Height: 64px, bg white, border-bottom 1px `--gray-200`
- Left: hamburger (hidden >768px), title (1.05rem weight 700 `--primary`), date (0.82rem `--gray-400`)
- Right: date range btn, export btn (primary), notification bell (icon btn with red dot), language toggle

**Behavior**:
- Sticky to top
- Hamburger visible only on mobile
- Export button triggers CSV download of current view data

### StatsCard

**Visual Spec**:
- White bg, border 1px `--gray-200`, radius 12px, padding 20px
- Icon: 40×40px, radius 8px, colored bg
- Trend badge: pill, green/red background, arrow icon, font-size 0.72rem weight 700
- Value: 2rem weight 800 `--primary`, line-height 1
- Label: 0.8rem `--gray-500`
- Sub: 0.72rem `--gray-400`

**Hover**: `translateY(-2px)`, box-shadow `--shadow-md`

### DataTable (TanStack Table)

**Visual Spec**:
- White card, radius 12px, overflow-x auto
- Header: bg `--gray-50`, th font-size 0.72rem weight 700 `--gray-500`, uppercase, letter-spacing 0.5px
- Row: padding 12px 14px, border-bottom 1px `--gray-100`
- Row hover: bg `--gray-50`
- Last row: no border-bottom

**Features**:
- Column sorting (click header)
- Column visibility toggle
- Row selection (checkbox)
- Bulk actions on selection
- Pagination (10/25/50 per page)
- Empty state

### LeadKanbanBoard

**Visual Spec**:
- 4 columns: Mới (blue) / Đã liên hệ (yellow) / Đang tư vấn (purple) / Đã chuyển đổi (green)
- Column header: title 0.75rem weight 700, count badge 20×20px circle
- Card: white bg, border 1px `--gray-200`, radius 8px, padding 10px 12px
- Card hover: shadow `--shadow-sm`, border-color `--primary-light`
- Card content: name (weight 700 `--primary`), service (0.7rem `--gray-500`), time + priority dot
- Horizontal scroll on overflow

**Behavior**:
- Drag-and-drop between columns (using `@dnd-kit/core`)
- Optimistic update on drop
- Card click → lead detail modal

### BlogEditor (TipTap)

**Visual Spec**:
- TipTap editor với toolbar: Bold, Italic, Underline, Strike, H1-H3, Bullet List, Numbered List, Quote, Code, Link, Image, Video
- Toolbar: sticky, white bg, border-bottom `--gray-200`
- Editor area: min-height 400px, padding 16px, focus border `--primary`
- Word count / reading time footer
- Autosave indicator

### BookingCalendar

**Visual Spec**:
- Week/Month view toggle
- Day cell: date number, booking count badge, color-coded by status
- Booking slot: time + customer name + service + lawyer
- Color by status: green (confirmed), yellow (pending), red (cancelled)

**Behavior**:
- Click day → shows bookings for that day in side panel
- Click booking → detail modal
- Drag to reschedule

---

## API Contract

### Dashboard Stats

```
GET /api/admin/dashboard/stats
Response: { appointments_today, appointments_change, leads_week, leads_change, conversion_rate, conversion_change, chatbot_conversations, chatbot_change }
```

### CRM Leads

```
GET /api/admin/leads?page=1&limit=20&status=&source=&search=
Response: { data: Lead[], total, page, limit }
```

```
GET /api/admin/leads/:id
Response: Lead
```

```
PUT /api/admin/leads/:id
Body: { status, assignedTo, notes }
```

```
POST /api/admin/leads
Body: { name, phone, email, service, source }
```

### Blog Posts

```
GET /api/admin/posts?page=1&limit=20&status=&category=
POST /api/admin/posts
PUT /api/admin/posts/:id
DELETE /api/admin/posts/:id
```

### Services & Lawyers

```
GET /api/admin/services
POST /api/admin/services
PUT /api/admin/services/:id
DELETE /api/admin/services/:id

GET /api/admin/lawyers
POST /api/admin/lawyers
PUT /api/admin/lawyers/:id
DELETE /api/admin/lawyers/:id
```

### Reviews

```
GET /api/admin/reviews?page=1&limit=20&status=
PUT /api/admin/reviews/:id/approve
PUT /api/admin/reviews/:id/reject
POST /api/admin/reviews/:id/reply
```

### Chatbot Logs

```
GET /api/admin/chatbot/sessions?page=1&limit=20&search=
GET /api/admin/chatbot/sessions/:sessionId
```

### Newsletter

```
GET /api/admin/newsletter/subscribers?page=1&limit=50
POST /api/admin/newsletter/subscribers/export
GET /api/admin/newsletter/campaigns
POST /api/admin/newsletter/campaigns
```

### Users

```
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/:id
DELETE /api/admin/users/:id
PUT /api/admin/users/:id/role
```

---

## Responsive Behavior

| Breakpoint | Sidebar | Content | Stats | Charts | Kanban |
|---|---|---|---|---|---|
| > 1024px | Fixed 240px | Full | 4-col | 1.6fr/1fr | 4-col |
| 768-1024px | Fixed | Full | 2-col | 1-col | 2-col |
| < 768px | Hidden (slide-in) | Full | 2-col | 1-col | 2-col |

---

## Accessibility Requirements

- All interactive elements keyboard navigable
- Focus trap in modals and dialogs
- ARIA labels on icon-only buttons
- `role="table"` on data tables with proper `scope` attributes
- Skip link to main content
- High contrast on all text (WCAG AA)
- Focus visible indicators on all interactive elements

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| TipTap SSR hydration issues | MEDIUM | Use dynamic import with `ssr: false` |
| TanStack Table v9 breaking changes | LOW | Pin version in package.json |
| Large admin data causing slow renders | MEDIUM | Virtual scrolling for tables > 100 rows |
| Permission bypass via direct URL | HIGH | Middleware checks on every admin route |
| @dnd-kit complexity for Kanban | MEDIUM | Start with read-only board, add drag later |
| Blog image upload large payloads | MEDIUM | Use Cloudinary signed upload URL |

---

## Definition of Done

1. Admin layout renders correctly with sidebar + topbar + content
2. Dashboard shows 4 stat cards + charts + tables matching demo
3. All sidebar navigation items route correctly
4. Active state highlights current route
5. Mobile: sidebar slides in/out, overlay works
6. CRM: table renders with pagination + filters + search
7. Lead kanban board renders (read-only first)
8. Blog list renders + TipTap editor opens
9. Services CRUD functional
10. Lawyers CRUD functional
11. Reviews moderation (approve/reject) functional
12. Users list + role assignment functional
13. RBAC enforced — unauthorized users redirected to `/`
14. Admin error boundary catches and displays errors gracefully
15. All admin pages have correct metadata (title, breadcrumbs)
16. Build passes, TypeScript clean, 80%+ unit test coverage on shared components
17. No emoji icons — all icons from Lucide React or inline SVG

---

## Recommended Execution Order

1. Admin layout shell (sidebar + topbar + route group)
2. Shared UI components (DataTable, Badge, SearchBar, FilterTabs, Pagination, ActionButtons, EmptyState, ConfirmDialog, AdminPageHeader, RowUser)
3. Admin store (Zustand — sidebar state, active filters)
4. Dashboard page (stats + charts + booking table + kanban + activity)
5. CRM page (filters + table + lead modal)
6. Lead kanban board (dnd-kit drag-drop)
7. Bookings admin page (calendar + table + detail modal)
8. Blog admin page (list + TipTap editor + post form)
9. Services & Lawyers admin page (CRUD)
10. Reviews moderation page (approve/reject)
11. Chatbot logs page (conversation history)
12. Newsletter page (subscribers + campaigns)
13. Users & permissions page (CRUD + role manager)
14. Settings page (general + booking + notification)
15. RBAC middleware on all admin routes
16. Admin error boundary + loading states
17. Unit tests + E2E tests

---

## Deliverables

- Complete admin feature module at `src/features/admin/`
- All admin routes under `src/app/(admin)/`
- TanStack Query hooks for every admin entity
- Shared component library for admin UI
- Role-based route protection
- Unit tests for shared components and hooks
- E2E tests for critical admin flows
