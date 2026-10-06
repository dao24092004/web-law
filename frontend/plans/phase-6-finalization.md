# Phase 6: Finalization — Đóng gói hệ thống theo 100% demo

> **Mục tiêu**: Hoàn thành 4 trang public còn thiếu (services, lawyers, news, contact), nâng cấp 3 trang cũ lên 100% UI fidelity, tích hợp Storybook/E2E/Sentry/PostHog, polish SEO & performance, đảm bảo ship-ready.
>
> **UI Reference**: `frontend/demo/*.html` (7 files)
>
> **Status hiện tại**:
> - ✅ Phase 1–5 hoàn thành (foundation, public home, booking, chatbot, admin)
> - ❌ 4 trang public CHƯA CÓ route: `/services`, `/lawyers`, `/news`, `/contact`
> - ⚠️ 3 trang có sẵn cần audit lại UI fidelity: `/`, `/booking`, `/login`
> - ⚠️ Thiếu: TipTap rich editor, Recharts thay SVG, TanStack Table, Storybook, Playwright, Sentry, PostHog, next-intl

## Phase 6.5 — Dashboard → Backend Wiring

> Trang `/admin/dashboard` đã migrate sang BRS backend (`/api/admin/dashboard/*`).
>
> **Trạng thái**:
> - ✅ Backend: fix bug 500 `/stats/range` (ReviewStatus enum mismatch)
> - ✅ Frontend: 6 hook query mới trong `use-dashboard-stats.ts` (stats, visitors, service-distribution, lead-funnel, revenue, activity) với fallback MockDB qua flag `NEXT_PUBLIC_DASHBOARD_USE_MOCK`
> - ✅ Multi-module Kanban (Lead / Booking / Review) với tabs chuyển panel
> - ✅ Export CSV gọi thẳng backend `/admin/dashboard/export/csv`, fallback client-side
> - ✅ Refresh button invalidate cả `['admin', 'dashboard']` queries
>
> **Sau UAT** sẽ xóa fallback path và collection `audit_logs` mock nếu không dùng nơi khác.

---

# MỤC LỤC

| # | Section | Mô tả |
| :- | :- | :- |
| 01 | Tổng quan phạm vi | 8 nhóm công việc, ước lượng effort |
| 02 | Audit UI fidelity | So sánh từng demo ↔ code hiện tại |
| 03 | 4 Public Pages còn thiếu | services, lawyers, news, contact |
| 04 | 3 Public Pages cần polish | home, booking, login |
| 05 | Admin Advanced | TipTap, Recharts, dnd-kit, TanStack Table |
| 06 | Auth & RBAC | middleware, role guards, forgot/reset |
| 07 | i18n + SEO | next-intl, metadata, sitemap, hreflang |
| 08 | Observability | Sentry, PostHog, Web Vitals |
| 09 | Testing | Storybook, Playwright, Chromatic |
| 10 | Performance | bundle audit, dynamic imports, image opt |
| 11 | Deployment | CI/CD, env vars, smoke test |
| 12 | Definition of Done | Acceptance checklist |
| 13 | Execution Order | 9 ngày có thứ tự dependency |

---

# 01. TỔNG QUAN PHẠM VI

## 1.1 Phạm vi tổng thể

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  PHASE 6 — 9 STREAMS SONG SONG                              │
│                                                                          │
│  A. 4 Public Pages Mới (services, lawyers, news, contact)              │
│  B. 3 Public Pages Polish (home, booking, login)                       │
│  C. Admin Advanced (TipTap, Recharts, dnd-kit, TanStack Table)        │
│  D. Auth & RBAC Middleware (admin route guards)                        │
│  E. i18n + SEO (next-intl, sitemap, hreflang, structured data)        │
│  F. Observability (Sentry, PostHog, Web Vitals)                        │
│  G. Testing (Storybook, Playwright, Chromatic)                         │
│  H. Performance (bundle audit, dynamic import, image opt)              │
│  I. Deployment (CI/CD, smoke test, env vars)                           │
│                                                                          │
│  Total effort: 7–9 working days                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Ưu tiên rủi ro

| Stream | Risk | Lý do | Buffer |
| :- | :- | :- | :- |
| A — 4 public pages | LOW | Pattern đã có ở home, copy 1-1 | 0.5 day |
| B — public polish | MEDIUM | UI fidelity 100% là subjective | 1 day |
| C — admin advanced | HIGH | 4 thư viện mới (TipTap, Recharts, dnd-kit, TanStack Table) | 1.5 day |
| D — auth/RBAC | HIGH | Ảnh hưởng mọi admin route | 1 day |
| E — i18n + SEO | MEDIUM | next-intl phải wrap cả app | 0.5 day |
| F — observability | LOW | Sentry SDK + PostHog snippet | 0.5 day |
| G — testing | MEDIUM | Playwright phải chạy được CI | 1 day |
| H — performance | LOW | Đo rồi fix từng bottleneck | 0.5 day |
| I — deployment | LOW | Đã có Next.js build | 0.5 day |

---

# 02. AUDIT UI FIDELITY

## 2.1 Bảng so sánh demo ↔ code hiện tại

