# Phase 7: Admin ERP — Xây dựng đầy đủ chức năng vận hành

> **Mục tiêu**: Biến admin module từ "dashboard tĩnh + list stub" thành **full ERP vận hành ICRC Law** — 10 modules nghiệp vụ, mock-first (lưu `localStorage`), schema mới, đủ CRUD + workflow + analytics + audit log + RBAC để vận hành thật.
>
> **UI Reference**: `frontend/demo/admin.html` (đã clone xong ở Phase 5–6, Phase 7 chỉ làm nghiệp vụ chứ không clone UI thêm)
>
> **Quyết định kiến trúc** (đã chốt với user):
> - ✅ **Mock-first** — dữ liệu lưu `localStorage` qua singleton DB, không cần backend
> - ✅ **Schema mới** — bổ sung types mới vào `features/admin/types/`, không ép schema cũ
> - ✅ **Phạm vi Full ERP** — 10 modules: CRM, Bookings, Blog, Services, Lawyers, Reviews, Newsletter, Chatbot, Landing Builder, Users/RBAC + Settings + Audit
> - ✅ **Dùng lại** shared components & types đã có trong Phase 5

---

# MỤC LỤC

| # | Section | Mô tả |
| :- | :- | :- |
| 01 | Tổng quan & hiện trạng | 10 modules, gap analysis từng page |
| 02 | Kiến trúc Foundation | Mock DB, hook layer, generic CRUD, RBAC gate |
| 03 | Module 1 — CRM / Lead | Detail drawer, bulk action, Kanban tách riêng, timeline |
| 04 | Module 2 — Bookings | Calendar view, reminder, reschedule, completion → tạo lead |
| 05 | Module 3 — Blog | TipTap editor, SEO panel, revision, schedule |
| 06 | Module 4 — Services & Lawyers | CRUD đầy đủ, assignment matrix, schedule editor |
| 07 | Module 5 — Reviews | Moderate, reply, rating stats, report queue |
| 08 | Module 6 — Newsletter | Subscribers, campaign, template, analytics |
| 09 | Module 7 — Chatbot | Session detail, handoff to CRM, intent training |
| 10 | Module 8 — Landing Page Builder | Drag-drop 3-pane editor, variant A/B, analytics |
| 11 | Module 9 — Users / RBAC | Users, Roles, Permission matrix, impersonate |
| 12 | Module 10 — Settings + Audit | General, Booking, SMTP, Theme, Audit log viewer |
| 13 | Notification center | Topbar bell dropdown, channel config |
| 14 | Definition of Done | Acceptance checklist chung cho mọi module |
| 15 | Lộ trình triển khai | 12 tuần, 1 dev full-time |
| 16 | Rủi ro & giảm thiểu | 5 rủi ro chính |
| 17 | Phụ lục — types mới | Full type definitions bổ sung |

---

# 01. TỔNG QUAN & HIỆN TRẠNG

## 1.1 Phạm vi 10 modules

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    PHASE 7 — FULL ADMIN ERP                                │
│                                                                           │
│  ┌── NGHIỆP VỤ CHÍNH ──────────┐  ┌── NGHIỆP VỤ PHỤ ─────────────────┐ │
│  │  1. CRM / Lead               │  │  7. Chatbot Logs + Handoff        │ │
│  │  2. Bookings / Lịch hẹn      │  │  8. Newsletter                    │ │
│  │  3. Blog / Bài viết          │  │  9. Landing Page Builder          │ │
│  │  4. Dịch vụ                  │  │                                  │ │
│  │  5. Luật sư                  │  │                                  │ │
│  │  6. Reviews / Đánh giá       │  │                                  │ │
│  └──────────────────────────────┘  └──────────────────────────────────┘ │
│                                                                           │
│  ┌── NỀN TẢNG ────────────────────────────────────────────────────────┐  │
│  │  10. Users / RBAC / Settings / Audit Log / Notification Center      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Total: 10 modules · ~70 tasks · 12 tuần · 1 dev full-time              │
└──────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Hiện trạng từng page (gap analysis)

| Page | Route | Trạng thái Phase 6 | Gap cần làm |
| :- | :- | :- | :- |
| Dashboard | `/admin/dashboard` | ✅ Đã clone 100% demo (730 dòng) | Bổ sung realtime stats từ mock DB |
| CRM | `/admin/crm` | 🟡 List + filter + search (231 dòng) | Detail drawer, create/edit modal, bulk action, Kanban, export CSV, timeline |
| Bookings | `/admin/bookings` | 🟡 List (166 dòng) | Calendar view, tạo/sửa/hủy, reminder, reschedule, completion → tạo lead |
| Blog | `/admin/blog` | 🟡 List (251 dòng) | TipTap editor, SEO panel, preview, schedule, revision, taxonomies |
| Services | `/admin/services` | 🟡 List (216 dòng) | Form CRUD đầy đủ, isActive toggle, lawyer assignment |
| Reviews | `/admin/reviews` | 🟡 List (196 dòng) | Bulk approve, reply UI, rating stats, report queue |
| Chatbot | `/admin/chatbot` | 🟡 List (169 dòng) | Session detail với conversation, handoff, intent training |
| Newsletter | `/admin/newsletter` | 🔴 Stub (99 dòng) | Viết gần như từ đầu |
| Users | `/admin/users` | 🔴 Stub (120 dòng) | CRUD + roles + permissions matrix + impersonate |
| Settings | `/admin/settings` | 🔴 Stub (167 dòng) | 4 tab (General / Booking / SMTP / Theme) |
| Landing Builder | `/admin/landing-builder` | ❌ Placeholder | Drag-drop 3-pane editor, variant A/B, analytics |

**Shared components đã có** (dùng lại toàn bộ):
`AdminPageHeader · SearchBar · FilterTabs · Badge · RowUser · ActionButtons · Pagination · Modal · EmptyState · DataTable · DonutChart · LineChart`

**Shared types đã có** (dùng lại):
`Lead · LeadStatus · LeadSource · Booking · BookingStatus · BlogPost · Service · Lawyer · Review · ChatbotSession · Subscriber · Campaign · AdminUser · SystemSettings · PaginatedResponse · PaginationParams`

**Bổ sung types mới** (xem Phụ lục §17): 18 types mới cho nghiệp vụ chuyên sâu.

---

# 02. KIẾN TRÚC FOUNDATION

> **Mục tiêu**: Tạo lớp nền tảng dùng chung cho 10 modules — mock DB singleton, hook CRUD, RBAC gate, toast/notification. Làm **trước tuần 1**, mọi module sau phụ thuộc.

## 2.1 Sơ đồ kiến trúc

```
┌──────────────────────────────────────────────────────────────────┐
│                       Admin Page (UI Layer)                       │
│  src/features/admin/pages/{crm,bookings,blog,...}/index.tsx       │
└────────────────────────────┬─────────────────────────────────────┘
                             │ useList / useGet / useCreate / useUpdate / useDelete
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Hook Layer (CRUD Abstraction)                  │
│  src/features/admin/lib/{use-mock-query,crud}.ts                 │
│  → useList<T>(collection) → { data, isLoading, error }           │
│  → useCreate<T>(collection) → { mutate, isPending }              │
│  → useUpdate<T>(collection) → { mutate, isPending }              │
│  → useDelete<T>(collection) → { mutate, isPending }              │
└────────────────────────────┬─────────────────────────────────────┘
                             │ TanStack Query
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Mock DB (Singleton + localStorage)             │
│  src/features/admin/mock/db.ts                                   │
│  - 12 collections: leads, bookings, posts, services, lawyers,    │
│    reviews, chatbot_sessions, subscribers, campaigns, users,      │
│    settings, audit_logs, notifications, landing_pages             │
│  - persist vào localStorage key 'vp-luat-admin-db'               │
│  - seed lần đầu từ src/features/admin/mock/seed.ts               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
                   localStorage: vp-luat-admin-db (JSON)
```

## 2.2 Cấu trúc thư mục mới

```
src/features/admin/
├── api/                              # [giữ] admin-api.ts (legacy, refactor sang dùng crud)
├── constants/                        # [giữ] sidebar-nav, thêm hằng số cho mock DB
├── layout/                           # [giữ] admin-layout, admin-sidebar, admin-topbar
├── pages/                            # [giữ + sửa] 12 page
├── shared/                           # [giữ] shared components
├── store/                            # [giữ + sửa] admin-ui.store
├── types/                            # [giữ + mở rộng] thêm 18 types mới (xem §17)
│
├── mock/                             # [MỚI] ─────────────────────────────────────
│   ├── db.ts                         # Singleton DB class, localStorage persist
│   ├── seed.ts                       # Seed data ≥30 record/collection
│   └── reset.ts                      # "Reset to seed" button trong Settings
│
├── lib/                              # [MỚI] ─────────────────────────────────────
│   ├── use-mock-query.ts             # Wrapper TanStack Query cho mock DB
│   ├── crud.ts                       # Generic useList / useGet / useCreate / useUpdate / useDelete
│   ├── notify.ts                     # Toast (success/error/info/warning) qua store
│   ├── audit.ts                      # ghiAudit(action, entity, entityId, diff?)
│   ├── rbac.ts                       # useCan(permission) hook, PermissionGate component
│   └── export-csv.ts                 # Export CSV (papaparse)
│
├── components/                       # [MỚI] ─────────────────────────────────────
│   ├── confirm-dialog.tsx            # Modal xác nhận xóa/hành động nguy hiểm
│   ├── data-table-v2.tsx             # Generic table: sort, selection, bulk action
│   ├── date-range-picker.tsx         # Chọn khoảng ngày
│   ├── stat-card-grid.tsx            # Skeleton loading 4 stat card
│   ├── empty-state-with-cta.tsx      # Empty state + CTA thêm mới
│   ├── form-field.tsx                # Wrapper label + error + icon cho input/select
│   ├── status-badge.tsx              # Status badge generic, dùng cho mọi status
│   ├── timeline.tsx                  # Timeline component (cho Lead/Booking detail)
│   ├── drawer.tsx                    # Slide-from-right drawer (thay vì modal cho detail)
│   └── notification-center.tsx       # Topbar bell + dropdown list notifications
│
└── schema/                           # [MỚI] ─────────────────────────────────────
    ├── lead.schema.ts                # Zod schema cho form Lead
    ├── booking.schema.ts             # Zod schema cho form Booking
    ├── post.schema.ts                # Zod schema cho form Blog
    ├── service.schema.ts             # Zod schema cho form Service
    ├── lawyer.schema.ts              # Zod schema cho form Lawyer
    ├── review.schema.ts              # Zod schema cho form Review reply
    ├── campaign.schema.ts            # Zod schema cho form Campaign
    ├── user.schema.ts                # Zod schema cho form User
    ├── role.schema.ts                # Zod schema cho form Role
    └── landing-page.schema.ts        # Zod schema cho form Landing Page + blocks
```

