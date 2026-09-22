# VP Luật Hùng & Cộng sự — Frontend (vp-luat)

> Giao diện Next.js cho hệ thống tư vấn pháp lý trực tuyến của **VP Luật Hùng & Cộng sự**.
> Đa ngôn ngữ (vi/en), responsive, kết nối trực tiếp với backend Spring Boot (`brs-backend`).

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000?logo=nextdotjs)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/) [![Tailwind](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/) [![Playwright](https://img.shields.io/badge/Playwright-1.60-2EAD33?logo=playwright)](https://playwright.dev/)

---

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Tech stack](#tech-stack)
3. [Yêu cầu môi trường](#yêu-cầu-môi-trường)
4. [Cài đặt & chạy local](#cài-đặt--chạy-local)
5. [Biến môi trường](#biến-môi-trường)
6. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
7. [Hệ thống routing](#hệ-thống-routing)
8. [API clients](#api-clients)
9. [i18n (Đa ngôn ngữ)](#i18n-đa-ngôn-ngữ)
10. [State management](#state-management)
11. [Quy ước code](#quy-ước-code)
12. [Kiểm thử](#kiểm-thử)
13. [Storybook](#storybook)
14. [Build & Deploy](#build--deploy)
15. [Troubleshooting](#troubleshooting)

---

## Tổng quan

Ứng dụng phục vụ 3 đối tượng người dùng chính, mỗi nhóm có 1 route group riêng:

| Route group | Đường dẫn | Đối tượng | Mô tả |
|---|---|---|---|
| `(public)` | `/`, `/services`, `/lawyers`, `/news`, `/booking`, `/contact` | Khách hàng / Khách vãng lai | Trang marketing, tra cứu luật sư & dịch vụ, đặt lịch tư vấn |
| `(auth)` | `/login` | Người dùng đang đăng nhập | Đăng nhập bằng NextAuth (Credentials) |
| `(admin)` | `/admin/*` | Admin / Manager / Lawyer / Editor / CSKH | Quản trị booking, CRM, blog, users, báo cáo, v.v. |
| `(staff)` | `/staff/*` | Nhân viên vận hành | CRM, bookings, blog, reviews, dashboard nội bộ |

Mọi API call đều đi qua Axios client (`src/lib/api/index.ts`), trỏ vào `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:8080/api`).

---

## Tech stack

- **Framework**: [Next.js 16.2.6](https://nextjs.org/) (App Router, Standalone build)
- **UI**: React 19.2.4 + TypeScript 5
- **Styling**: TailwindCSS 4 (PostCSS), CSS variables, `tailwind-merge` + `clsx`
- **Components**: [Radix UI](https://www.radix-ui.com/) primitives + shadcn-style wrappers
- **Forms**: [react-hook-form](https://react-hook-form.com/) + [zod](https://zod.dev/) (resolver: `@hookform/resolvers`)
- **Data fetching**: [TanStack Query](https://tanstack.com/query) v5
- **Tables**: [TanStack Table](https://tanstack.com/table) v8 + drag-and-drop với [`@dnd-kit`](https://dndkit.com/)
- **Editor**: [TipTap](https://tiptap.dev/) v3 cho rich-text
- **Charts**: [Recharts](https://recharts.org/) v3
- **Auth**: [NextAuth.js v5 (beta)](https://authjs.dev/) — JWT session
- **i18n**: [next-intl](https://next-intl-docs.vercel.app/) v4 — routing tiếng Việt & tiếng Anh
- **State**: [Zustand](https://zustand-demo.pmnd.rs/) cho client state dạng nhỏ
- **Toasts**: [sonner](https://sonner.emilkowal.ski/)
- **Date**: [date-fns](https://date-fns.org/) v4
- **Icons**: [lucide-react](https://lucide.dev/) + `@radix-ui/react-icons`

### Dev & test

- **Lint / Format**: ESLint 9 + Prettier 3 (`lint-staged` + `simple-git-hooks`)
- **Unit**: [Vitest](https://vitest.dev/) 4 + Testing Library + [MSW](https://mswjs.io/) 2
- **E2E**: [Playwright](https://playwright.dev/) 1.60 (Chromium + Mobile Safari)
- **Storybook**: Storybook 10 (Next.js Vite builder)
- **Performance audit**: [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse) 13

---

## Yêu cầu môi trường

| Tool | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | ≥ 20.x | Dùng `nvm` nếu có thể |
| npm | ≥ 10.x | (hoặc pnpm/yarn tương đương) |
| Backend Spring Boot | `localhost:8080` | Xem `../brs-backend/README` |
| Docker (tuỳ chọn) | ≥ 24.x | Nếu chạy Postgres/Redis qua docker |

---

## Cài đặt & chạy local

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend/vp-luat

# 2. Cài dependencies
npm install

# 3. Sao chép & cấu hình env
cp .env.example .env.local

# 4. Đảm bảo backend đang chạy (xem brs-backend)
#    Sau đó khởi động dev server
npm run dev
# → http://localhost:3000
```

### Các script npm hữu ích

| Script | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server với Webpack (mặc định ổn định) |
| `npm run dev:turbo` | Chạy dev server với Turbopack (nhanh hơn, có thể kém ổn định với một số thư viện) |
| `npm run build` | Build production (output: `dist/standalone`) |
| `npm start` | Chạy production server (sau khi build) |
| `npm run lint` | Chạy ESLint |
| `npm test` | Vitest ở chế độ watch |
| `npm run test:run` | Vitest một lần |
| `npm run test:e2e` | Playwright E2E (tự khởi động `next dev` qua `webServer`) |
| `npm run test:e2e:ui` | Playwright với UI mode |
| `npm run storybook` | Storybook dev server @ `http://localhost:6006` |
| `npm run build-storybook` | Build Storybook tĩnh |

---

## Biến môi trường

File `.env.local` (gitignored). Tham chiếu `.env.example`:

```ini
# URL công khai của backend API (axios baseURL = ${NEXT_PUBLIC_API_URL})
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# NextAuth v5 — dùng cho JWT session
NEXTAUTH_SECRET=replace_with_long_random_string
AUTH_SECRET=replace_with_long_random_string
NEXTAUTH_URL=http://localhost:3000
```

> **Lưu ý**: `NEXT_PUBLIC_*` được inlined vào bundle phía client. Không đặt secret thật vào biến `NEXT_PUBLIC_*`.

---

## Cấu trúc thư mục

```
frontend/vp-luat/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (public)/              # Trang khách hàng (homepage, services, booking, ...)
│   │   ├── (auth)/login/          # Trang đăng nhập
│   │   ├── (admin)/admin/         # Trang quản trị (dashboard, crm, users, ...)
│   │   ├── (staff)/staff/         # Trang nhân viên vận hành
│   │   └── api/auth/[...nextauth]/ # NextAuth handlers
│   │
│   ├── features/                  # Tính năng theo domain (vertical slice)
│   │   ├── admin/                 # pages/, components/, hooks/, lib/, layout/, types/, constants/
│   │   ├── booking/               # Wizard 4 bước (service → datetime → info → confirm)
│   │   ├── home/                  # Homepage sections
│   │   ├── services/              # Trang dịch vụ
│   │   ├── lawyers/               # Trang luật sư
│   │   ├── news/                  # Trang tin tức
│   │   ├── contact/               # Trang liên hệ
│   │   ├── crm/                   # CRM logic dùng chung
│   │   ├── chatbot/               # Chatbot AI widget
│   │   ├── staff/                 # Staff portal
│   │   └── shared/                # UI components dùng chung
│   │
│   ├── lib/                       # Tài nguyên chia sẻ cấp app
│   │   ├── api/                   # Axios clients + endpoint modules (admin-*, crm-*, public-*)
│   │   ├── utils/                 # cn(), format helpers, validators
│   │   └── ...
│   │
│   ├── components/                # Shared UI cấp app (Button, Dialog, Input, ...)
│   ├── stores/                    # Zustand stores
│   ├── providers/                 # React Context providers (AuthProvider, QueryProvider, ...)
│   ├── i18n/
│   │   ├── request.ts             # Cấu hình next-intl
│   │   ├── routing.ts             # locale config (vi, en)
│   │   └── messages/{vi,en}.json  # Bản dịch
│   ├── proxy.ts                   # Next.js middleware (auth, redirects)
│   └── styles/                    # Global CSS, Tailwind entry
│
├── tests/
│   ├── e2e/                       # Playwright E2E
│   │   ├── all-pages.spec.ts          # Smoke tests cho mọi route
│   │   ├── user-flows.spec.ts         # Luồng người dùng chi tiết (booking, contact, login)
│   │   ├── login-admin.spec.ts        # Auth + truy cập admin pages
│   │   ├── booking.spec.ts            # Booking flow cơ bản
│   │   └── booking-wizard-real-data.spec.ts  # Wizard với dữ liệu thực từ backend + docker
│   └── ...
│
├── public/                        # Static assets (ảnh, favicon, robots.txt)
├── .storybook/                    # Cấu hình Storybook
├── playwright.config.ts           # Playwright config
├── vitest.config.ts               # Vitest config
├── tailwind.config.ts             # Tailwind v4 (PostCSS)
├── tsconfig.json                  # TS strict mode + path aliases (@/components, @/features, ...)
├── next.config.ts                 # Rewrites + standalone output
└── package.json
```

### Path aliases (tsconfig.json)

```ts
"@/*"        → "./src/*"
"@/components/*" → "./src/components/*"
"@/features/*"   → "./src/features/*"
"@/lib/*"        → "./src/lib/*"
"@/stores/*"     → "./src/stores/*"
"@/providers/*"  → "./src/providers/*"
```

---

## Hệ thống routing

App Router dùng **route groups** (parentheses) để nhóm các trang mà không ảnh hưởng URL. Mỗi nhóm có thể có `layout.tsx` riêng (ví dụ `(admin)/admin/layout.tsx` bọc admin shell).

### `(public)` — Khách hàng

| Path | Trang |
|---|---|
| `/` | Trang chủ |
| `/services` | Danh sách dịch vụ |
| `/services/:slug` | Chi tiết dịch vụ |
| `/lawyers` | Danh sách luật sư |
| `/lawyers/:id` | Hồ sơ luật sư |
| `/news` | Tin tức / Blog |
| `/news/:slug` | Chi tiết bài viết |
| `/booking` | Wizard đặt lịch 4 bước |
| `/contact` | Liên hệ / Yêu cầu tư vấn |
| `/dich-vu` | Alias cũ → `/services` (xem `next.config.ts → rewrites`) |

### `(auth)` — Đăng nhập

| Path | Trang |
|---|---|
| `/login` | Form đăng nhập (NextAuth Credentials) |

### `(admin)` — Quản trị

| Path | Trang |
|---|---|
| `/admin` | Dashboard tổng quan |
| `/admin/dashboard` | Dashboard chi tiết |
| `/admin/bookings` | Lịch hẹn |
| `/admin/crm`, `/admin/crm/pipeline` | CRM |
| `/admin/users` | Người dùng + phân quyền |
| `/admin/roles` | Ma trận Roles & Permissions |
| `/admin/files` | File Manager |
| `/admin/services-management` | Quản lý dịch vụ |
| `/admin/landing-pages` | Landing Page Builder |
| `/admin/jobs` | Tuyển dụng (Job Postings + Applications) |
| `/admin/reports` | Báo cáo doanh thu / luật sư / dịch vụ |
| `/admin/lawyer-schedules` | Lịch làm việc luật sư |
| `/admin/site-content` | Sửa nội dung Hero / About / Contact |
| `/admin/blog` | Blog & bài viết |
| `/admin/case-studies` | Case Studies |
| `/admin/reviews` | Đánh giá khách hàng |
| `/admin/chatbot` | Chatbot logs |
| `/admin/newsletter` | Newsletter |
| `/admin/notifications` | Thông báo |
| `/admin/audit` | Nhật ký kiểm toán |
| `/admin/settings` | Cài đặt (SMTP, Email Test, theme) |

### `(staff)` — Nhân viên

| Path | Trang |
|---|---|
| `/staff` | Dashboard nhân viên |
| `/staff/dashboard` | Dashboard nội bộ |
| `/staff/bookings` | Lịch hẹn (staff view) |
| `/staff/crm` | CRM |
| `/staff/blog` | Blog (soạn thảo) |
| `/staff/reviews` | Duyệt đánh giá |
| `/staff/notifications` | Thông báo |
| `/staff/settings` | Cài đặt cá nhân |

### Middleware (`src/proxy.ts`)

- Kiểm tra NextAuth session cho các route `(admin)` và `(staff)`; redirect về `/login` nếu chưa xác thực.
- Tự động chuyển locale nếu URL không match (next-intl routing).

---

## API clients

Tất cả axios instance & endpoint wrappers nằm trong `src/lib/api/`:

| Module | Mục đích |
|---|---|
| `index.ts` | Re-exports + axios instance với baseURL = `NEXT_PUBLIC_API_URL` |
| `admin-core.ts` | Users, audit logs, notifications |
| `admin-dashboard.ts` | Dashboard stats + reports |
| `admin-email.ts` | Email test (SMTP) |
| `admin-files.ts` | Upload/delete file |
| `admin-jobs.ts` | Job postings + applications |
| `admin-landing-pages.ts` | Landing page CRUD + blocks |
| `admin-lawyers.ts` | Lawyer schedule + override |
| `admin-roles.ts` | Roles + permission groups |
| `admin-site-content.ts` | Site content (hero/about/contact) |
| `crm-leads.ts` | Lead timeline, notes, bookings |
| `public-*.ts` | Public endpoints (services, lawyers, news, booking) |

**Quy ước**:
- Mỗi module export một object `xxxApi` (ví dụ `bookingApi`, `usersApi`).
- Hook tương ứng nằm trong `src/features/<domain>/hooks/use-*.ts` và dùng TanStack Query.
- Auth token được đính kèm qua axios interceptor đọc từ NextAuth session.

---

## i18n (Đa ngôn ngữ)

- 2 locale: `vi` (mặc định) và `en`
- Bản dịch: `src/i18n/messages/{vi,en}.json`
- Cấu hình: `src/i18n/request.ts` + `src/i18n/routing.ts`
- URL pattern: `/[locale]/...` (next-intl tự routing)

Sử dụng trong component:

```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('booking');
return <h1>{t('heroTitle')}</h1>;
```

Thêm key mới → cập nhật **cả 2** file `vi.json` & `en.json` để tránh fallback runtime warning.

---

## State management

| Loại state | Công cụ | Ví dụ |
|---|---|---|
| Server state (fetch, cache) | TanStack Query v5 | `useLandingPages`, `useJobs`, `useUsers` |
| Form state | react-hook-form + zod | Booking form, contact form, user form |
| UI state (modal, drawer, tabs) | React local state | Filter tabs, drawer open/close |
| Cross-page ephemeral state | Zustand | Booking wizard state, theme preferences |

---

## Quy ước code

- **TypeScript strict** — không dùng `any`, ưu tiên `unknown` rồi narrow.
- **Components**: PascalCase, file dạng `kebab-case.tsx`. Một component chính mỗi file.
- **Hooks**: bắt đầu bằng `use`, file `use-*.ts`.
- **API wrappers**: `xxxApi` object với method rõ ràng.
- **i18n keys**: dùng namespace phân cấp, không flatten.
- **Imports**: ưu tiên path alias `@/features/...` thay vì `../../../`.
- **Accessibility**: button phải có `aria-label` khi chỉ chứa icon; dialog dùng Radix primitives.

### Trước khi commit

```bash
npm run lint     # ESLint
npm run test:run # Vitest một lần (nếu có unit test mới)
```

---

## Kiểm thử

### Unit test (Vitest)

```bash
npm test         # watch mode
npm run test:run # CI mode
```

Test pattern: `@testing-library/react` + `userEvent`, MSW để mock API. Ví dụ:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submit enables when fields valid', async () => {
  render(<BookingForm />);
  await userEvent.type(screen.getByLabelText(/họ và tên/i), 'Nguyen Van A');
  expect(screen.getByRole('button', { name: /xác nhận/i })).toBeEnabled();
});
```

### E2E test (Playwright)

```bash
npm run test:e2e     # Chạy toàn bộ (Chromium + Mobile Safari)
npm run test:e2e:ui  # UI mode
```

Các file test:

| File | Mục đích |
|---|---|
| `all-pages.spec.ts` | Smoke test mọi route (status 200, có heading) |
| `user-flows.spec.ts` | Luồng người dùng chi tiết (booking, contact, login) |
| `login-admin.spec.ts` | Login + truy cập admin pages |
| `booking.spec.ts` | Booking flow cơ bản |
| `booking-wizard-real-data.spec.ts` | **Wizard với dữ liệu thực** từ backend + docker postgres — 8 tests, ~15s parallel |

#### Test với dữ liệu thực (booking wizard)

File `booking-wizard-real-data.spec.ts` gọi trực tiếp backend Spring Boot tại `http://localhost:8080` và docker postgres tại `localhost:5434`. Yêu cầu:

1. `cd brs-backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev` (backend chạy ở port 8080)
2. `docker compose up -d` (postgres + redis + rabbitmq healthy)
3. `npm run dev` (Next.js ở port 3000)
4. `npx playwright test tests/e2e/booking-wizard-real-data.spec.ts`

Các test sẽ:
- Lấy danh sách services & lawyers thật từ API
- Click slot thực → backend tạo `slot_reservations` thực
- Submit form hợp lệ → tạo appointment thực trong DB

Có thể verify bằng:

```bash
docker exec brs-postgres psql -U postgres -d brs_db \
  -c "SELECT id, client_name, status, scheduled_at FROM appointments ORDER BY created_at DESC LIMIT 5;"
```

---

## Storybook

```bash
npm run storybook       # Dev: http://localhost:6006
npm run build-storybook # Build static → ./storybook-static/
```

Storybook dùng Next.js Vite builder, hỗ trợ docs addon. Stories đặt cạnh component với tên `*.stories.tsx`.

---

## Build & Deploy

```bash
npm run build
```

- Output: `.next/standalone/` (Next.js standalone build) — phù hợp Docker.
- Public assets cần copy thêm vào `standalone/public/` và `standalone/.next/static/` (xem Dockerfile nếu có).

### Chạy production local

```bash
npm run build
npm start
# → http://localhost:3000
```

### Biến môi trường production

| Biến | Mô tả |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL API backend (vd: `https://api.vuplat.vn/api`) |
| `NEXTAUTH_URL` | Public URL của FE (vd: `https://vuplat.vn`) |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | JWT signing key (≥ 32 ký tự random) |

---

## Troubleshooting

### `next-intl` báo `ENVIRONMENT_FALLBACK: There is no 'timeZone' configured`

→ Mỗi lần một client component gọi `useTranslations(...)`, `next-intl` cảnh báo vì thiếu `timeZone` ở client context. Đã fix bằng cách truyền `timeZone` qua cả server config lẫn `NextIntlClientProvider`:

1. `src/i18n/config.ts` — export constant chia sẻ:

```typescript
export const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';
```

2. `src/i18n/request.ts` — dùng constant trong server config:

```typescript
return { locale, timeZone: APP_TIME_ZONE, messages: ... };
```

3. `src/providers/query-provider.tsx` — `NextIntlClientProvider` nhận prop `timeZone`:

```typescript
<NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
```

4. `src/app/layout.tsx` — lấy `timeZone` server-side và truyền xuống Providers:

```typescript
const timeZone = await getTimeZone(); // from 'next-intl/server'
<Providers locale={locale} messages={messages} timeZone={timeZone}>
```

Sau khi sửa, restart dev server (`rm -rf .next && npm run dev`) để áp dụng.

### `next-intl` báo thiếu key

→ Kiểm tra cả 2 file `src/i18n/messages/vi.json` & `en.json` đều có key. Hot reload không tự đồng bộ khi thêm key mới — restart dev server.

### Booking wizard không thấy lawyers

→ Kiểm tra `lawyer_profiles.service_ids` (jsonb) khớp với `services.id` được chọn. Có thể phải reseed mapping:

```sql
INSERT INTO service_lawyers (service_id, lawyer_id)
SELECT s.id, lp.id FROM services s CROSS JOIN lawyer_profiles lp
ON CONFLICT DO NOTHING;

UPDATE lawyer_profiles lp
SET service_ids = (SELECT jsonb_agg(service_id) FROM service_lawyers WHERE lawyer_id = lp.id);
```

Sau đó `docker exec brs-redis redis-cli -a <pwd> FLUSHALL` để xóa cache backend.

### Login redirect loop

→ Đảm bảo `NEXTAUTH_URL` khớp với URL đang truy cập. `NEXTAUTH_SECRET` phải giống backend (nếu backend cùng trust secret).

### Tailwind class không apply

→ Tailwind v4 dùng `@tailwindcss/postcss`. Đảm bảo `postcss.config.mjs` đã trỏ plugin `@tailwindcss/postcss`.

### Build fail với `Type error: Cannot find module '@/...'` ở `.next/dev/types`

→ `rm -rf .next && npm run dev` để regenerate types.

### E2E fail với "address already in use" port 3000

→ Tắt dev server thủ công trước khi chạy Playwright với config mặc định, hoặc dùng `reuseExistingServer: true`.

---

## Tài liệu liên quan

- Backend Spring Boot: `../../brs-backend/README.md`
- Test plan tổng: `../../BRS_UI_Backend_Test_Plan.md`
- Coding rules: `.cursor/rules/coding-style*.mdc`
- Cursor skills & agents: `.cursor/skills/`

---

**Maintainer**: Team VpLuật · **Last updated**: 2026-09-22 (added `next-intl` timeZone troubleshooting)