| `/` (home) | `src/app/page.tsx` + `src/features/home/` | **~95%** (hero, 6 services, 3 stats, 6 why-items, lawyers, testimonials, news, FAQ, contact, footer — đã đối chiếu phase-6 §4.1; stats bar đã sửa khớp demo 2000+/98%/15+) | ✅ Done |
| `services.html` | `src/app/(public)/services/page.tsx` | ~85% (route xong, cần audit UI fidelity) | A — Polish |
| `lawyers.html` | `src/app/(public)/lawyers/page.tsx` | ~85% (route xong, cần audit UI fidelity) | A — Polish |
| `booking.html` | `src/app/(public)/booking/page.tsx` | **~95%** (4-step wizard, hero, progress, service grid, lawyer section, datetime, info, confirmation, footer, slot timer) | ✅ Done |
| `contact.html` | `src/app/(public)/contact/page.tsx` | ~85% (route xong, cần audit UI fidelity) | A — Polish |
| `news.html` | `src/app/(public)/news/page.tsx` | ~85% (route xong, cần audit UI fidelity) | A — Polish |
| `login.html` | `src/app/(auth)/login/page.tsx` | **~95%** (refactored 2-cột: image/branding left + form right; remember me, forgot link, Google/Facebook buttons) | ✅ Done |
| `admin.html` | `src/app/(admin)/*` | ~95% (đã xong phase 5) | C — Thư viện nâng cấp |

> **Stream B — 3 Public Pages Polish: HOÀN THÀNH (2026-06-16)**
> - ✅ Home: 9 sections theo §4.1, stats bar số liệu khớp demo
> - ✅ Booking: 4-step wizard + slot timer + hero/footer
> - ✅ Login: 2-cột, social login, remember me, forgot link
> - Tiếp theo: Polish UI 100% các trang services/lawyers/news/contact (Stream A)

## 2.2 Pages KHÔNG có route cần tạo

```
URL                  File demo             Độ ưu tiên
/services            services.html         P0
/lawyers             lawyers.html          P0
/news                news.html             P0
/contact             contact.html          P0
/news/[slug]         (article detail)      P1
/lawyers/[id]        (lawyer profile)      P1
/services/[slug]     (service detail)      P2
```

---

# 03. STREAM A — 4 PUBLIC PAGES MỚI

> **Nguyên tắc chung**: Mỗi page có:
> - `<PublicLayout>` từ `src/components/layout` (navbar + footer)
> - Server Component cho SEO metadata
> - Client Component chỉ cho phần tương tác (filter, search, pagination)
> - Hero section + main content + sidebar (nếu có)
> - 100% UI clone từ demo HTML
> - Responsive 100% (768px, 1024px, 1200px breakpoints)

## 3.1 `/services` — Dịch vụ pháp lý

### Tham chiếu demo
- `services.html` (2000+ dòng) — page hero, filter tabs, services grid (3 cols), process timeline, FAQ, CTA

### Cấu trúc thư mục

```
src/features/services/
├── types/index.ts                  # Service, ServiceCategory, ProcessStep, FAQ
├── data/services-data.ts           # Mock data 6 services + categories
├── components/
│   ├── services-hero.tsx           # SC: hero + breadcrumb
│   ├── services-filter-tabs.tsx    # CC: sticky filter bar
│   ├── services-grid.tsx           # SC: 3-col grid wrapper
│   ├── service-card.tsx            # SC: card với hover effects
│   ├── process-timeline.tsx        # SC: 4-step process với connector
│   ├── services-faq.tsx            # CC: accordion
│   ├── services-cta.tsx            # SC: CTA box
│   └── index.ts
├── hooks/use-service-filter.ts     # Filter state
├── index.ts
└── pages/services/index.tsx        # Page composition
```

### File: `src/app/services/page.tsx`
```tsx
import type { Metadata } from 'next';
import { ServicesPage } from '@/features/services';

export const metadata: Metadata = {
  title: 'Dịch Vụ Pháp Lý | ICRC Law',
  description: 'Đầy đủ các dịch vụ pháp lý: thành lập doanh nghiệp, tư vấn hợp đồng, ly hôn, sở hữu trí tuệ, mua bán bất động sản...',
  openGraph: { /* ... */ },
};

export default function Page() { return <ServicesPage />; }
```

### Demo class → React component mapping

| Demo class | Component | Loại |
| :- | :- | :- |
| `.page-hero` | `services-hero` | SC |
| `.filter-section` + `.filter-tabs` | `services-filter-tabs` | CC |
| `.services-grid` | `services-grid` | SC |
| `.service-card` | `service-card` | SC |
| `.process-timeline` + `.process-step` | `process-timeline` | SC |
| `.faq` + `.faq-item` | `services-faq` | CC |
| `.cta-box` | `services-cta` | SC |

### Data shape

```typescript
export interface Service {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ServiceCategory;
  price: number;
  duration: string;
  icon: string;        // Font Awesome class
  color: string;       // primary | accent | green | red | blue | purple
  features: string[];
  popular?: boolean;
}

export type ServiceCategory = 'doanh-nghiep' | 'dan-su' | 'hinh-su' | 'dat-dai' | 'hon-nhan' | 'so-huu-tri-tue';

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}
```

### CSS bổ sung cần thêm vào `globals.css`

```css
/* Service grid + card */
.services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.service-card { /* ... theo demo ... */ }

/* Process timeline với connector line */
.process-timeline { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; position: relative; }
.process-timeline::before { /* horizontal line */ }
.process-step { position: relative; z-index: 1; }
.process-step__num { /* circle với gradient */ }

/* Filter tabs sticky */
.filter-section { position: sticky; top: 72px; z-index: 100; }
```