## 2.3 Task list Foundation (Tuần 1)

| # | Task | File | Effort | Phụ thuộc |
| :- | :- | :- | :- | :- |
| F-01 | Tạo `mock/db.ts` — class `MockDB` với `getCollection<T>(name)`, `insert`, `update`, `delete`, `query(filters)`, persist localStorage | `src/features/admin/mock/db.ts` | S | — |
| F-02 | Tạo `mock/seed.ts` — seed data cho 12 collection (≥30 record/collection, đa dạng ngày/trạng thái) | `src/features/admin/mock/seed.ts` | M | F-01 |
| F-03 | Tạo `lib/use-mock-query.ts` — wrapper `useQuery` của TanStack Query, queryKey = `['admin', collection, params]` | `src/features/admin/lib/use-mock-query.ts` | S | F-01 |
| F-04 | Tạo `lib/crud.ts` — generic `useList<T>`, `useGet<T>`, `useCreate<T>`, `useUpdate<T>`, `useDelete<T>` (mỗi cái 1 hook) | `src/features/admin/lib/crud.ts` | M | F-03 |
| F-05 | Tạo `lib/notify.ts` — `notifySuccess/Error/Info/Warning` qua `useAdminUIStore.notifications`, auto-remove sau `duration` | `src/features/admin/lib/notify.ts` | S | — |
| F-06 | Tạo `lib/audit.ts` — `ghiAudit({ action, entity, entityId, userId, diff })` — ghi vào collection `audit_logs` | `src/features/admin/lib/audit.ts` | S | F-01 |
| F-07 | Tạo `lib/rbac.ts` — `useCan(permission)` hook (đọc user từ `useAdminAuth`), `PermissionGate` component, danh sách permissions constants | `src/features/admin/lib/rbac.ts` | S | F-01 |
| F-08 | Tạo `lib/export-csv.ts` — `exportToCSV(data, filename, columns)` dùng papaparse | `src/features/admin/lib/export-csv.ts` | S | — |
| F-09 | Tạo `components/confirm-dialog.tsx` — modal với title, message, confirm/cancel buttons, variant `danger | default` | `src/features/admin/components/confirm-dialog.tsx` | S | — |
| F-10 | Tạo `components/data-table-v2.tsx` — generic table với sort, selection (checkbox), bulk action toolbar, row action menu, pagination, empty state | `src/features/admin/components/data-table-v2.tsx` | M | — |
| F-11 | Tạo `components/date-range-picker.tsx` — 2 input date + preset "Hôm nay / 7 ngày / 30 ngày / Tháng này" | `src/features/admin/components/date-range-picker.tsx` | S | — |
| F-12 | Tạo `components/stat-card-grid.tsx` — render 4 stat card với skeleton loading state | `src/features/admin/components/stat-card-grid.tsx` | S | — |
| F-13 | Tạo `components/empty-state-with-cta.tsx` — empty state có icon, message, nút CTA thêm mới | `src/features/admin/components/empty-state-with-cta.tsx` | S | — |
| F-14 | Tạo `components/form-field.tsx` — wrapper `<label> + <input/select/textarea> + <error>` | `src/features/admin/components/form-field.tsx` | S | — |
| F-15 | Tạo `components/status-badge.tsx` — status badge generic với map `status → {label, variant}` | `src/features/admin/components/status-badge.tsx` | S | — |
| F-16 | Tạo `components/timeline.tsx` — timeline vertical với dot + line + content slot | `src/features/admin/components/timeline.tsx` | S | — |
| F-17 | Tạo `components/drawer.tsx` — slide-from-right drawer với backdrop, ESC to close, body scroll lock | `src/features/admin/components/drawer.tsx` | S | — |
| F-18 | Tạo `store/admin-ui.store.ts` — bổ sung `currentUser`, `isImpersonating` (xem §11) | `src/features/admin/store/admin-ui.store.ts` | S | F-07 |
| F-19 | Refactor `api/admin-api.ts` — đổi mọi hàm thành `async function` trỏ vào `mock/db.ts` qua `crud.ts`, **giữ nguyên signature** | `src/features/admin/api/admin-api.ts` | S | F-01..F-04 |
| F-20 | Tạo `schema/*.schema.ts` — 10 Zod schema cho mọi form (xem §17) | `src/features/admin/schema/*.ts` | M | — |

**Kết quả Foundation**: Khi mount, admin tự load seed vào `localStorage`. Mọi page hiện tại chỉ cần thay `useState<MOCK_DATA>` thành `useList<T>('collection')` là có data thật + loading + error.

---

# 03. MODULE 1 — CRM / LEAD

> **Lý do ưu tiên #1**: CRM là trái tim của ICRC Law — mọi module khác (Bookings, Chatbot, Landing) đều có thể tạo Lead. Làm trước để các module sau tích hợp được ngay.

## 3.1 Wireframe (theo demo + bổ sung)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Quản lý Lead / CRM         [+ Thêm Lead mới]  [📥 Export CSV]      │
├─────────────────────────────────────────────────────────────────────┤
│  🔍 Tìm theo tên / SĐT / email…         Lọc: [Nguồn ▾] [CSKH ▾]  │
│  [ Tất cả 47 ] [ Mới 12 ] [ LH 15 ] [ XL 10 ] [ CV 7 ] [ Mất 3 ]   │
├─────────────────────────────────────────────────────────────────────┤
│  ☐ │ Khách hàng   │ Dịch vụ      │ Nguồn   │ CSKH │ Trạng thái │ Tạo │ ⋯ │
│  ───────────────────────────────────────────────────────────────────│
│  ☐ │ NA Nguyễn A  │ Th.lập CT    │ 🌐 FB   │ Lan  │ 🟦 Mới     │ 25 │ ⋯ │
│  ☐ │ TB Trần B    │ HĐ thuê      │ 📢 GA   │ Minh │ 🟨 LH      │ 24 │ ⋯ │
│  …                                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Bulk: [Gán CSKH ▾] [Đổi trạng thái ▾] [🗑 Xóa]   ‹ 1 2 3 … 5 ›  │
└─────────────────────────────────────────────────────────────────────┘

Click row → mở Drawer bên phải:
┌─────────────────────────────────────┐
│ ← Nguyễn Văn A        [Sửa] [⋯]  │
├─────────────────────────────────────┤
│  📞 0901 234 567  ✉ nva@email.com │
│  Dịch vụ: Thành lập công ty        │
│  Nguồn: Facebook  CSKH: Lan        │
│  Trạng thái: 🟦 Mới                 │
│  Tạo: 25/05/2026  Cập nhật: 25/05  │
├─────────────────────────────────────┤
│  [📋 Thông tin] [💬 Hoạt động]      │
│  [📝 Ghi chú]   [📅 Lịch hẹn]      │
├─────────────────────────────────────┤
│  ── Tab Hoạt động ──                 │
│  ● 25/05 09:30  Lan gọi điện       │
│  │  📞 Đã gọi 3 lần, chưa nghe     │
│  ● 25/05 10:00  Minh ghi chú        │
│  │  💬 "Quan tâm dịch vụ FDI"       │
│  ● 24/05 14:00  Trạng thái → LH    │
└─────────────────────────────────────┘
```

## 3.2 Cấu trúc file mới

```
src/features/admin/pages/crm/
├── index.tsx                         # Page chính (refactor từ stub)
├── components/
│   ├── leads-table.tsx               # DataTable với selection, sort
│   ├── lead-form.tsx                 # Form tạo/sửa (Zod)
│   ├── lead-detail-drawer.tsx        # Drawer chi tiết với 4 tab
│   ├── lead-timeline.tsx             # Timeline activity
│   ├── lead-notes.tsx                # CRUD notes
│   ├── lead-bookings-tab.tsx         # Lịch sử booking của lead
│   ├── lead-bulk-action-bar.tsx      # Bulk action toolbar
│   ├── lead-source-chart.tsx         # Donut chart phân bổ nguồn
│   └── lead-filters.tsx              # Filter nâng cao (date range, CSKH, nguồn)
└── hooks/
    ├── use-leads.ts                  # Wrap useList('leads')
    ├── use-lead-mutations.ts         # create/update/delete + ghiAudit
    └── use-lead-timeline.ts          # query timeline của 1 lead

