# VpLuật — Văn Phòng Luật Hùng & Cộng sự

> Hệ thống website tư vấn pháp lý trực tuyến cho **VP Luật Hùng & Cộng sự** — gồm frontend Next.js, backend Spring Boot, cơ sở dữ liệu PostgreSQL và hạ tầng Docker đi kèm.

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016.2.6-000?logo=nextdotjs)](frontend/vp-luat/README.md) [![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%203.3-6DB33F?logo=springboot)](brs-backend/README.md) [![Java](https://img.shields.io/badge/Java-21%20LTS-ED8B00?logo=openjdk)](brs-backend/README.md) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](brs-backend/README.md)

---

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc repo](#cấu-trúc-repo)
3. [Hệ thống con](#hệ-thống-con)
4. [Yêu cầu môi trường](#yêu-cầu-môi-trường)
5. [Khởi động nhanh](#khởi-động-nhanh)
6. [Tài liệu chi tiết](#tài-liệu-chi-tiết)
7. [Quy ước làm việc](#quy-ước-làm-việc)
8. [Tài nguyên khác](#tài-nguyên-khác)

---

## Tổng quan

VpLuật là nền tảng web tư vấn pháp lý cung cấp:

- **Trang công khai** cho khách hàng: tra cứu dịch vụ, luật sư, tin tức; đặt lịch tư vấn 4 bước; chatbot AI; form liên hệ / yêu cầu tư vấn.
- **Cổng quản trị (admin)** cho Admin / Manager / Lawyer / Editor / CSKH: dashboard, CRM pipeline, quản lý users & roles, landing-page builder, báo cáo, settings.
- **Cổng nhân viên (staff)** cho vận hành nội bộ: CRM, bookings, blog, reviews.
- **Backend API** Spring Boot xử lý booking, CRM, content, chatbot (OpenAI/Gemini), newsletter, audit log.
- **Đa ngôn ngữ** Việt – Anh trên cả frontend và backend.

---

## Cấu trúc repo

```
vpluat/
├── brs-backend/                 # Spring Boot 3.3 REST API (Java 21)
│   ├── src/main/java/com/lawfirm/brs/
│   │   ├── config/              # Configuration classes
│   │   ├── controller/          # REST Controllers (auth, booking, crm, blog, admin, erp, ...)
│   │   ├── service/             # Business logic
│   │   ├── repository/          # Spring Data JPA repositories
│   │   ├── entity/              # JPA entities
│   │   ├── dto/                 # Request/Response DTOs
│   │   ├── mapper/              # Entity <-> DTO mapping
│   │   ├── security/            # JWT RS256 + Spring Security 6
│   │   └── messaging/           # RabbitMQ producers/consumers
│   ├── src/main/resources/
│   │   ├── application.yml      # Main config
│   │   ├── application-dev.yml  # Dev profile
│   │   └── db/migration/        # Flyway migrations
│   ├── docker/                  # Dockerfile + docker-compose
│   ├── scripts/                 # Build & deploy scripts
│   └── README.md                # Backend documentation
│
├── frontend/
│   └── vp-luat/                 # Next.js 16.2.6 frontend (React 19, TypeScript 5)
│       ├── src/
│       │   ├── app/             # App Router (route groups: public/auth/admin/staff)
│       │   ├── features/        # Domain-driven slices (booking, admin, crm, ...)
│       │   ├── lib/api/         # Axios clients + endpoint wrappers
│       │   ├── components/      # Shared UI
│       │   ├── providers/       # Context providers (Query, Session, Intl)
│       │   ├── stores/          # Zustand stores
│       │   └── i18n/            # next-intl config + messages vi/en
│       ├── tests/
│       │   ├── unit/            # Vitest
│       │   └── e2e/             # Playwright
│       ├── public/              # Static assets
│       └── README.md            # Frontend documentation
│
├── uploads/                     # Local uploaded files (gitignored)
├── logs/                        # Local logs (gitignored)
│
├── .cursor/                     # Cursor rules + skills
├── .vscode/                     # Workspace settings
│
├── BRS_UI_Backend_Test_Plan.md  # Test plan tổng (UI + API)
├── TEST_PLAN.md                 # Test plan chi tiết
│
└── README.md                    # File này
```

---

## Hệ thống con

| Thành phần | Công nghệ | Mô tả | Tài liệu |
|---|---|---|---|
| **Frontend** | Next.js 16.2.6, React 19.2.4, TypeScript 5, TailwindCSS 4, TanStack Query, TipTap, Recharts, next-intl v4, NextAuth v5 | Giao diện người dùng public + admin + staff | [`frontend/vp-luat/README.md`](frontend/vp-luat/README.md) |
| **Backend** | Java 21, Spring Boot 3.3, Spring Security 6, Spring Data JPA, Flyway, JWT RS256, springdoc-openapi | REST API xử lý nghiệp vụ | [`brs-backend/README.md`](brs-backend/README.md) |
| **Database** | PostgreSQL 16 | Lưu trữ chính (qua Flyway migrations) | Xem `brs-backend/README.md` |
| **Cache** | Redis 7.2 | Cache session / API responses | Xem `brs-backend/README.md` |
| **Message Broker** | RabbitMQ 3.13 | Async messaging (email, chatbot, notifications) | Xem `brs-backend/README.md` |
| **Chatbot AI** | OpenAI / Gemini integration | Tư vấn tự động & handoff sang staff | Xem `brs-backend/README.md` |
| **Container** | Docker + Docker Compose | Chạy Postgres / Redis / RabbitMQ cục bộ | Xem `brs-backend/docker/` |

---

## Yêu cầu môi trường

| Tool | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | ≥ 20.x | Dùng `nvm` nếu có thể |
| npm | ≥ 10.x | (hoặc pnpm/yarn tương đương) |
| JDK | 21 LTS | Cho backend |
| Maven | ≥ 3.9 | Build backend |
| Docker + Docker Compose | ≥ 24.x | Chạy Postgres / Redis / RabbitMQ |
| PostgreSQL client | ≥ 16 | `psql` để inspect DB |
| Git | ≥ 2.40 | — |

---

## Khởi động nhanh

Chạy toàn bộ stack (backend + frontend + DB) ở máy local:

```bash
# 1. Khởi động Postgres / Redis / RabbitMQ bằng Docker
cd brs-backend
docker compose up -d
cd ..

# 2. Khởi động backend (terminal 1)
cd brs-backend
cp .env.example .env             # chỉnh .env với secret nếu cần
mvn spring-boot:run -Dspring-boot.run.profiles=dev
# → http://localhost:8080  (Swagger UI: /swagger-ui.html)

# 3. Khởi động frontend (terminal 2)
cd frontend/vp-luat
cp .env.example .env.local       # đặt NEXT_PUBLIC_API_URL trỏ về backend
npm install
npm run dev
# → http://localhost:3000
```

Sau khi cả 3 service lên, đăng nhập thử tại `http://localhost:3000/login` bằng tài khoản admin seed sẵn (xem `brs-backend/README.md` để biết cách bật `APP_SEED_ENABLED=true` cho lần chạy đầu).

### Chạy nhanh bằng IDE

- Mở workspace `vpluat/` trong VS Code / Cursor.
- Backend: chạy `BrsBackendApplication` với profile `dev`.
- Frontend: chạy `npm run dev` trong `frontend/vp-luat`.
- Database: dùng `docker compose up -d` từ `brs-backend/`.

---

## Tài liệu chi tiết

| Tài liệu | Nội dung |
|---|---|
| [`frontend/vp-luat/README.md`](frontend/vp-luat/README.md) | Cài đặt, scripts, routing, API clients, i18n, state mgmt, testing (Vitest + Playwright), Storybook, build & deploy FE |
| [`brs-backend/README.md`](brs-backend/README.md) | Tech stack backend, cấu trúc package, setup DB + Docker, seed data, JWT, cấu hình SMTP, OpenAI/Gemini |
| [`BRS_UI_Backend_Test_Plan.md`](BRS_UI_Backend_Test_Plan.md) | Test plan tổng hợp UI + API |
| [`TEST_PLAN.md`](TEST_PLAN.md) | Test plan chi tiết |
| [`.cursor/rules/`](.cursor/rules/) | Coding rules (Java + TypeScript), patterns, security, testing |
| [`.cursor/skills/`](.cursor/skills/) | Skills cho Cursor agents |

---

## Quy ước làm việc

### Git workflow

- Branch chính: `main` (production-ready).
- Tính năng / fix: tạo branch từ `main` với prefix `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.
- Commit message ưu tiên tiếng Việt, dạng Conventional Commits (`feat:`, `fix:`, `docs:`, ...).
- Trước khi mở PR:
  - `cd frontend/vp-luat && npm run lint && npm run test:run`
  - `cd brs-backend && mvn -q -DskipTests=false verify` (khi có test).

### Coding style

- **Backend (Java 21)**: xem `.cursor/rules/patterns.mdc`, `coding-style.mdc`, `security.mdc`. Tuân thủ Google Java Format; constructor injection; records cho DTO; sealed types cho domain.
- **Frontend (TypeScript)**: xem `.cursor/rules/patterns copy.mdc`, `coding-style copy.mdc`. Ưu tiên `interface` cho object shape, `type` cho union/intersection; tránh `any` (dùng `unknown`); component props có named type; Zod cho validation.

### Pre-commit

Frontend dùng `simple-git-hooks` + `lint-staged`:

- Prettier format `.ts`/`.tsx`/`.json`/`.css`
- ESLint (Next.js + Tailwind plugin)
- (Tuỳ chọn) Vitest liên quan

### Secrets

- Không commit `.env` / `.env.local` / `application-prod.yml`.
- Backend dev dùng `brs-backend/.env` (gitignored).
- Frontend: biến `NEXT_PUBLIC_*` an toàn để public; secret thật (NextAuth secret, API key nội bộ) đặt vào secret manager ở production.

---

## Tài nguyên khác

- **Storybook FE**: `cd frontend/vp-luat && npm run storybook` → http://localhost:6006
- **Swagger BE**: http://localhost:8080/swagger-ui.html (khi chạy `dev` profile)
- **E2E với dữ liệu thực**: xem hướng dẫn trong `frontend/vp-luat/README.md` (mục *Test với dữ liệu thực*).
- **Postman / curl**: dùng token từ `POST /api/auth/login` (`username` + `password`).

---

**Maintainer**: Team VpLuật · **Last updated**: 2026-09-22