### Definition of Done — Services

- [ ] Route `/services` render đúng 100% UI như demo
- [ ] 6 services trong grid, click filter chuyển tab đúng
- [ ] 4 process steps với connector line ngang
- [ ] FAQ accordion expand/collapse mượt
- [ ] CTA box ở cuối section
- [ ] Responsive: 3 cols → 2 cols (≤1024px) → 1 col (≤768px)
- [ ] Hover effects giống demo (icon scale, button gap)
- [ ] Metadata SEO đầy đủ

---

## 3.2 `/lawyers` — Đội ngũ luật sư

### Tham chiếu demo
- `lawyers.html` (2500+ dòng) — hero, filter chips, lawyers grid (cards với rating, tags, experience), modal profile, stats counter

### Cấu trúc thư mục

```
src/features/lawyers/
├── types/index.ts                  # Lawyer, LawyerSpecialty, RatingStats
├── data/lawyers-data.ts            # Mock 6 lawyers
├── components/
│   ├── lawyers-hero.tsx
│   ├── lawyers-filter-chips.tsx    # CC: tags filter
│   ├── lawyers-stats.tsx           # SC: stats counter (clients, cases, years)
│   ├── lawyers-grid.tsx
│   ├── lawyer-card.tsx             # SC: avatar, stars, tags, meta
│   ├── lawyer-profile-modal.tsx    # CC: full profile modal
│   └── index.ts
├── hooks/use-lawyer-filter.ts
├── index.ts
└── pages/lawyers/index.tsx
```

### Demo class → React component mapping

| Demo class | Component | Loại |
| :- | :- | :- |
| `.lawyers-hero` | `lawyers-hero` | SC |
| `.filter-chips` | `lawyers-filter-chips` | CC |
| `.lawyers-stats` | `lawyers-stats` | SC |
| `.lawyers-grid` | `lawyers-grid` | SC |
| `.lawyer-card` | `lawyer-card` | SC |
| `.lawyer-modal` | `lawyer-profile-modal` | CC |

### Data shape

```typescript
export interface Lawyer {
  id: string;
  slug: string;
  name: string;
  position: string;        // Trưởng VP, Phó TP, Cộng sự cao cấp, Cộng sự
  bio: string;
  avatar?: string;         // URL ảnh
  initials: string;        // fallback cho avatar placeholder
  avatarColor: string;     // gradient
  specialties: string[];
  experience: number;      // năm
  successfulCases: number;
  rating: number;          // 0-5
  reviewCount: number;
  degree: string;
  email: string;
  phone: string;
  languages: string[];
  isVerified: boolean;
}
```

### CSS bổ sung cần thêm

```css
/* Lawyer card */
.lawyer-card { background: white; border-radius: 16px; padding: 28px 24px; text-align: center; }
.lawyer-avatar-wrap { width: 100px; height: 100px; margin: 0 auto 16px; position: relative; }
.lawyer-avatar-placeholder { /* gradient circle với initials */ }
.lawyer-verified { /* check badge absolute */ }
.lawyer-stars { display: flex; justify-content: center; gap: 2px; color: #F59E0B; }

/* Stats counter */
.lawyers-stats { display: grid; grid-template-columns: repeat(4, 1fr); }

/* Filter chips */
.filter-chip { padding: 6px 16px; border-radius: 9999px; border: 1.5px solid; cursor: pointer; }
.filter-chip.active { background: var(--primary); color: white; }
```

### Definition of Done — Lawyers

- [ ] Route `/lawyers` render đúng 100% UI demo
- [ ] 6+ lawyer cards với avatar placeholder gradient
- [ ] Click chip filter lọc đúng
- [ ] Modal profile mở với full bio + contact
- [ ] Stats counter ở hero (clients, cases, years, success rate)
- [ ] Responsive: 3 cols → 2 cols → 1 col
- [ ] Hover effect lift card

---

## 3.3 `/news` — Kiến thức pháp luật

### Tham chiếu demo
- `news.html` (2200+ dòng) — hero search, featured article (1 main + 3 side), filter tabs, article cards horizontal, sidebar (search, categories, popular, tags, newsletter, CTA), pagination, article detail view

### Cấu trúc thư mục

```
src/features/news/
├── types/index.ts
├── data/news-data.ts                # 12 articles + categories
├── components/
│   ├── news-hero.tsx                # CC: search box
│   ├── news-featured.tsx            # SC: 1 main + 3 side
│   ├── news-filter-tabs.tsx
│   ├── news-grid.tsx
│   ├── article-card.tsx             # SC: horizontal card
│   ├── news-sidebar.tsx
│   ├── sidebar-search.tsx
│   ├── sidebar-categories.tsx
│   ├── sidebar-popular.tsx
│   ├── sidebar-tags.tsx
│   ├── sidebar-newsletter.tsx
│   ├── sidebar-cta.tsx
│   ├── article-detail.tsx           # SC: full article view
│   ├── article-toc.tsx              # CC: table of contents
│   ├── article-content.tsx          # SC: rich content renderer
│   ├── article-share.tsx            # CC: social share
│   ├── article-comments.tsx         # CC: comments section
│   ├── news-pagination.tsx
│   └── index.ts
├── hooks/use-news-filter.ts
├── index.ts
└── pages/news/index.tsx
```