src/features/admin/pages/crm/pipeline/   # Kanban riêng (tách từ dashboard)
├── page.tsx                          # Route /admin/crm/pipeline
├── index.tsx                         # LeadKanban component
└── components/
    ├── lead-kanban-column.tsx        # 1 cột kanban
    ├── lead-kanban-card.tsx          # 1 card kéo thả
    └── lead-kanban-filters.tsx       # Filter theo CSKH
```

## 3.3 Task list Module 1

| # | Task | Mô tả chi tiết | Effort |
| :- | :- | :- | :- |
| CRM-01 | Refactor `pages/crm/index.tsx` | Dùng `useList<Lead>('leads')` thay MOCK_LEADS, thêm filter nâng cao + export CSV | S |
| CRM-02 | Tạo `components/leads-table.tsx` | `DataTable` với checkbox column, sort, row action menu (View/Edit/Delete) | M |
| CRM-03 | Tạo `components/lead-form.tsx` | React Hook Form + Zod, fields: name, phone, email, service (select), source (select), status, assignedTo (select user), notes | M |
| CRM-04 | Tạo `components/lead-detail-drawer.tsx` | Drawer 480px, 4 tab: Thông tin / Hoạt động / Ghi chú / Lịch hẹn | L |
| CRM-05 | Tạo `components/lead-timeline.tsx` | Render collection `lead_timeline` sort theo `createdAt desc` | S |
| CRM-06 | Tạo `components/lead-notes.tsx` | CRUD notes, mỗi note có author + timestamp | S |
| CRM-07 | Tạo `components/lead-bookings-tab.tsx` | Query `bookings` theo `leadId`, render list mini | S |
| CRM-08 | Tạo `components/lead-bulk-action-bar.tsx` | Hiện khi `selectedRows.size > 0`: Gán CSKH / Đổi trạng thái / Xóa | M |
| CRM-09 | Tạo `components/lead-filters.tsx` | DateRangePicker + select CSKH + select Nguồn, persist vào `useAdminUIStore.filters` | S |
| CRM-10 | Tạo `components/lead-source-chart.tsx` | DonutChart top 5 nguồn, dùng `DonutChart` shared | S |
| CRM-11 | Tạo `pages/crm/pipeline/page.tsx` + Kanban | Tách Kanban từ `dashboard/index.tsx` ra đây, dùng `@dnd-kit` đã có, ghi audit khi kéo thả | M |
| CRM-12 | Wire audit log mọi mutation | create/update/delete/status change/assign → ghi vào `audit_logs` | S |
| CRM-13 | Wire RBAC gate | Hide "Thêm Lead" / Edit / Delete nếu user không có permission `crm.write` | S |

**Definition of Done**:
- ✅ Tạo / sửa / xóa lead qua modal form với validation
- ✅ Click row → drawer chi tiết với 4 tab
- ✅ Kéo thả card giữa các cột trên Kanban `/admin/crm/pipeline`
- ✅ Bulk action: gán CSKH / đổi trạng thái / xóa hàng loạt
- ✅ Export CSV
- ✅ Filter nâng cao (date range, CSKH, nguồn)
- ✅ Mọi mutation có audit log
- ✅ RBAC gate ẩn action nếu không có quyền

---

# 04. MODULE 2 — BOOKINGS / LỊCH HẸN

> **Lý do ưu tiên #2**: Bookings là nghiệp vụ cốt lõi của ICRC Law (đặt lịch tư vấn). Tích hợp với CRM (Booking → Lead) và Services (chọn luật sư).

## 4.1 Wireframe

```
List view (giữ nguyên Phase 5) + Calendar view (mới):
┌─────────────────────────────────────────────────────────────────────┐
│  Lịch hẹn & Booking        [📅 Calendar] [📋 List] [+ Tạo lịch hẹn]│
├─────────────────────────────────────────────────────────────────────┤
│  Tuần: ‹  25/05 - 31/05/2026  ›       [Hôm nay] [Tuần] [Tháng]    │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                        │
│  │ T2  │ T3  │ T4  │ T5  │ T6  │ T7  │ CN  │                        │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                        │
│  │08:30│     │09:00│     │     │     │     │  ← click cell: tạo BK  │
│  │NV A │     │TT B │     │     │     │     │  ← click event: drawer │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                        │
│  │10:15│     │     │11:00│13:30│     │16:00│                        │
│  │LV C │     │     │PT D │HC E │     │VF F │                        │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                        │
│  Chú thích: 🟡 Chờ  🟦 Xác nhận  🟢 Hoàn tất  🔴 Hủy              │
└─────────────────────────────────────────────────────────────────────┘

Create/Edit Modal:
┌─────────────────────────────────────┐
│  Tạo lịch hẹn mới            [×]   │
├─────────────────────────────────────┤
│  Khách hàng: [Tìm hoặc +Mới ▾]   │
│    Tên: [Nguyễn Văn A         ]   │
│    SĐT: [0901 234 567         ]   │
│    Email:[nva@email.com        ]   │
│                                     │
│  Dịch vụ:  [Thành lập công ty ▾]  │
│  Luật sư:  [LS. Hùng         ▾]   │
│  Hình thức: ⦿ Tại VP  ○ Online  ○ Phone │
│  Ngày:    [26/05/2026]             │
│  Giờ:     [09:00] (slot 30 phút)   │
│  Ghi chú: [                    ]   │
│                                     │
│  [Reminder: 24h trước ✓] [2h ✓]    │
│                                     │
│  [Hủy]                       [Tạo]  │
└─────────────────────────────────────┘
```

## 4.2 Cấu trúc file mới

```
src/features/admin/pages/bookings/
├── index.tsx                         # Page chính với 2 tab List/Calendar
├── components/
│   ├── bookings-calendar.tsx         # react-big-calendar wrapper, week+day view
│   ├── booking-form.tsx              # Form tạo/sửa
│   ├── booking-detail-drawer.tsx     # Drawer với: thông tin, lịch sử, reminder, nút Reschedule/Cancel/Complete
│   ├── booking-reminder-config.tsx   # Cấu hình reminder (24h/2h/30min)
│   ├── booking-availability-view.tsx # Bảng luật sư × giờ trống trong tuần
│   ├── booking-filters.tsx           # Filter date range + status + lawyer
│   └── booking-bulk-action.tsx       # Bulk confirm/cancel
└── hooks/
    ├── use-bookings.ts               # useList + custom filter
    ├── use-booking-mutations.ts      # create/update/cancel/complete
    └── use-availability.ts           # Query slots trống của luật sư
```

## 4.3 Task list Module 2

| # | Task | Mô tả | Effort |
| :- | :- | :- | :- |
| BK-01 | Tạo `bookings-calendar.tsx` | Dùng `react-big-calendar`, hỗ trợ tuần + tháng, màu theo status, click event mở drawer | L |
| BK-02 | Tạo `booking-form.tsx` | React Hook Form + Zod, autocomplete khách từ Lead, slot picker từ `useAvailability` | M |
| BK-03 | Tạo `booking-detail-drawer.tsx` | 4 section: Thông tin / Lịch sử thay đổi / Reminder / Actions | M |
| BK-04 | Tạo `booking-reminder-config.tsx` | Checkbox 24h / 2h / 30min trước, hiển thị queue reminders đã lên lịch | S |
| BK-05 | Tạo `booking-availability-view.tsx` | Grid 7 ngày × 24 slot, highlight slot đã book, click slot trống mở form create | M |
| BK-06 | Tạo `booking-filters.tsx` | DateRangePicker + select Status + select Lawyer | S |
| BK-07 | Tạo `booking-bulk-action.tsx` | Bulk confirm (status pending → confirmed) / bulk cancel | S |
| BK-08 | Refactor `index.tsx` | Tab List / Calendar, share toolbar, dùng `useList` + filter | S |
| BK-09 | Wire "Complete → Create Lead" | Khi status chuyển `completed`, hiện modal hỏi "Tạo Lead mới?" | S |
| BK-10 | Wire audit log + RBAC | Mọi mutation ghi audit, hide actions nếu không có quyền | S |

**Definition of Done**:
- ✅ Calendar 2 chế độ (tuần/tháng) + List view
- ✅ CRUD đầy đủ, validation form
- ✅ Reminder config (24h/2h/30min) lưu vào `bookings.reminders`
- ✅ Reschedule (kéo thả trên calendar) với audit
- ✅ Cancel với lý do lưu `cancelledReason`
- ✅ Complete → tạo Lead (optional)
- ✅ Availability view cho biết luật sư nào rảnh

---

# 05. MODULE 3 — BLOG / BÀI VIẾT

> **Lý do ưu tiên #3**: Blog phục vụ SEO + content marketing, cần rich editor chuẩn. Làm trước Phase Landing Builder vì Landing tái sử dụng block content từ Blog.

## 5.1 Wireframe

```
List view (giữ nguyên Phase 5) + Editor (mới):
┌─────────────────────────────────────────────────────────────────────┐
│  Bài viết & Blog       [+ Tạo bài viết]   [📁 Danh mục] [🏷 Tags]  │
├─────────────────────────────────────────────────────────────────────┤
│  [ Tất cả 25 ] [ Nháp 8 ] [ Đã đăng 14 ] [ Lên lịch 3 ]            │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ ☐ │ Tiêu đề         │ Danh mục │ Tác giả │ Trạng thái │ ⋯ │      │
│  │ ☐ │ FDI 2025…       │ FDI      │ Hùng    │ 🟢 Published │ ⋯ │      │
│  │ ☐ │ HĐĐT 2025…      │ HĐĐT     │ Mai     │ 🟡 Scheduled │ ⋯ │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘

Click [Tạo bài viết] → Editor 3-pane:
┌─────────────────────────────────────────────────────────────────────┐
│  ‹ Quay lại   [Lưu nháp] [Xem trước] [Đặt lịch] [Xuất bản]        │
├──────────┬─────────────────────────────────────┬────────────────────┤
│ SIDEBAR  │  EDITOR (TipTap)                     │  PROPERTIES PANEL   │
│          │  ┌────────────────────────────────┐  │                    │
│ - TT     │  │ H1: Tiêu đề bài viết          │  │  Tiêu đề:         │
│ - Slug   │  │                                │  │  [H1 tại đây   ]  │
│ - Slug   │  │  B [B] [I] [U] [S] [Link] [Img]│  │  Slug:            │
│ - Exc    │  │  H1 H2 H3 • [“”] [≡] [<>]      │  │  [tu-dong-tao   ]  │
│ - Cat    │  │  ──────────────────────────    │  │  Excerpt:         │
│ - Tags   │  │  Nội dung bài viết...          │  │  [50 ký tự     ]  │
│ - Thumb  │  │                                │  │  Danh mục:        │
│ - SEO    │  │  [+] Thêm ảnh                  │  │  [HĐĐT         ▾]  │
│ - Hist   │  │                                │  │  Tags:            │
│          │  │                                │  │  [hđđt, 2025 +]  │
│          │  └────────────────────────────────┘  │  Thumbnail:        │
│          │  Từ: 1,234 ký tự · 187 từ · 5' đọc │  [📷 Upload]       │
│          │                                     │  SEO:              │
│          │                                     │  Meta title:       │
│          │                                     │  [60 ký tự      ]  │
│          │                                     │  Meta desc:        │
│          │                                     │  [160 ký tự     ]  │
│          │                                     │  ☐ Noindex         │
│          │                                     │                    │
│          │                                     │  ── Lên lịch ──    │
│          │                                     │  [26/05/2026 09:00]│
└──────────┴─────────────────────────────────────┴────────────────────┘
```

## 5.2 Cấu trúc file mới

```
src/features/admin/pages/blog/
├── index.tsx                         # Page chính với tab List / Categories / Tags
├── components/
│   ├── posts-table.tsx               # DataTable
│   ├── post-editor.tsx               # 3-pane editor
│   ├── post-editor-toolbar.tsx       # Toolbar TipTap
│   ├── post-editor-sidebar.tsx       # Slug/excerpt/cat/tags/thumb
│   ├── post-editor-properties.tsx    # SEO + schedule
│   ├── post-preview.tsx              # Modal preview render template public
│   ├── post-revision-history.tsx     # List revision, restore
│   ├── post-categories.tsx           # CRUD categories
│   ├── post-tags.tsx                 # CRUD tags
│   └── post-image-uploader.tsx       # Upload ảnh (mock base64)
└── hooks/
    ├── use-posts.ts
    ├── use-post-mutations.ts
    ├── use-post-revisions.ts
    ├── use-categories.ts
    └── use-tags.ts
```

## 5.3 Task list Module 3

| # | Task | Mô tả | Effort |
| :- | :- | :- | :- |
| BL-01 | Cài `npm i @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder` | TipTap + 4 extension | S |
| BL-02 | Tạo `post-editor.tsx` | 3-pane: sidebar trái (ToC/Outline), editor giữa (TipTap), properties phải | L |
| BL-03 | Tạo `post-editor-toolbar.tsx` | Bold, Italic, Underline, Strike, H1/H2/H3, list, link, image, undo/redo | M |
| BL-04 | Tạo `post-editor-sidebar.tsx` | Slug (auto-generate từ title), excerpt, category, tags, thumbnail | M |
| BL-05 | Tạo `post-editor-properties.tsx` | SEO panel: meta title/desc, OG image, noindex, scheduledAt picker | M |
| BL-06 | Tạo `post-preview.tsx` | Modal render bài viết theo template public `/news/[slug]` | M |
| BL-07 | Tạo `post-revision-history.tsx` | Lưu mỗi save = 1 revision, list reverse, nút "Restore" | M |
| BL-08 | Tạo `post-categories.tsx` | CRUD categories (8 mock: FDI, HĐĐT, Dân sự, Hình sự, Đất đai, Doanh nghiệp, Lao động, Sở hữu trí tuệ) | S |
| BL-09 | Tạo `post-tags.tsx` | CRUD tags với autocomplete, màu sắc | S |
| BL-10 | Tạo `post-image-uploader.tsx` | Drag-drop ảnh, lưu base64 vào localStorage, max 2MB | M |
| BL-11 | Refactor `index.tsx` | 3 tab: Bài viết / Danh mục / Tags | S |
| BL-12 | Wire schedule auto-publish | Mỗi 60s check posts có `status='scheduled' && scheduledAt <= now` → đổi sang `published` | S |
| BL-13 | Wire audit log + RBAC | Mọi save ghi audit, hide "Xuất bản" nếu không có quyền `blog.publish` | S |

**Definition of Done**:
- ✅ TipTap editor với toolbar đầy đủ
- ✅ SEO panel (meta title, meta desc, OG, noindex)
- ✅ Preview render đúng template public
- ✅ Revision history với restore
- ✅ Schedule auto-publish (setInterval check mỗi 60s)
- ✅ Categories + Tags CRUD riêng

---

# 06. MODULE 4 — SERVICES & LAWYERS

> **Lý do ưu tiên #4**: Làm trước Landing Builder (landing page cần block hiển thị dịch vụ/luật sư) và trước khi Bookings cần chọn luật sư.

## 6.1 Wireframe

```
Tab Dịch vụ (giữ nguyên list, bổ sung CRUD):
┌─────────────────────────────────────────────────────────────────────┐
│  Dịch vụ & Luật sư    [+ Tạo dịch vụ] [+ Tạo luật sư]             │
├─────────────────────────────────────────────────────────────────────┤
│  [📋 Dịch vụ] [👨‍⚖️ Luật sư] [🔗 Phân công] [📅 Lịch]                 │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ ☐ │ Tên DV         │ Giá    │ Luật sư │ Trạng thái │ ⋯ │      │
│  │ ☐ │ Th.lập CT      │ 5tr    │ 3 LS    │ 🟢 Active  │ ⋯ │      │
│  │ ☐ │ Tư vấn FDI     │ 8tr    │ 2 LS    │ 🟢 Active  │ ⋯ │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘

Tab Phân công (Matrix):
┌──────────────────────────────────────────────────────────┐
│  Phân công Dịch vụ × Luật sư                            │
│  ┌──────────────┬──────┬──────┬──────┬──────┐            │
│  │ Dịch vụ \ LS │ Hùng │ Mai  │ Sơn  │ Hương│            │
│  ├──────────────┼──────┼──────┼──────┼──────┤            │
│  │ Th.lập CT    │  ☑   │  ☐   │  ☑   │  ☐   │            │
│  │ Tư vấn FDI   │  ☐   │  ☑   │  ☐   │  ☑   │            │
│  │ Ly hôn       │  ☐   │  ☐   │  ☐   │  ☑   │            │
│  └──────────────┴──────┴──────┴──────┴──────┘            │
│  [💾 Lưu]                                                 │
└──────────────────────────────────────────────────────────┘

Tab Lịch (Schedule editor):
┌──────────────────────────────────────────────────────────┐
│  Lịch làm việc: LS. Hùng     Tuần: ‹ 25/05-31/05 ›      │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐            │
│  │ T2  │ T3  │ T4  │ T5  │ T6  │ T7  │ CN  │            │
│  │8-12 │8-12 │8-12 │8-12 │8-12 │ OFF │ OFF │            │
│  │13-17│13-17│13-17│ OFF │13-17│ OFF │ OFF │            │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘            │
│  [Lặp lại cho 4 tuần] [💾 Lưu]                           │
└──────────────────────────────────────────────────────────┘
```

## 6.2 Cấu trúc file mới

```
src/features/admin/pages/services/
├── index.tsx                         # Page với 4 tab
├── components/
│   ├── services-table.tsx
│   ├── service-form.tsx              # Form tạo/sửa, bao gồm lawyerIds multi-select
│   ├── lawyers-table.tsx
│   ├── lawyer-form.tsx               # Form tạo/sửa, bao gồm serviceIds multi-select
│   ├── lawyer-schedule-editor.tsx    # Grid 7 ngày × 24h
│   ├── assignment-matrix.tsx         # Bảng 2D checkbox
│   └── assignment-matrix-row.tsx     # 1 dòng của matrix
└── hooks/
    ├── use-services.ts
    ├── use-lawyers.ts
    ├── use-schedule.ts
    └── use-assignment.ts