### Demo class → React component mapping

| Demo class | Component | Loại |
| :- | :- | :- |
| `.page-header` + `.header-search` | `news-hero` | CC |
| `.featured` + `.featured__main` | `news-featured` | SC |
| `.filter-tabs` | `news-filter-tabs` | CC |
| `.article-card` | `article-card` | SC |
| `.sidebar` + `.sidebar-search` | `sidebar-search` | CC |
| `.cat-list` | `sidebar-categories` | SC |
| `.popular-list` | `sidebar-popular` | SC |
| `.tags-cloud` | `sidebar-tags` | SC |
| `.newsletter-box` | `sidebar-newsletter` | CC |
| `.cta-box` | `sidebar-cta` | SC |
| `.article-detail` | `article-detail` | SC |
| `.toc` | `article-toc` | CC |
| `.pagination` | `news-pagination` | CC |

### Data shape

```typescript
export type NewsCategory = 'tin-tuc' | 'nghi-dinh' | 'blog' | 'case-study' | 'huong-dan';

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;             // HTML
  category: NewsCategory;
  tags: string[];
  author: { name: string; initials: string; avatarColor: string };
  thumbnail?: string;
  publishedAt: string;
  readingTime: number;         // minutes
  views: number;
  isHot?: boolean;
  isFeatured?: boolean;
  toc?: { id: string; text: string }[];
}
```

### CSS bổ sung cần thêm

```css
/* Featured layout */
.featured__inner { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; }
.featured__main { position: relative; min-height: 420px; border-radius: 16px; overflow: hidden; }
.featured__overlay { background: linear-gradient(to top, rgba(10,20,35,0.92), transparent); }

/* Article card horizontal */
.article-card { display: flex; gap: 20px; padding: 20px 0; border-bottom: 1px solid gray-100; }
.article-card__thumb { width: 160px; height: 120px; flex-shrink: 0; }

/* Sidebar widgets */
.sidebar { position: sticky; top: 88px; }
.sidebar-widget { background: gray-50; border-radius: 16px; padding: 24px; }

/* TOC */
.toc { background: gray-50; border-left: 3px solid accent; padding: 20px; }

/* Category badge variants */
.cat-news { background: blue-bg; color: blue; }
.cat-decree { background: yellow-bg; color: yellow; }
.cat-blog { background: primary-faint; color: primary; }
.cat-case { background: green-bg; color: green; }
.cat-guide { background: purple-bg; color: purple; }
```

### Definition of Done — News

- [ ] Route `/news` render đúng 100% UI demo
- [ ] Featured section với 1 main + 3 side items
- [ ] 6+ article cards horizontal với thumbnail, badge, title, excerpt, author
- [ ] Sidebar: search, categories, popular, tags, newsletter, CTA
- [ ] Filter tabs lọc theo category
- [ ] Pagination phân trang
- [ ] Click article mở detail view (scroll hoặc route)
- [ ] Article detail: breadcrumb, title, meta, TOC, content, share, related
- [ ] Newsletter form validate + submit
- [ ] Responsive

---

## 3.4 `/contact` — Liên hệ

### Tham chiếu demo
- `contact.html` (1300+ dòng) — page header, contact grid (info cards left + form right), quick buttons, FAQ section, map embed, social

### Cấu trúc thư mục

```
src/features/contact/
├── types/index.ts                  # ContactInfo, ContactForm, FAQ
├── data/contact-data.ts            # Office info, FAQ
├── components/
│   ├── contact-hero.tsx
│   ├── contact-grid.tsx            # 2-col grid
│   ├── contact-info-list.tsx       # SC: 4 info cards
│   ├── contact-info-card.tsx
│   ├── contact-quick-btns.tsx
│   ├── contact-form.tsx            # CC: form với RHF + Zod
│   ├── contact-map.tsx             # SC: Google Maps embed
│   ├── contact-faq.tsx             # CC: accordion
│   ├── contact-social.tsx          # SC: social icons
│   └── index.ts
├── hooks/use-contact-form.ts       # RHF + Zod validation
├── index.ts
└── pages/contact/index.tsx
```

### Demo class → React component mapping

| Demo class | Component | Loại |
| :- | :- | :- |
| `.page-header` | `contact-hero` | SC |
| `.contact-grid` | `contact-grid` | SC |
| `.info-card` | `contact-info-card` | SC |
| `.quick-btns` | `contact-quick-btns` | SC |
| `.contact-form` | `contact-form` | CC |
| `.contact-map` | `contact-map` | SC |
| `.contact-faq` | `contact-faq` | CC |

### Data shape

```typescript
export interface OfficeInfo {
  type: 'address' | 'phone' | 'email' | 'hours';
  icon: string;          // Font Awesome
  label: string;
  value: string;
  sub?: string;
}

export interface ContactFormValues {
  name: string;          // min 2 chars
  email: string;         // valid email
  phone: string;         // Vietnamese phone
  subject: string;       // min 5 chars
  message: string;       // min 20 chars
  agreeTerms: boolean;   // must be true
}
```

### Form validation (Zod)

```typescript
const contactSchema = z.object({
  name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ'),
  subject: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự'),
  message: z.string().min(20, 'Nội dung phải có ít nhất 20 ký tự'),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'Bạn phải đồng ý điều khoản' }) }),
});
```

### CSS bổ sung cần thêm

```css
/* Contact grid */
.contact-grid { display: grid; grid-template-columns: 42% 1fr; gap: 40px; align-items: start; }
.info-card { background: white; border-radius: 12px; padding: 18px 20px; display: flex; gap: 14px; }
.info-card:hover { transform: translateX(4px); box-shadow: var(--shadow-sm); }
.info-card__icon { width: 42px; height: 42px; background: var(--primary-faint); color: var(--primary); border-radius: 8px; }

/* Quick buttons */
.quick-btn { padding: 10px 18px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 7px; }
.quick-btn--zalo { background: #0068FF; color: white; }
.quick-btn--phone { background: var(--primary); color: white; }
.quick-btn--messenger { background: #0084FF; color: white; }

/* Map iframe wrapper */
.contact-map { border-radius: 16px; overflow: hidden; }
```

### Definition of Done — Contact

- [ ] Route `/contact` render đúng 100% UI demo
- [ ] 4 info cards (address, phone, email, hours) với hover effect
- [ ] Quick buttons: Zalo, Phone, Messenger
- [ ] Contact form với RHF + Zod validation
- [ ] FAQ accordion 4-6 câu
- [ ] Google Maps embed
- [ ] Social icons (FB, LinkedIn, YouTube, Zalo)
- [ ] Submit form gọi `POST /api/contact` (MSW mock)
- [ ] Toast success/error
- [ ] Responsive: 1 col (≤768px)

---

# 04. STREAM B — 3 PUBLIC PAGES POLISH

## 4.1 `/` Home

### Audit checklist
- [ ] Hero section với title animation
- [ ] 6 services grid
- [ ] 4 stats counter (years, cases, lawyers, clients)
- [ ] About section với image
- [ ] 3-4 lawyers featured
- [ ] Testimonials carousel
- [ ] FAQ accordion
- [ ] CTA section
- [ ] Footer với 4 columns

### So sánh với `index.html`
- [ ] Đối chiếu từng section, sửa CSS/JSX
- [ ] Đảm bảo animation xuất hiện đúng
- [ ] Lazy load ảnh
- [ ] Counter animation chạy khi scroll vào viewport

## 4.2 `/booking`

### Audit checklist
- [ ] 4-step wizard render đúng
- [ ] Service cards grid
- [ ] Lawyer selection với avatar
- [ ] Date picker + time slots
- [ ] Form fields với validation
- [ ] Confirmation page với success animation
- [ ] Mobile responsive

### So sánh với `booking.html`
- [ ] Đối chiếu hero header
- [ ] Service cards hover
- [ ] Calendar widget giống demo
- [ ] Time slot grid 6 cols desktop / 3 cols mobile

## 4.3 `/login`

### Audit checklist
- [ ] Form 2 cột (image left + form right)
- [ ] Email + password validation
- [ ] Remember me + forgot password link
- [ ] Social login buttons (Google, Facebook)
- [ ] Loading state khi submit
- [ ] Error state cho wrong credentials
- [ ] Responsive: stack vertical trên mobile

---

# 05. STREAM C — ADMIN ADVANCED

## 5.1 TipTap Rich Editor (Blog)

### Dependencies
```bash
npm i @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder
```