```

## 6.3 Task list Module 4

| # | Task | Mô tả | Effort |
| :- | :- | :- | :- |
| SV-01 | Refactor `services-table.tsx` | Dùng `useList<Service>`, thêm cột "Số luật sư" và switch Active/Inactive | S |
| SV-02 | Tạo `service-form.tsx` | React Hook Form + Zod, multi-select lawyerIds | M |
| SV-03 | Tạo `lawyers-table.tsx` | Dùng `useList<Lawyer>`, hiển thị avatar, specialties, experience | S |
| SV-04 | Tạo `lawyer-form.tsx` | Form đầy đủ + upload avatar (base64) | M |
| SV-05 | Tạo `lawyer-schedule-editor.tsx` | Grid click-to-toggle slot 30 phút, lưu `lawyer_schedules` collection | M |
| SV-06 | Tạo `assignment-matrix.tsx` | Bảng 2D, lazy-render, batch save | M |
| SV-07 | Refactor `index.tsx` | 4 tab: Dịch vụ / Luật sư / Phân công / Lịch | S |
| SV-08 | Wire audit + RBAC | Mọi CRUD ghi audit, hide actions nếu không có quyền | S |
| SV-09 | Tích hợp với Bookings | BookingForm chỉ list luật sư `isActive` và trong `serviceIds` | S |

**Definition of Done**:
- ✅ CRUD dịch vụ + luật sư đầy đủ
- ✅ Assignment matrix với batch save
- ✅ Schedule editor 7 ngày × 24h
- ✅ Toggle active/inactive nhanh
- ✅ Avatar upload (base64)

---

# 07. MODULE 5 — REVIEWS / ĐÁNH GIÁ

## 7.1 Wireframe

```
List view (giữ nguyên) + Rating stats + Report queue:
┌─────────────────────────────────────────────────────────────────────┐
│  Đánh giá khách hàng       [✓ Bulk duyệt] [✗ Bulk từ chối]         │
├──────────────────────┬──────────────────────────────────────────────┤
│  ⭐ Rating breakdown │  [ Tất cả 47 ] [ Chờ 12 ] [✓ 30 ] [✗ 5 ]    │
│  5★ ████████  24    │  ┌────────────────────────────────────────┐  │
│  4★ ████       12    │  │ Tên     │ DV    │ ⭐ │ Nội dung │ TT │⋮│  │
│  3★ ██          6    │  │ Hoàng M │ FDI   │ 5★ │ "Tốt..." │ ✓  │⋮│  │
│  2★ █           3    │  │ Trần B  │ HĐĐT │ 4★ │ "OK..."  │ ⏳ │⋮│  │
│  1★ █           2    │  │ Lê C    │ Ly hôn│ 1★ │ "Tệ..."  │ 🚩 │⋮│  │
│  Avg: 4.2 ⭐         │  └────────────────────────────────────────┘  │
└──────────────────────┴──────────────────────────────────────────────┘

Click row → Drawer reply:
┌─────────────────────────────────────┐
│  ← Hoàng Minh             [✓ Duyệt]│
├─────────────────────────────────────┤
│  ⭐⭐⭐⭐⭐  5/5                     │
│  Dịch vụ: Tư vấn FDI               │
│  Nội dung: "Rất chuyên nghiệp..."  │
│  Ngày: 24/05/2026                   │
├─────────────────────────────────────┤
│  Phản hồi từ Văn phòng:            │
│  ┌──────────────────────────────┐  │
│  │ Cảm ơn anh/chị đã tin tưởng  │  │
│  │ Văn phòng Luật!              │  │
│  └──────────────────────────────┘  │
│  [Gửi phản hồi]                     │
└─────────────────────────────────────┘
```

## 7.2 Task list Module 5

| # | Task | Mô tả | Effort |
| :- | :- | :- | :- |
| RV-01 | Tạo `reviews-rating-stats.tsx` | Bar chart 5/4/3/2/1 sao, hiển thị average | S |
| RV-02 | Tạo `reviews-table.tsx` | DataTable với bulk action (duyệt/từ chối) | S |
| RV-03 | Tạo `review-detail-drawer.tsx` | Drawer với: review, reply form, nút Duyệt/Từ chối | M |
| RV-04 | Tạo `review-reply-form.tsx` | Textarea + submit, lưu `review.reply` + `repliedBy` | S |
| RV-05 | Tạo `reviews-report-queue.tsx` | Tab riêng cho review bị report, hiển thị lý do report | S |
| RV-06 | Refactor `index.tsx` | 2 tab: Reviews / Report queue, layout 2-col (stats + list) | S |
| RV-07 | Wire audit + RBAC | Duyệt/từ chối ghi audit, hide actions nếu không có quyền `reviews.moderate` | S |
| RV-08 | Đồng bộ public | Khi approved, public `/reviews` page auto cập nhật (cùng mock DB) | S |

**Definition of Done**:
- ✅ Bulk approve / reject
- ✅ Reply UI với lưu vào `review.reply`
- ✅ Rating stats (5/4/3/2/1 sao breakdown)
- ✅ Report queue riêng
- ✅ Đồng bộ public khi approved

---

# 08. MODULE 6 — NEWSLETTER

## 8.1 Wireframe

```
3 tab: Subscribers / Campaigns / Templates:

Subscribers:
┌─────────────────────────────────────────────────────────────────────┐
│  Newsletter · Subscribers       [+ Import CSV] [📤 Export] [+ Tạo]  │
├─────────────────────────────────────────────────────────────────────┤
│  [ Tất cả 1,247 ] [ Active 1,180 ] [ Unsub 67 ]                    │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ ☐ │ Email                  │ Đăng ký     │ Trạng thái │ ⋯ │      │
│  │ ☐ │ nguyenvana@gmail.com   │ 20/05/2026  │ 🟢 Active  │ ⋯ │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘

Campaigns:
┌─────────────────────────────────────────────────────────────────────┐
│  Newsletter · Campaigns       [+ Tạo campaign]                     │
├─────────────────────────────────────────────────────────────────────┤
│  [ Tất cả ] [ Nháp 3 ] [ Đã gửi 12 ] [ Lên lịch 2 ]                │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Subject           │ Gửi lúc       │ Nhận  │ Open │ TT │⋮ │      │
│  │ "FDI 2025 update" │ 24/05 09:00   │ 1180  │ 34%  │ ✓  │⋮ │      │
│  │ "BĐS 2025"       │ —             │ —     │ —    │ 📅 │⋮ │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘

Campaign detail:
┌──────────────────────────────────────────────────────────┐
│  Subject: [FDI 2025 update                          ]   │
│  From:    [ICRC Law <news@icrclaw.com>      ]    │
│  Segment: [● Tất cả  ○ FDI  ○ BĐS  ○ Custom]           │
│  Template:[Standard header         ▾]                   │
│  ┌────────────────────────────────────────────────┐    │
│  │ Rich text editor:                              │    │
│  │ [B] [I] [Link] [Img]                           │    │
│  │ ─────────────────────                          │    │
│  │ Nội dung email...                              │    │
│  │                                                │    │
│  └────────────────────────────────────────────────┘    │
│  Lên lịch: [ ] Gửi ngay  [☑] Gửi lúc [26/05 09:00]    │
│  [💾 Lưu nháp] [📤 Gửi thử]  [📤 Gửi thật]             │
└──────────────────────────────────────────────────────────┘

Analytics (mock): Open rate 34%, Click rate 8%, Bounce 1.2%, Unsub 0.4%
```

## 8.2 Cấu trúc file mới

```
src/features/admin/pages/newsletter/
├── index.tsx                         # Page với 3 tab
├── components/
│   ├── subscribers-table.tsx
│   ├── subscriber-import-dialog.tsx  # Upload CSV
│   ├── campaigns-table.tsx
│   ├── campaign-form.tsx             # Form tạo campaign
│   ├── campaign-editor.tsx           # Rich text mini cho email body
│   ├── campaign-analytics.tsx        # Stats với bar chart
│   ├── templates-table.tsx
│   ├── template-form.tsx
│   └── newsletter-filters.tsx
└── hooks/
    ├── use-subscribers.ts
    ├── use-campaigns.ts
    └── use-templates.ts
```

## 8.3 Task list Module 6

| # | Task | Mô tả | Effort |
| :- | :- | :- | :- |
| NL-01 | Tạo `subscribers-table.tsx` | DataTable với filter active/unsubscribed | S |
| NL-02 | Tạo `subscriber-import-dialog.tsx` | Upload CSV papaparse, preview, confirm | M |
| NL-03 | Tạo `campaigns-table.tsx` | DataTable với filter draft/sent/scheduled | S |
| NL-04 | Tạo `campaign-form.tsx` | Form + rich text editor mini | M |
| NL-05 | Tạo `campaign-editor.tsx` | TipTap với toolbar rút gọn, chèn link/CTA button | M |
| NL-06 | Tạo `campaign-analytics.tsx` | 4 stat card: Open / Click / Bounce / Unsub, bar chart | S |
| NL-07 | Tạo `templates-table.tsx` | List templates | S |
| NL-08 | Tạo `template-form.tsx` | Form CRUD template | S |
| NL-09 | Refactor `index.tsx` | 3 tab: Subscribers / Campaigns / Templates | S |
| NL-10 | Wire schedule auto-send | Mỗi 60s check campaigns có `status='scheduled' && scheduledAt <= now` → đổi sang `sent` | S |
| NL-11 | Wire audit + RBAC | Send campaign ghi audit + yêu cầu `newsletter.send` | S |

**Definition of Done**:
- ✅ CRUD subscribers + import/export CSV
- ✅ CRUD campaigns với rich text
- ✅ Templates CRUD
- ✅ Analytics (mock numbers)
- ✅ Schedule auto-send

---

# 09. MODULE 7 — CHATBOT

## 9.1 Wireframe

```
Sessions list (giữ nguyên) + Session detail + Intent training:

Session detail:
┌─────────────────────────────────────────────────────────────────────┐
│  ← Session #abc123         Intent: "Tư vấn FDI"  Status: 🟢 Active│
├─────────────────────────────────────────────────────────────────────┤
│  Khách: Nguyễn Văn A   📞 0901 234 567   Bắt đầu: 25/05 14:30    │
│  Thời lượng: 5 phút · 12 tin nhắn · 1 handoff                      │
├─────────────────────────────────────────────────────────────────────┤
│  💬 Hỏi đáp                                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ 👤 14:30  "Tôi muốn tư vấn FDI"                          │     │
│  │ 🤖 14:30  "Chào anh/chị! ICRC Law hỗ trợ..."      │     │
│  │ 👤 14:31  "Phí tư vấn bao nhiêu?"                        │     │
│  │ 🤖 14:31  "Phí tư vấn FDI từ 8 triệu..."                 │     │
│  │ 👤 14:32  "Tôi muốn đặt lịch"                            │     │
│  │ 🤖 14:32  "Anh/chị có muốn gặp tư vấn viên không?"       │     │
│  │ 👤 14:32  "Có"                                             │     │
│  │ 🧑‍💼 14:33  Handoff → LS. Hùng                             │     │
│  └──────────────────────────────────────────────────────────┘     │
│  Actions:                                                          │
│  [👤 Tạo Lead]   [📅 Tạo Booking]   [🏁 Đóng session]              │
└─────────────────────────────────────────────────────────────────────┘

Intent training:
┌─────────────────────────────────────────────────────────────────────┐
│  Chatbot · Intent Training       [+ Thêm intent]                   │
├─────────────────────────────────────────────────────────────────────┤
│  Intent: "Tư vấn FDI"                                              │
│  Sample utterances (10):                                           │
│  • "Tôi muốn tư vấn FDI"                                           │
│  • "Phí tư vấn FDI bao nhiêu?"                                    │
│  • "Đầu tư nước ngoài cần thủ tục gì?"                            │
│  • [+ Thêm utterance]                                              │
│  Response template:                                                │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ Chào anh/chị! Về tư vấn FDI, ICRC Law có thể...  │     │
│  │ {{lawyer_name}} sẽ hỗ trợ anh/chị.                       │     │
│  └──────────────────────────────────────────────────────────┘     │
│  Handoff rule: ☑ Chuyển sang LS. Hùng khi match                    │
└─────────────────────────────────────────────────────────────────────┘
```

## 9.2 Task list Module 7

| # | Task | Mô tả | Effort |
| :- | :- | :- | :- |
| CB-01 | Tạo `chatbot-sessions-table.tsx` | DataTable với filter intent/status/date | S |
| CB-02 | Tạo `chatbot-session-detail.tsx` | Drawer với conversation chat UI + metadata + actions | L |
| CB-03 | Tạo `chatbot-handoff-actions.tsx` | Nút "Tạo Lead" / "Tạo Booking" từ session, pre-fill data | M |
| CB-04 | Tạo `chatbot-intent-list.tsx` | List intents với count, edit, delete | S |
| CB-05 | Tạo `chatbot-intent-form.tsx` | Form CRUD intent: name, sample utterances (dynamic list), response template, handoff rule | M |
| CB-06 | Tạo `chatbot-analytics.tsx` | Top intents bar chart, handoff rate, avg session length | M |
| CB-07 | Refactor `index.tsx` | 2 tab: Sessions / Intent Training | S |
| CB-08 | Wire audit + RBAC | Handoff ghi audit, hide actions nếu không có quyền | S |

**Definition of Done**:
- ✅ Session detail với conversation chat UI
- ✅ Handoff to Lead / Booking
- ✅ Intent CRUD + sample utterances + response template
- ✅ Analytics (top intents, handoff rate)

---

# 10. MODULE 8 — LANDING PAGE BUILDER

> **Lý do ưu tiên thấp nhất trong nhóm ưu tiên cao**: Drag-drop editor phức tạp, làm cuối khi mọi block content đã sẵn sàng.

## 10.1 Wireframe

```
Pages list:
┌─────────────────────────────────────────────────────────────────────┐
│  Landing Page Builder       [+ Tạo Landing Page]                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Slug             │ Tiêu đề           │ Variant │ Trạng thái│      │
│  │ /lp/fdi-2025     │ FDI 2025          │ A       │ 🟢 Live   │      │
│  │ /lp/lyhon        │ Ly hôn tư vấn     │ A/B     │ 🟡 Draft  │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘

Editor 3-pane (drag-drop):
┌─────────────────────────────────────────────────────────────────────┐
│  ‹ Quay lại   [💾 Lưu] [👁 Xem trước] [📊 Analytics] [🚀 Publish] │
├──────────┬─────────────────────────────────────┬────────────────────┤
│ BLOCKS   │  CANVAS (kéo thả từ trái)         │  PROPERTIES        │
│          │  ┌──────────────────────────────┐  │                    │
│ ▦ Hero   │  │ [Hero]                       │  │  Block: Hero       │
│ 📋 Text  │  │  H1: Tiêu đề chính          │  │  Headline:         │
│ 🖼 Image │  │  Sub: Phụ đề                 │  │  [FDI 2025     ]   │
│ 🔘 CTA   │  │  [Button: Tư vấn ngay]       │  │  Subheadline:      │
│ 📞 Form  │  │  [Ảnh nền: bg-fdi.jpg]       │  │  [Phụ đề       ]   │
│ 💬 Testi │  │  ──────────────              │  │  CTA text:         │
│ 💲 Pric  │  │  [Service Grid]              │  │  [Tư vấn ngay ]   │
│ ⭐ Rev   │  │   • Th.lập CT                │  │  CTA link:         │
│ ❓ FAQ   │  │   • Tư vấn FDI               │  │  [/booking     ]   │
│ 📰 News  │  │   • M&A                      │  │  Background:       │
│ 👨‍⚖️ Law  │  │  [+] Block mới                │  │  [bg-fdi.jpg   ]   │
│ 🗺 Map   │  │                              │  │                    │
│ 📞 Cont  │  └──────────────────────────────┘  │                    │
│          │                                     │                    │
└──────────┴─────────────────────────────────────┴────────────────────┘

Analytics (mock):
┌──────────────────────────────────────────────────────────┐
│  Page: FDI 2025         Last 7 days                      │
│  ┌──────┬──────┬──────┬──────┐                          │
│  │ Views│ Conv │ CTR  │ Bounce│                         │
│  │ 1,234│  47  │ 3.8% │ 42%  │                         │
│  └──────┴──────┴──────┴──────┘                          │
│  Variant A: 50.2% conversion   Variant B: 49.8%          │
└──────────────────────────────────────────────────────────┘
```

## 10.2 Block types (xem type §17)

| Block | Mô tả | Properties chính |
| :- | :- | :- |
| `hero` | Banner lớn đầu page | headline, subheadline, CTA, bg image, align |
| `text` | Khối text thường | content (rich text), max-width |
| `image` | Ảnh đơn | src, alt, caption, width |
| `cta` | Call-to-action | text, link, variant (primary/secondary), icon |
| `lead-form` | Form nhận lead | fields, submitText, successMessage, redirectTo |
| `testimonials` | Carousel reviews | source (filter reviews), limit, layout |
| `pricing` | Bảng giá dịch vụ | services (multi-select), showButton |
| `reviews` | Hiển thị reviews | source, limit, layout, showRating |
| `faq` | Accordion FAQ | items (dynamic), icon |
| `news` | Tin tức mới nhất | category, limit, layout |
| `lawyers` | Grid luật sư | specialties, limit, showSchedule |
| `map` | Bản đồ Google Maps | embedUrl, height |
| `contact` | Thông tin liên hệ | address, phone, email, workingHours |

## 10.3 Task list Module 8

| # | Task | Mô tả | Effort |
| :- | :- | :- | :- |
| LP-01 | Tạo `landing-pages-table.tsx` | List pages với filter published/draft, nút edit/duplicate/delete | S |
| LP-02 | Tạo `landing-page-form.tsx` | Form metadata: title, slug, variant, target audience | S |
| LP-03 | Tạo `landing-block-library.tsx` | Sidebar trái: 13 block types, kéo vào canvas | M |
| LP-04 | Tạo `landing-block-canvas.tsx` | Khu vực giữa, dnd-kit, render block theo `type`, cho phép reorder | L |
| LP-05 | Tạo 13 block render components | Mỗi block 1 component với props từ block data | L |
| LP-06 | Tạo `landing-block-properties.tsx` | Panel phải: form cho properties của block đang chọn, auto-save onChange | L |
| LP-07 | Tạo `landing-page-preview.tsx` | Mở `/lp/[slug]` trong tab mới với dữ liệu từ DB | S |
| LP-08 | Tạo `landing-page-analytics.tsx` | 4 stat card, bar chart views theo ngày (mock), A/B winner badge | M |
| LP-09 | Tạo `landing-page-variants.tsx` | Sub-page để quản lý A/B variants của 1 page | M |
| LP-10 | Public route `/lp/[slug]/page.tsx` | Render blocks theo data, fallback 404 | M |
| LP-11 | Refactor `index.tsx` | 2 view: List / Editor (state `?id=`) | S |
| LP-12 | Wire audit + RBAC | Publish ghi audit, hide nếu không có `landing.publish` | S |

**Definition of Done**:
- ✅ Tạo landing page với 13 block types
- ✅ Drag-drop từ library vào canvas
- ✅ Edit properties cho từng block
- ✅ Reorder blocks bằng drag handle
- ✅ Preview public qua `/lp/[slug]`
- ✅ A/B testing với 2 variant
- ✅ Analytics (mock)

---

# 11. MODULE 9 — USERS / RBAC

## 11.1 Wireframe

```
Users list:
┌─────────────────────────────────────────────────────────────────────┐
│  Người dùng & Phân quyền     [+ Tạo người dùng]                    │
├─────────────────────────────────────────────────────────────────────┤
│  [ Users ] [ Roles ] [ Permissions matrix ]                         │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ ☐ │ Tên        │ Email              │ Role    │ Active │ ⋯ │      │
│  │ ☐ │ Admin A    │ admin@icrclaw.com    │ Super   │ 🟢     │ ⋯ │      │
│  │ ☐ │ LS. Hùng   │ hung@icrclaw.com     │ Lawyer  │ 🟢     │ ⋯ │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘

Roles:
┌─────────────────────────────────────────────────────────────────────┐
│  Roles      [+ Tạo role]                                           │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Tên role        │ Permissions │ Members │ Actions      │      │
│  │ Super Admin     │ * (all)     │ 1       │ Sửa Xóa     │      │
│  │ Admin           │ 15          │ 3       │ Sửa Xóa     │      │
│  │ Lawyer          │ 6           │ 5       │ Sửa Xóa     │      │
│  │ Staff           │ 8           │ 4       │ Sửa Xóa     │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘

Permission matrix:
┌──────────────────────────────────────────────────────────────────────┐
│  Permission Matrix                                                   │
│  ┌──────────────┬──────┬──────┬──────┬──────┐                       │
│  │ Permission   │ Super│ Admin│ Lawyer│ Staff│                       │
│  ├──────────────┼──────┼──────┼──────┼──────┤                       │
│  │ crm.read     │  ☑   │  ☑   │  ☑   │  ☑   │                       │
│  │ crm.write    │  ☑   │  ☑   │  ☑   │  ☐   │                       │
│  │ crm.delete   │  ☑   │  ☑   │  ☐   │  ☐   │                       │
│  │ booking.*    │  ☑   │  ☑   │  ☑   │  ☑   │                       │
│  │ blog.publish │  ☑   │  ☑   │  ☑   │  ☐   │                       │
│  │ …            │      │      │      │      │                       │
│  └──────────────┴──────┴──────┴──────┴──────┘                       │
│  [💾 Lưu]                                                             │
└──────────────────────────────────────────────────────────────────────┘
```

## 11.2 Task list Module 9

| # | Task | Mô tả | Effort |
| :- | :- | :- | :- |
| US-01 | Tạo `users-table.tsx` | DataTable với filter role/status | S |
| US-02 | Tạo `user-form.tsx` | Form CRUD: name, email, role select, isActive, password reset | M |
| US-03 | Tạo `roles-table.tsx` | List roles với member count | S |
| US-04 | Tạo `role-form.tsx` | Form CRUD role với permission multi-select | M |
| US-05 | Tạo `permission-matrix.tsx` | Bảng 2D, batch save | M |
| US-06 | Tạo `impersonate-dialog.tsx` | Confirm dialog "Đăng nhập thay user này?" | S |
| US-07 | Refactor `index.tsx` | 3 tab: Users / Roles / Permission matrix | S |
| US-08 | Wire `useCan()` + `PermissionGate` | Mọi page tích hợp `useCan('crm.write')` để hide action | S |
| US-09 | Mock `useAdminAuth()` | Trả về current user từ store, lưu localStorage, cho impersonate | S |
| US-10 | Wire audit + RBAC | Login/impersonate ghi audit | S |

**Definition of Done**:
- ✅ CRUD users + roles
- ✅ Permission matrix với batch save
- ✅ Impersonate user (super_admin only)
- ✅ `useCan()` + `PermissionGate` cho mọi page

---

# 12. MODULE 10 — SETTINGS + AUDIT LOG

## 12.1 Settings tabs

| Tab | Fields |
| :- | :- |
| **General** | siteName, hotline, email, address, workingHours (start/end/daysOff), timezone, language |
| **Booking** | slotDuration (15/30/60 phút), bookingLeadTime (giờ tối thiểu trước), maxBookingsPerDay, allowOnline, allowPhone, autoConfirm |
| **Email/SMTP** | fromName, fromEmail, replyTo, smtpHost (mock), smtpPort (mock), smtpUser (mock), smtpPassword (mock), useTLS |
| **Theme & Branding** | logo (upload), primaryColor, accentColor, fontFamily, favicon |
| **Integrations** | Sentry DSN, PostHog API key, Google Analytics ID, Chatbot webhook URL |

## 12.2 Audit log viewer

```
┌─────────────────────────────────────────────────────────────────────┐
│  Audit Log         [📥 Export]    Date: [01/05 - 30/05]            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Time     │ User  │ Action          │ Entity    │ Detail  │      │
│  │ 14:30:25 │ Lan   │ lead.create     │ lead#123  │ [+ View]│      │
│  │ 14:28:10 │ Minh  │ lead.update     │ lead#122  │ [+ View]│      │
│  │ 14:25:00 │ Admin │ user.impersonate│ user#5    │ [+ View]│      │
│  └──────────────────────────────────────────────────────────┘      │
│  Click row → drawer hiển thị diff (old → new)                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 12.3 Task list Module 10

| # | Task | Mô tả | Effort |
| :- | :- | :- | :- |
| ST-01 | Tạo `settings-general.tsx` | Form fields theo tab General | S |
| ST-02 | Tạo `settings-booking.tsx` | Form fields theo tab Booking | S |
| ST-03 | Tạo `settings-smtp.tsx` | Form fields theo tab SMTP, validate email format | S |
| ST-04 | Tạo `settings-theme.tsx` | Color picker, font select, logo upload | M |
| ST-05 | Tạo `settings-integrations.tsx` | Form fields theo tab Integrations | S |
| ST-06 | Refactor `index.tsx` | 5 tab: General / Booking / SMTP / Theme / Integrations | S |
| ST-07 | Tạo `audit-logs-table.tsx` | DataTable với filter user/action/entity/date | S |
| ST-08 | Tạo `audit-log-detail.tsx` | Drawer hiển thị diff JSON old → new | S |
| ST-09 | Tạo `audit-export.tsx` | Export CSV/JSON | S |
| ST-10 | Tạo sub-route `/admin/audit` | Audit log page riêng | S |
| ST-11 | Wire mọi mutation → ghiAudit | Update `lib/audit.ts` để tự động ghi từ mọi hook mutation | S |

**Definition of Done**:
- ✅ 5 tab Settings với persistence
- ✅ Audit log viewer với diff
- ✅ Export audit log
- ✅ Mọi mutation ghi audit

---

# 13. NOTIFICATION CENTER

## 13.1 Wireframe

```
Topbar bell:
┌──────────────────────────────────────┐
│  🔔 (3)                              │
│  ┌────────────────────────────────┐  │
│  │ ● Lead mới từ Facebook         │  │
│  │   "Nguyễn Văn A vừa đăng ký"  │  │
│  │   2 phút trước            [×]  │  │
│  ├────────────────────────────────┤  │
│  │ ● Booking sắp diễn ra         │  │
│  │   "14:30 LS. Hùng ↔ Trần B"  │  │
│  │   30 phút trước           [×]  │  │
│  ├────────────────────────────────┤  │
│  │ ○ Review mới 5⭐               │  │
│  │   "Hoàng Minh đánh giá FDI"  │  │
│  │   2 giờ trước            [×]  │  │
│  └────────────────────────────────┘  │
│  [Đánh dấu tất cả đã đọc] [Xem tất cả]│
└──────────────────────────────────────┘
```

## 13.2 Task list Module 13

| # | Task | Mô tả | Effort |
| :- | :- | :- | :- |
| NC-01 | Tạo `notification-center.tsx` | Bell icon + badge count, dropdown panel | M |
| NC-02 | Tạo `notification-item.tsx` | Item với icon, message, time, mark-as-read | S |
| NC-03 | Tạo `notification-list-page.tsx` | `/admin/notifications` full-page list với filter | S |
| NC-04 | Wire auto-generate notifications | Khi lead mới, booking sắp diễn ra, review mới → tạo notification | M |
| NC-05 | Wire channel config | Mỗi notification có `channels: ['in_app', 'email', 'sms']` (mock) | S |

**Definition of Done**:
- ✅ Bell icon + badge + dropdown
- ✅ Auto-generate khi có sự kiện
- ✅ Mark as read / clear all
- ✅ Full-page list

---

# 14. DEFINITION OF DONE (ÁP DỤNG CHUNG MỌI MODULE)

Mỗi module phải đạt **TẤT CẢ** tiêu chí sau trước khi merge:

| # | Tiêu chí | Cách verify |
| :- | :- | :- |
| 1 | **Mock-first** | Refresh browser giữ nguyên state (qua localStorage) |
| 2 | **Type-safe** | `npx tsc --noEmit` exit 0 |
| 3 | **Loading state** | Mỗi page có skeleton khi đang load |
| 4 | **Error state** | ErrorBoundary + nút "Thử lại" |
| 5 | **Empty state** | Có icon + message + CTA thêm mới |
| 6 | **Toast feedback** | Mỗi mutation hiện toast success/error |
| 7 | **Audit log** | Mỗi create/update/delete/status change ghi audit |
| 8 | **RBAC gate** | Ẩn action nếu user không có quyền |
| 9 | **Responsive** | Hoạt động từ 768px trở lên |
| 10 | **Accessibility** | `aria-label` cho icon button, `<th scope>` cho table |
| 11 | **Không emoji** | Chỉ dùng Lucide React |
| 12 | **Không `console.log`** | Tuân thủ coding rule |
| 13 | **Build pass** | `npm run build` exit 0 |
| 14 | **Không vỡ page khác** | Test 12 page admin đều load OK |

---

# 15. LỘ TRÌNH TRIỂN KHAI (12 TUẦN · 1 DEV FULL-TIME)

```
Tuần  Module                Tasks                           Output
─────────────────────────────────────────────────────────────────────────
 1    Foundation (Phase 0)   F-01 → F-20                     20 component/lib
 2    CRM (Phase 1)          CRM-01 → CRM-13                 13 component
 3    Bookings (Phase 2)     BK-01 → BK-10                   10 component
 4    Blog (Phase 3)         BL-01 → BL-13                   13 component
 5    Services & Lawyers     SV-01 → SV-09                    9 component
 6    Reviews + Chatbot      RV-01 → RV-08, CB-01 → CB-08   16 component
 7    Newsletter             NL-01 → NL-11                   11 component
 8    Landing Builder        LP-01 → LP-12                   12 component
 9    Users / RBAC           US-01 → US-10                   10 component
10    Settings + Audit       ST-01 → ST-11                   11 component
11    Notification Center    NC-01 → NC-05                    5 component
12    Polish + Test          DoD checklist toàn bộ, fix bug  -
```

**Effort legend**: S = 0.5 ngày · M = 1–2 ngày · L = 3–5 ngày · XL = 1–2 tuần

---

# 16. RỦI RO & GIẢM THIỂU

| # | Rủi ro | Mức | Giảm thiểu |
| :- | :- | :- | :- |
| 1 | Editor TipTap phức tạp, dễ vỡ, tiêu tốn time | Cao | Prototype sớm tuần 4, có Plan B dùng Markdown editor nếu TipTap fail |
| 2 | Landing Builder kéo thả khó đạt UX mượt | Cao | Dùng `@dnd-kit` đã có kinh nghiệm từ Kanban CRM, MVP trước polish sau |
| 3 | Mock DB lưu localStorage giới hạn ~5–10MB | Trung bình | Hiển thị dung lượng trong Settings, nút "Reset to seed", nén base64 ảnh |
| 4 | Audit log phình to chiếm localStorage | Trung bình | Giữ tối đa 1000 record mới nhất, auto-trim cũ |
| 5 | Permission gate bị sót ở action phụ | Trung bình | Test bằng impersonate user có role thấp, checklist trong DoD |
| 6 | Schedule (publish/send) dùng setInterval không reliable khi tab inactive | Thấp | Khi user focus tab, gọi check ngay 1 lần |
| 7 | Calendar (react-big-calendar) bundle lớn | Thấp | Dynamic import chỉ khi vào tab Calendar |
| 8 | TanStack Query chưa cài trong package.json | Thấp | Verify ở F-03, cài `npm i @tanstack/react-query` nếu thiếu |

---

# 17. PHỤ LỤC — TYPES MỚI BỔ SUNG

Tất cả thêm vào `src/features/admin/types/index.ts` (mở rộng file hiện tại, không thay đổi types cũ).

## 17.1 CRM extensions

```ts
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

export interface LeadAssignment {
  leadId: string;
  assignedToId: string;
  assignedToName: string;
  assignedById: string;
  assignedByName: string;
  assignedAt: string;
}
```

## 17.2 Bookings extensions

```ts
export type BookingReminder = {
  type: '24h' | '2h' | '30min';
  scheduledAt: string; // ISO
  sent: boolean;
  sentAt?: string;
  channel: 'email' | 'sms' | 'in_app';
};

export interface BookingSlot {
  lawyerId: string;
  lawyerName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isBooked: boolean;
  bookingId?: string;
}

export interface BookingHistoryEntry {
  id: string;
  bookingId: string;
  type: 'create' | 'update' | 'cancel' | 'reschedule' | 'complete' | 'reminder_sent';
  fromValue?: string;
  toValue?: string;
  reason?: string;
  actorId: string;
  actorName: string;
  createdAt: string;
}
```

## 17.3 Blog extensions

```ts
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  createdAt: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color: string; // hex
  postCount: number;
}

export interface BlogRevision {
  id: string;
  postId: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface BlogSEO {
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
  canonicalUrl?: string;
  noindex: boolean;
}
```

## 17.4 Reviews extensions

```ts
export interface ReviewReply {
  content: string;
  repliedById: string;
  repliedByName: string;
  repliedAt: string;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other';
  description?: string;
  reportedByName: string;
  reportedByEmail?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}
```

## 17.5 Chatbot extensions

```ts
export interface ChatbotIntent {
  id: string;
  name: string;
  description: string;
  sampleUtterances: string[];
  responseTemplate: string;
  handoffToLawyerId?: string;
  handoffToLawyerName?: string;
  isActive: boolean;
  matchCount: number;
  createdAt: string;
  updatedAt: string;
}
```

## 17.6 Newsletter extensions

```ts
export interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSegment {
  id: string;
  name: string;
  filter: {
    subscribedAfter?: string;
    subscribedBefore?: string;
    source?: string;
    tags?: string[];
  };
  subscriberCount: number;
}
```

## 17.7 Landing Builder types

```ts
export type LandingBlockType =
  | 'hero' | 'text' | 'image' | 'cta' | 'lead-form'
  | 'testimonials' | 'pricing' | 'reviews' | 'faq'
  | 'news' | 'lawyers' | 'map' | 'contact';

export interface LandingBlock {
  id: string;
  type: LandingBlockType;
  order: number;
  props: Record<string, unknown>; // Type-specific
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  targetAudience: 'enterprise' | 'individual' | 'fdi' | 'all';
  status: 'draft' | 'published' | 'archived';
  isVariant: boolean;
  parentPageId?: string; // for A/B variants
  variantLabel?: 'A' | 'B';
  blocks: LandingBlock[];
  seo: BlogSEO;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageAnalytics {
  pageId: string;
  date: string; // YYYY-MM-DD
  views: number;
  uniqueVisitors: number;
  conversions: number;
  ctaClicks: number;
  bounceRate: number; // 0..1
}
```

## 17.8 RBAC + Audit + Notification types

```ts
export type Permission =
  | 'crm.read' | 'crm.write' | 'crm.delete'
  | 'booking.read' | 'booking.write' | 'booking.delete'
  | 'blog.read' | 'blog.write' | 'blog.publish' | 'blog.delete'
  | 'services.read' | 'services.write' | 'services.delete'
  | 'lawyers.read' | 'lawyers.write' | 'lawyers.delete'
  | 'reviews.read' | 'reviews.moderate' | 'reviews.reply'
  | 'chatbot.read' | 'chatbot.train' | 'chatbot.handoff'
  | 'newsletter.read' | 'newsletter.write' | 'newsletter.send'
  | 'landing.read' | 'landing.write' | 'landing.publish'
  | 'users.read' | 'users.write' | 'users.impersonate'
  | 'settings.read' | 'settings.write'
  | 'audit.read';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean; // super_admin không thể xóa
  memberCount: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'login' | 'logout' | 'impersonate' | 'assign' | 'publish' | 'send' | 'export';
  entity: string; // 'lead' | 'booking' | 'post' | ...
  entityId: string;
  entityLabel?: string; // human-readable, vd tên lead
  diff?: { before: Record<string, unknown>; after: Record<string, unknown> };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export type NotificationChannel = 'in_app' | 'email' | 'sms';

export interface Notification {
  id: string;
  type: 'lead_new' | 'booking_upcoming' | 'booking_cancelled' | 'review_new' | 'campaign_sent' | 'system';
  title: string;
  message: string;
  link?: string;
  icon: string; // Lucide icon name
  channels: NotificationChannel[];
  read: boolean;
  readAt?: string;
  metadata?: Record<string, string | number>;
  createdAt: string;
}
```

## 17.9 Settings extensions

```ts
export interface EmailSettings {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string; // masked
  useTLS: boolean;
}

export interface ThemeSettings {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: 'inter' | 'roboto' | 'plus-jakarta' | 'cormorant';
}

export interface IntegrationSettings {
  sentryDsn: string;
  posthogApiKey: string;
  posthogHost: string;
  gaTrackingId: string;
  chatbotWebhookUrl: string;
}
```

## 17.10 Lawyers extensions

```ts
export interface LawyerSchedule {
  id: string;
  lawyerId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun
  slots: { start: string; end: string; }[]; // [{ "08:00", "12:00" }, { "13:00", "17:00" }]
  isOff: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}
```

## 17.11 Audit constants

```ts
export const AUDIT_ACTIONS = [
  'create', 'update', 'delete', 'status_change', 'login', 'logout',
  'impersonate', 'assign', 'publish', 'send', 'export', 'restore', 'cancel',
] as const;

export const AUDIT_ENTITIES = [
  'lead', 'booking', 'post', 'service', 'lawyer', 'review',
  'chatbot_session', 'subscriber', 'campaign', 'user', 'role',
  'landing_page', 'notification', 'settings',
] as const;
```

---

# 📋 CHECKLIST KHI BẮT ĐẦU

Trước khi code module đầu tiên (Foundation), verify:

- [ ] `package.json` đã có `@tanstack/react-query` (nếu chưa, cài `npm i @tanstack/react-query`)
- [ ] `package.json` đã có `papaparse` + `@types/papaparse` (cài nếu thiếu)
- [ ] `package.json` đã có `react-big-calendar` + `@types/react-big-calendar` (cài khi làm Module 2)
- [ ] `package.json` đã có `date-fns` (cài nếu thiếu)
- [ ] `package.json` đã có `@tiptap/react` + 4 extension (cài khi làm Module 3)
- [ ] `package.json` đã có `zod`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, `zustand`, `recharts` (đa số đã có, verify)
- [ ] `package.json` đã có `@dnd-kit/core`, `@dnd-kit/sortable` (đã có, dùng cho CRM Kanban + Landing)
- [ ] `npx tsc --noEmit` hiện exit 0
- [ ] `npm run build` hiện exit 0

Sau khi verify xong, bắt đầu từ task **F-01** trong §02.