### File: `src/features/blog/components/rich-editor.tsx`
```typescript
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Image, Link, Placeholder.configure({ placeholder })],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Toolbar buttons
- Bold, Italic, Strike
- H1, H2, H3
- Bullet list, Ordered list
- Blockquote, Code block
- Link, Image upload
- Undo, Redo

### Integration
- Replace text placeholder trong `blog/index.tsx` (modal editor)
- Auto-save draft mỗi 30s vào `sessionStorage`
- Image upload qua `uploadPostImage` API

## 5.2 Recharts (Thay SVG tay)

### Dependencies
```bash
npm i recharts
```

### Refactor `dashboard/index.tsx`
- Replace `LineChart` với `<LineChart>` của Recharts
- Replace `DonutChart` với `<PieChart>` của Recharts
- Add tooltip, legend, responsive container
- Cùng data shape, cùng màu

### Refactor CRM (optional)
- Lead conversion funnel chart
- Source distribution chart

## 5.3 dnd-kit (Kanban)

### Dependencies
```bash
npm i @dnd-kit/core @dnd-kit/sortable
```

### File: `src/features/crm/components/lead-kanban.tsx`
- 4 columns: Mới, Đã liên hệ, Đang xử lý, Hoàn tất
- Drag & drop giữa columns
- Update status lên server optimistic
- Visual feedback khi drag (opacity, ring)
- Dùng Zustand store cho kanban state

### Integration
- Add Kanban tab vào CRM page (toggle Table ↔ Kanban)
- Admin dashboard đã có Kanban mock → refactor dùng dnd-kit

## 5.4 TanStack Table

### Dependencies
```bash
npm i @tanstack/react-table
```

### File: `src/features/admin/shared/components/data-table.tsx`
- Generic DataTable nhận `columns` + `data`
- Built-in sort, filter, pagination
- Selection (row + select all)
- Replace inline `<table>` trong CRM, Bookings, Users, Newsletter

### Acceptance
- [ ] Cùng UI như hiện tại (admin table style)
- [ ] Sort click header
- [ ] Pagination hoạt động
- [ ] Row selection state qua Zustand

---

# 06. STREAM D — AUTH & RBAC

## 6.1 RBAC Middleware cho Admin

### File: `src/middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url));
    }

    if (!['admin', 'super_admin', 'lawyer', 'staff'].includes(token.role as string)) {
      return NextResponse.redirect(new URL('/403', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
```

### File: `src/app/403/page.tsx`
- Friendly 403 page với CTA "Về trang chủ"

## 6.2 Permission Matrix (Hardcode)

```typescript
// src/features/auth/permissions.ts
export const PERMISSIONS = {
  'admin.users': ['super_admin'],
  'admin.settings': ['super_admin'],
  'admin.landing_pages': ['super_admin', 'admin'],
  'admin.blog': ['super_admin', 'admin', 'lawyer'],
  'admin.crm': ['super_admin', 'admin', 'staff'],
  'admin.bookings': ['super_admin', 'admin', 'lawyer', 'staff'],
  'admin.chatbot': ['super_admin', 'admin'],
  'admin.services': ['super_admin', 'admin'],
  'admin.reviews': ['super_admin', 'admin', 'staff'],
  'admin.newsletter': ['super_admin', 'admin', 'staff'],
} as const;
```

## 6.3 Forgot / Reset Password Pages

### Routes
- `/forgot-password` — nhập email
- `/reset-password?token=...` — đặt mật khẩu mới

### Files
- `src/app/forgot-password/page.tsx` — SC wrapper
- `src/features/auth/components/forgot-password-form.tsx` — CC
- `src/app/reset-password/page.tsx`
- `src/features/auth/components/reset-password-form.tsx`
- `src/features/auth/api/auth-api.ts` — add `forgotPassword`, `resetPassword`

## 6.4 Error Boundary cho Admin

### File: `src/app/(admin)/error.tsx`
```typescript
'use client';
export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="admin-error">
      <h2>Có lỗi xảy ra trong trang quản trị</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Thử lại</button>
    </div>
  );
}
```

---

# 07. STREAM E — I18N + SEO

## 7.1 next-intl Setup

### Dependencies
```bash
npm i next-intl
```

### Files
- `src/i18n/request.ts` — get locale from request
- `src/i18n/routing.ts` — define locales (vi, en)
- `src/middleware.ts` — add i18n routing (merge with RBAC)
- `messages/vi.json` + `messages/en.json` — translations

### Translation scope (ưu tiên cao)
- Navbar, Footer, Hero, Booking, Chatbot, Auth forms
- Admin sidebar, common buttons, errors

## 7.2 SEO Metadata

### Per page
- `generateMetadata()` cho mỗi route public
- Open Graph image (use default or per-page)
- Twitter Card
- Canonical URL
- `robots.txt`, `sitemap.xml`

### Structured Data (JSON-LD)
- Organization schema trên `/`
- Service schema trên `/services`
- Person schema trên `/lawyers/[id]`
- Article schema trên `/news/[slug]`
- FAQPage schema trên FAQ section

### Sitemap
```typescript
// src/app/sitemap.ts
export default async function sitemap() {
  return [
    { url: 'https://icrclaw.com/', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://icrclaw.com/services', changeFrequency: 'weekly', priority: 0.9 },
    // ... dynamic từ DB
  ];
}
```

---

# 08. STREAM F — OBSERVABILITY

## 8.1 Sentry

### Dependencies
```bash
npm i @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Config
- `sentry.client.config.ts` — browser init
- `sentry.server.config.ts` — server init
- `sentry.edge.config.ts` — edge runtime
- Wrap Next.js config: `withSentryConfig(nextConfig)`

### What to track
- JS errors ở client
- API errors (4xx, 5xx)
- Unhandled promise rejection
- Web Vitals (LCP, FID, CLS)
- Hydration mismatches

## 8.2 PostHog

### Dependencies
```bash
npm i posthog-js
```

### File: `src/lib/analytics/posthog.tsx`
```typescript
'use client';
import posthog from 'posthog-js';
import { useEffect } from 'react';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return children;
}

export function usePostHog() {
  const track = (event: string, props?: Record<string, unknown>) => {
    posthog.capture(event, props);
  };
  return { track };
}
```

### Funnels to track
- `landing_viewed` → `cta_clicked` → `booking_started` → `booking_completed`
- `chatbot_opened` → `message_sent` → `lead_captured` → `handoff_to_booking`
- `service_viewed` → `lawyer_viewed` → `booked`

## 8.3 Web Vitals

### File: `src/lib/analytics/web-vitals.ts`
```typescript
'use client';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import { sendToAnalytics } from './posthog';

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

---

# 09. STREAM G — TESTING

## 9.1 Storybook

### Setup
```bash
npx storybook@latest init
```

### Stories cần viết
- `Badge`, `RowUser`, `ActionButtons`, `SearchBar`, `FilterTabs`, `Pagination`, `EmptyState`, `Modal`, `ConfirmDialog`, `AdminPageHeader`
- `ChatbotFab`, `ChatWindow`, `ChatMessage`
- `BookingProgress`, `BookingStepService`, `BookingStepLawyer`, `BookingStepDateTime`, `BookingStepInfo`
- `ServiceCard`, `LawyerCard`, `ArticleCard`
- `StatCard`, `KanbanCard`, `LineChart`, `DonutChart`

### Acceptance
- [ ] Storybook dev server chạy
- [ ] 20+ stories có variants + controls
- [ ] Chromatic integration (optional)

## 9.2 Playwright E2E

### Setup
```bash
npm i -D @playwright/test
npx playwright install
```

### Critical flows
1. **Booking happy path**: home → booking → service → lawyer → datetime → info → confirm
2. **Booking slot conflict**: chọn slot đã reserved → conflict message → chọn slot khác
3. **Booking expiry**: chọn slot → đợi 5 phút (skip via mock) → expired message
4. **Chatbot**: mở widget → gửi message → nhận response → handoff
5. **Auth**: login → admin redirect → logout
6. **CRM**: filter leads → search → change status
7. **Public navigation**: home → services → contact → back

### Files
- `tests/e2e/booking.spec.ts`
- `tests/e2e/chatbot.spec.ts`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/crm.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `playwright.config.ts`

## 9.3 Visual Regression (Chromatic — optional)

- Setup GitHub Action chạy Chromatic
- Auto-snapshot cho Storybook stories

---

# 10. STREAM H — PERFORMANCE

## 10.1 Bundle Audit

### Tool
```bash
npx @next/bundle-analyzer
```

### Targets
- First Load JS < 200KB cho public pages
- First Load JS < 350KB cho admin pages
- Route-level code splitting

## 10.2 Dynamic Imports

### Heavy components → `next/dynamic`
- Recharts components
- TipTap editor
- dnd-kit sortable
- Charts (line, donut)
- Modals (chỉ load khi mở)

### Example
```typescript
const AdminChart = dynamic(() => import('./admin-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

## 10.3 Image Optimization

- Tất cả `<img>` → `<Image>` của next/image
- Set `priority` cho above-the-fold images
- Lazy load cho below-the-fold
- Responsive `sizes` attribute
- WebP / AVIF auto conversion

## 10.4 Font Optimization

- `next/font` cho Cormorant Garamond + Plus Jakarta Sans
- `display: swap` để tránh FOIT
- Preload critical weights

## 10.5 CSS Optimization

- PurgeCSS để remove unused Tailwind classes
- Critical CSS inline cho above-the-fold
- Defer non-critical CSS

---

# 11. STREAM I — DEPLOYMENT

## 11.1 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test
      - run: npx playwright test
      - run: npm run build
      - uses: chromaui/action@v1
        with: { projectToken: ${{ secrets.CHROMATIC_TOKEN }} }}
```

## 11.2 Environment Variables

### Required
```bash
# .env.example
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://icrclaw.com
NEXT_PUBLIC_API_URL=https://api.icrclaw.com
NEXT_PUBLIC_SENTRY_DSN=xxx
SENTRY_AUTH_TOKEN=xxx
NEXT_PUBLIC_POSTHOG_KEY=xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_GA_ID=G-XXXX
```

## 11.3 Vercel Deployment

- Connect GitHub repo
- Auto-deploy on push to main
- Preview URLs cho PRs
- Domain: icrclaw.com (DNS CNAME)
- Edge functions nếu cần

## 11.4 Smoke Tests (Staging)

- Curl health check `/api/health` → 200
- Curl homepage → 200
- Curl critical pages → 200
- Trigger PostHog event từ browser
- Trigger Sentry error từ API

---

# 12. DEFINITION OF DONE

## 12.1 Code Quality
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Prettier formatted
- [ ] Test coverage > 80% cho shared components
- [ ] Test coverage > 60% cho feature modules
- [ ] Không có `any` trong code mới
- [ ] Không có `console.log` trong production code
- [ ] Không có emoji icon (theo rule)

## 12.2 Functional
- [ ] Tất cả 13 demo pages có route và render đúng
- [ ] Admin: 10 trang hoạt động với data thật (mock)
- [ ] Booking flow end-to-end OK
- [ ] Chatbot streaming hoạt động
- [ ] Auth flow (login/logout/forgot/reset)
- [ ] RBAC middleware chặn đúng routes
- [ ] Search/filter/sort hoạt động trên tất cả data tables
- [ ] Form validation (Zod) trên contact, login, forgot, booking

## 12.3 UI/UX
- [ ] 100% UI parity với 7 demo HTML files
- [ ] Responsive: 320px, 768px, 1024px, 1200px, 1440px
- [ ] Hover effects đầy đủ
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Animations mượt mà
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Focus rings visible

## 12.4 Performance
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse SEO > 95
- [ ] Lighthouse Accessibility > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] First Load JS < 200KB (public)
- [ ] Total bundle < 1MB

## 12.5 SEO
- [ ] Metadata cho mọi page
- [ ] Open Graph + Twitter Card
- [ ] Sitemap.xml auto-generated
- [ ] robots.txt đúng
- [ ] Structured data (JSON-LD) cho services/lawyers/articles
- [ ] Hreflang cho i18n
- [ ] Canonical URLs
- [ ] 404 + 500 friendly pages

## 12.6 Observability
- [ ] Sentry nhận errors (test bằng cách throw error)
- [ ] PostHog track được 3 funnels chính
- [ ] Web Vitals report lên PostHog/Sentry
- [ ] Console không có error/warning ở production

## 12.7 Testing
- [ ] Vitest: 100+ tests pass
- [ ] Playwright: 7+ E2E tests pass
- [ ] Storybook: 20+ stories
- [ ] Chromatic: 100% snapshots passed (optional)

## 12.8 Deployment
- [ ] CI/CD pipeline chạy xanh
- [ ] Staging deploy OK
- [ ] Smoke tests pass
- [ ] Environment variables đầy đủ
- [ ] Domain + SSL configured

---

# 13. EXECUTION ORDER (9 ngày)

```
Day 1-2  │ ████ A. 4 Public Pages Mới (services, lawyers, news, contact)
Day 2-3  │ ████ B. 3 Public Pages Polish (home, booking, login)
Day 3-4  │ ████ C. Admin Advanced (TipTap + Recharts + dnd-kit + TanStack Table)
Day 4    │ ████ D. Auth & RBAC (middleware, forgot/reset, error boundary)
Day 5    │ ████ E. i18n + SEO (next-intl, sitemap, JSON-LD)
Day 5-6  │ ████ F. Observability (Sentry + PostHog + Web Vitals)
Day 6-7  │ ████ G. Testing (Storybook + Playwright)
Day 7-8  │ ████ H. Performance (bundle audit, dynamic import, image opt)
Day 8-9  │ ████ I. Deployment (CI/CD, env, smoke test, production deploy)
```

### Chi tiết theo ngày

#### Day 1: Services + Lawyers
- Morning: Services page (8 components + data + 1 page)
- Afternoon: Lawyers page (6 components + data + 1 page)
- EOD: Verify build, fix TS errors

#### Day 2: News + Contact + Home polish
- Morning: News page (15 components + data + 1 page)
- Afternoon: Contact page (8 components + form)
- Evening: Home page audit & fix fidelity

#### Day 3: Booking + Login polish + Admin Advanced starts
- Morning: Booking + Login polish
- Afternoon: TipTap integration vào Blog editor
- Evening: Recharts thay SVG trong Dashboard

#### Day 4: Admin Advanced + Auth
- Morning: dnd-kit Kanban trong CRM + Dashboard
- Afternoon: TanStack Table refactor
- Evening: RBAC middleware + forgot/reset pages

#### Day 5: i18n + SEO + Observability starts
- Morning: next-intl setup + vi.json/en.json
- Afternoon: Metadata + sitemap + JSON-LD
- Evening: Sentry + PostHog integration

#### Day 6: Observability finish + Testing setup
- Morning: Web Vitals + PostHog funnels
- Afternoon: Storybook setup + 10 stories
- Evening: Playwright setup + 3 tests

#### Day 7: Testing + Performance
- Morning: 7 Playwright tests
- Afternoon: Bundle audit + dynamic import
- Evening: Image optimization

#### Day 8: Performance finish + CI/CD
- Morning: Font optimization + CSS purge
- Afternoon: GitHub Actions CI
- Evening: Vercel staging deploy

#### Day 9: Smoke test + Production deploy
- Morning: E2E trên staging
- Afternoon: Smoke test + fix bugs
- Evening: Production deploy + monitor

---

# PHỤ LỤC

## A. Files cần tạo (estimated 100+ files)

### Public pages
- 4 routes (services, lawyers, news, contact)
- 30+ components
- 4 data files
- 4 type files
- 2 detail routes (news/[slug], lawyers/[id])

### Admin
- TipTap rich-editor.tsx
- DataTable generic component
- Kanban với dnd-kit
- Error boundary

### Auth
- 2 routes (forgot-password, reset-password)
- 2 forms
- 403 page
- middleware.ts
- permissions.ts

### i18n
- messages/vi.json
- messages/en.json
- i18n/request.ts
- i18n/routing.ts
- locale switcher component

### SEO
- sitemap.ts
- robots.ts
- structured data helpers

### Observability
- sentry.{client,server,edge}.config.ts
- posthog.tsx
- web-vitals.ts

### Testing
- 20+ Storybook stories
- 7+ Playwright specs
- playwright.config.ts
- mock service worker nâng cấp

## B. Dependencies cần cài

```json
{
  "dependencies": {
    "@tiptap/react": "^2.5.0",
    "@tiptap/starter-kit": "^2.5.0",
    "@tiptap/extension-image": "^2.5.0",
    "@tiptap/extension-link": "^2.5.0",
    "@tiptap/extension-placeholder": "^2.5.0",
    "@tanstack/react-table": "^8.20.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "recharts": "^2.12.0",
    "next-intl": "^3.20.0",
    "@sentry/nextjs": "^8.0.0",
    "posthog-js": "^1.150.0",
    "web-vitals": "^4.2.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.47.0",
    "@next/bundle-analyzer": "^14.2.0",
    "chromatic": "^11.0.0"
  }
}
```

## C. Estimated file count

| Stream | New files | Modified files |
| :- | :- | :- |
| A. Public pages | 60+ | 5 |
| B. Polish | 5 | 8 |
| C. Admin advanced | 12 | 6 |
| D. Auth/RBAC | 8 | 2 |
| E. i18n + SEO | 8 | 15 |
| F. Observability | 5 | 4 |
| G. Testing | 35+ | 3 |
| H. Performance | 4 | 10 |
| I. Deployment | 3 | 2 |
| **TOTAL** | **140+** | **55** |

---

*Document created: June 2026*
*Version: 1.0 — Phase 6 Finalization*
*Estimated duration: 9 working days (2 weeks with buffer)*
