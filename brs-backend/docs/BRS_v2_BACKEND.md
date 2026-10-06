# BRS v2.0 — Backend Java Spring Boot RESTful API
## Kiến Trúc Monolithic — ICRC Law

| | |
| :- | :- |
| **Phiên bản** | 1.0 |
| **Ngày** | Tháng 5 / 2026 |
| **Mức độ bảo mật** | NỘI BỘ |
| **Dự án** | Law Firm Website – Backend Platform |
| **Trạng thái** | Bản nháp kiến trúc – Sẵn sàng review |

---

# MỤC LỤC

[TOC]

---

# 01. TỔNG QUAN KIẾN TRÚC

## 1.1 Sơ Đồ Kiến Trúc

```
┌──────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                   │
│  Next.js Web (SSR/SSG)     Admin Dashboard       Mobile App          │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy + SSL)                        │
│              Rate Limiting │ Static Files │ Load Balancer             │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ HTTP (localhost)
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│              SPRING BOOT APPLICATION (JAR)                            │
│              Java 21 + Spring Boot 3.3                                │
│              Port: 8080                                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    CONTROLLER LAYER                           │   │
│  │  AuthController │ PublicController │ AdminController │ ...    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   SERVICE LAYER                               │   │
│  │  AuthService │ BookingService │ LeadService │ PostService │... │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   REPOSITORY LAYER                            │   │
│  │  JPA Repositories │ Redis Cache │ RabbitMQ │ Cloudinary SDK   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┬───────────────┐
              ▼               ▼               ▼               ▼
      ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐
      │ PostgreSQL  │  │  Redis   │  │ RabbitMQ  │  │  Cloudinary   │
      │   :5433     │  │  :6379   │  │  :5672    │  │   (Cloud)     │
      │  All tables │  │ Cache    │  │ Async msg │  │ File store    │
      │             │  │ Sessions │  │           │  │ (images/videos)│
      └────────────┘  └──────────┘  └───────────┘  └───────────────┘
```

## 1.2 Technology Stack

| Layer | Technology | Version |
| :- | :- | :- |
| **Language** | Java | 21 LTS |
| **Framework** | Spring Boot | 3.3.x |
| **Security** | Spring Security 6 + JWT | — |
| **Database** | PostgreSQL | 16 |
| **ORM** | Spring Data JPA + Hibernate | 6.x |
| **Migration** | Flyway | 10.x |
| **Cache** | Redis (Spring Cache) | 7.2 |
| **Message Broker** | RabbitMQ (Spring AMQP) | 3.13 |
| **File Storage** | Cloudinary (images, videos, docs) | — |
| **API Docs** | springdoc-openapi | 2.3 |
| **Email** | Spring Mail + SendGrid | — |
| **AI** | OpenAI GPT-4o API / Gemini API | — |
| **HTML Sanitizer** | OWASP Java HTML Sanitizer | — |
| **Testing** | JUnit 5, Mockito, Testcontainers | — |
| **Build** | Maven | 3.9 |
| **Container** | Docker | 26.x |

## 1.3 Non-Functional Requirements

| Yêu cầu | Mục tiêu |
| :- | :- |
| **Availability** | 99.5% uptime |
| **Latency P99** | < 300ms cho read, < 800ms cho write |
| **Throughput** | 200 req/s peak |
| **Recovery Time (RTO)** | < 30 phút |
| **Data Loss (RPO)** | < 5 phút |

---

# 02. CẤU TRÚC PROJECT

## 2.1 Directory Structure

```
backend/
├── pom.xml                          # Parent POM
├── Dockerfile
├── docker-entrypoint.sh
│
├── src/
│   ├── main/
│   │   ├── java/com/lawfirm/brs/
│   │   │   ├── BrsApplication.java              # Main class
│   │   │   │
│   │   │   ├── config/                          # Configuration
│   │   │   │   ├── SecurityConfig.java           # Spring Security + JWT
│   │   │   │   ├── RedisConfig.java             # Cache + Session
│   │   │   │   ├── RabbitMQConfig.java          # Message broker
│   │   │   │   ├── OpenApiConfig.java           # Swagger docs
│   │   │   │   ├── CorsConfig.java              # CORS settings
│   │   │   │   ├── CloudinaryConfig.java           # Cloud file upload
│   │   │   │   └── YamlPropertySourceFactory.java
│   │   │   │
│   │   │   ├── controller/                      # REST Controllers (Inbound)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   └── PublicAuthController.java
│   │   │   │   ├── public/
│   │   │   │   │   ├── PublicServiceController.java
│   │   │   │   │   ├── PublicLawyerController.java
│   │   │   │   │   ├── PublicFaqController.java
│   │   │   │   │   ├── PublicPostController.java
│   │   │   │   │   ├── PublicSearchController.java
│   │   │   │   │   └── PublicDocumentController.java
│   │   │   │   ├── booking/
│   │   │   │   │   ├── BookingController.java
│   │   │   │   │   └── AvailabilityController.java
│   │   │   │   ├── crm/
│   │   │   │   │   ├── LeadController.java
│   │   │   │   │   ├── ReviewController.java
│   │   │   │   │   ├── NewsletterController.java
│   │   │   │   │   └── JobController.java
│   │   │   │   ├── content/
│   │   │   │   │   ├── PostController.java
│   │   │   │   │   ├── CategoryController.java
│   │   │   │   │   ├── TagController.java
│   │   │   │   │   ├── CaseStudyController.java
│   │   │   │   │   └── AdminServiceController.java
│   │   │   │   ├── chatbot/
│   │   │   │   │   ├── ChatbotController.java
│   │   │   │   │   └── AdminChatbotController.java
│   │   │   │   ├── admin/
│   │   │   │   │   ├── UserController.java
│   │   │   │   │   ├── DashboardController.java
│   │   │   │   │   └── LawyerProfileController.java
│   │   │   │   ├── upload/
│   │   │   │   │   └── FileUploadController.java
│   │   │   │   └── webhook/
│   │   │   │       └── SmsWebhookController.java
│   │   │   │
│   │   │   ├── service/                        # Business Logic (Application)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── AuthService.java
│   │   │   │   │   ├── JwtService.java
│   │   │   │   │   ├── UserService.java
│   │   │   │   │   └── AuditLogService.java
│   │   │   │   ├── public/
│   │   │   │   │   ├── ServiceEntityService.java
│   │   │   │   │   ├── LawyerService.java
│   │   │   │   │   └── FaqService.java
│   │   │   │   ├── booking/
│   │   │   │   │   ├── BookingService.java
│   │   │   │   │   ├── AvailabilityService.java
│   │   │   │   │   └── OtpService.java
│   │   │   │   ├── crm/
│   │   │   │   │   ├── LeadService.java
│   │   │   │   │   ├── LeadDeduplicationService.java
│   │   │   │   │   ├── ReviewService.java
│   │   │   │   │   ├── NewsletterService.java
│   │   │   │   │   └── JobService.java
│   │   │   │   ├── content/
│   │   │   │   │   ├── PostService.java
│   │   │   │   │   ├── CategoryService.java
│   │   │   │   │   ├── TagService.java
│   │   │   │   │   ├── CaseStudyService.java
│   │   │   │   │   ├── DocumentService.java
│   │   │   │   │   ├── ContentSanitizerService.java
│   │   │   │   │   └── SeoMetadataService.java
│   │   │   │   ├── chatbot/
│   │   │   │   │   ├── ChatbotService.java
│   │   │   │   │   ├── IntentClassifier.java
│   │   │   │   │   ├── ChatSessionService.java
│   │   │   │   │   └── OpenAIClientService.java
│   │   │   │   ├── notification/
│   │   │   │   │   ├── EmailService.java
│   │   │   │   │   ├── SmsService.java
│   │   │   │   │   └── NotificationService.java
│   │   │   │   ├── search/
│   │   │   │   │   └── FullTextSearchService.java
│   │   │   │   └── upload/
│   │   │   │       └── FileStorageService.java
│   │   │   │
│   │   │   ├── repository/                     # Data Access
│   │   │   │   ├── entity/
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── LawyerProfile.java
│   │   │   │   │   ├── ServiceEntity.java
│   │   │   │   │   ├── Faq.java
│   │   │   │   │   ├── Appointment.java
│   │   │   │   │   ├── AvailabilitySlot.java
│   │   │   │   │   ├── Lead.java
│   │   │   │   │   ├── Review.java
│   │   │   │   │   ├── NewsletterSubscriber.java
│   │   │   │   │   ├── Post.java
│   │   │   │   │   ├── Category.java
│   │   │   │   │   ├── Tag.java
│   │   │   │   │   ├── CaseStudy.java
│   │   │   │   │   ├── Document.java
│   │   │   │   │   ├── JobPosting.java
│   │   │   │   │   ├── JobApplication.java
│   │   │   │   │   ├── OutboxEvent.java
│   │   │   │   │   └── AuditLog.java
│   │   │   │   │
│   │   │   │   └── jpa/
│   │   │   │       ├── UserRepository.java
│   │   │   │       ├── LawyerProfileRepository.java
│   │   │   │       ├── ServiceEntityRepository.java
│   │   │   │       ├── FaqRepository.java
│   │   │   │       ├── AppointmentRepository.java
│   │   │   │       ├── AvailabilitySlotRepository.java
│   │   │   │       ├── LeadRepository.java
│   │   │   │       ├── ReviewRepository.java
│   │   │   │       ├── NewsletterSubscriberRepository.java
│   │   │   │       ├── PostRepository.java
│   │   │   │       ├── CategoryRepository.java
│   │   │   │       ├── TagRepository.java
│   │   │   │       ├── CaseStudyRepository.java
│   │   │   │       ├── DocumentRepository.java
│   │   │   │       ├── JobPostingRepository.java
│   │   │   │       ├── JobApplicationRepository.java
│   │   │   │       ├── OutboxEventRepository.java
│   │   │   │       └── AuditLogRepository.java
│   │   │   │
│   │   │   ├── dto/                            # Data Transfer Objects
│   │   │   │   ├── request/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   ├── BookingRequest.java
│   │   │   │   │   ├── LeadRequest.java
│   │   │   │   │   ├── PostRequest.java
│   │   │   │   │   ├── OtpVerifyRequest.java
│   │   │   │   │   ├── ReviewRequest.java
│   │   │   │   │   ├── NewsletterSubscribeRequest.java
│   │   │   │   │   ├── JobApplicationRequest.java
│   │   │   │   │   └── ChatbotMessageRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── ApiResponse.java
│   │   │   │       ├── LoginResponse.java
│   │   │   │       ├── UserDTO.java
│   │   │   │       ├── LawyerDTO.java
│   │   │   │       ├── ServiceDTO.java
│   │   │   │       ├── AppointmentDTO.java
│   │   │   │       ├── LeadDTO.java
│   │   │   │       ├── PostDTO.java
│   │   │   │       ├── SearchResultDTO.java
│   │   │   │       ├── ChatbotResponse.java
│   │   │   │       └── DashboardStatsDTO.java
│   │   │   │
│   │   │   ├── mapper/                        # Entity ↔ DTO mapping
│   │   │   │   ├── UserMapper.java
│   │   │   │   ├── LawyerMapper.java
│   │   │   │   ├── PostMapper.java
│   │   │   │   ├── AppointmentMapper.java
│   │   │   │   ├── LeadMapper.java
│   │   │   │   ├── ReviewMapper.java
│   │   │   │   ├── CaseStudyMapper.java
│   │   │   │   ├── JobApplicationMapper.java
│   │   │   │   └── ServiceEntityMapper.java
│   │   │   │
│   │   │   ├── messaging/                     # RabbitMQ Producers/Consumers
│   │   │   │   ├── EventPublisher.java
│   │   │   │   ├── NotificationConsumer.java
│   │   │   │   └── OutboxProcessor.java
│   │   │   │
│   │   │   ├── scheduler/                     # Scheduled Tasks
│   │   │   │   ├── AppointmentReminderScheduler.java
│   │   │   │   ├── OutboxEventProcessor.java
│   │   │   │   ├── OtpCleanupScheduler.java
│   │   │   │   └── PostViewCountScheduler.java
│   │   │   │
│   │   │   ├── exception/                     # Exception Handling
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── BusinessException.java
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   ├── UnauthorizedException.java
│   │   │   │   ├── RateLimitExceededException.java
│   │   │   │   └── ErrorCodes.java
│   │   │   │
│   │   │   ├── constants/                     # Constants & Enums
│   │   │   │   ├── Roles.java
│   │   │   │   ├── AppointmentStatus.java
│   │   │   │   ├── LeadStatus.java
│   │   │   │   ├── PostStatus.java
│   │   │   │   ├── MeetingType.java
│   │   │   │   └── JobApplicationStatus.java
│   │   │   │
│   │   │   └── util/                          # Utilities
│   │   │       ├── PhoneNumberUtil.java
│   │   │       ├── SlugUtil.java
│   │   │       ├── HashUtil.java
│   │   │       └── ContentExtractor.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml                # Main config
│   │       ├── application-prod.yml           # Production overrides
│   │       ├── application-dev.yml            # Dev overrides
│   │       └── db/migration/                  # Flyway migrations
│   │           ├── V1__init_schema.sql
│   │           ├── V2__seed_data.sql
│   │           ├── V3__seed_lawyers.sql
│   │           ├── V4__seed_services.sql
│   │           └── V5__seed_posts.sql
│   │
│   └── test/
│       ├── java/com/lawfirm/brs/
│       │   ├── service/                       # Unit tests
│       │   ├── controller/                     # Controller tests
│       │   └── integration/                   # Integration tests
│       └── resources/
│           └── application-test.yml
│
├── docker/
│   ├── docker-compose.yml                     # Full local dev stack
│   ├── postgres/
│   │   └── init-db.sql                        # All tables in one DB
│   ├── redis/
│   │   └── redis.conf
│   ├── rabbitmq/
│   │   └── definitions.json
│   └── nginx/
│       └── nginx.conf
│
├── config/
│   └── application.yml                        # External config
│
├── scripts/
│   ├── init-db.sh
│   ├── build.sh
│   └── run.sh
│
├── docs/
│   ├── api-specs/                            # OpenAPI exports
│   └── runbooks/
│
└── README.md
```

---

# 03. DATABASE DESIGN (Single PostgreSQL DB)

## 3.1 Sơ Đồ Bảng

```
users ──────────────┬────────────── lawyer_profiles ─── lawyer_services ─── services
                    │                      │                    │
                    │                      │                    └── service_lawyers
                    │                      │
                    │              lawyer_availability
                    │
                    └──── audit_logs
                         user_sessions
                         
─────────────────────────────────────────────────────────────────────────────

services ─────────────────────────────────────────────────────────────────────
  │
  └── faqs
       documents (lead_gate)
       case_study_services ─── case_studies
       
─────────────────────────────────────────────────────────────────────────────

appointments ─────────────────────────────────────────────────────────────────
  │
  └── availability_slots

─────────────────────────────────────────────────────────────────────────────

leads ───────────────────────────────────────────────────────────────────────
  │
  └── lead_notes

─────────────────────────────────────────────────────────────────────────────

posts ──── categories ── post_tags ─── tags
              │
              └── post_lawyers ─── lawyer_profiles
              └── post_tags

─────────────────────────────────────────────────────────────────────────────

reviews ─────────────────────────────────────────────────────────────────────
newsletter_subscribers ──────────────────────────────────────────────────────
job_postings ──── job_applications ─────────────────────────────────────────
outbox_events (async messaging)
```

## 3.2 Database Schema (Single File — Flyway Migration)

```sql
-- V1__init_schema.sql

-- ============================================================
-- USERS & AUTHENTICATION
-- [IMPROVED v2] Thêm account lockout để chống brute-force login
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'USER',
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    -- [IMPROVED v2] Account lockout fields
    locked_until    TIMESTAMP,                        -- Lock account sau nhiều lần đăng nhập thất bại
    failed_attempts INT NOT NULL DEFAULT 0,           -- Đếm số lần đăng nhập thất bại
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP
);
-- Index cho lockout lookup
CREATE INDEX idx_users_locked ON users(locked_until) WHERE locked_until IS NOT NULL;

CREATE TABLE lawyer_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    slug                VARCHAR(255) NOT NULL UNIQUE,
    name_vi             VARCHAR(255) NOT NULL,
    name_en             VARCHAR(255),
    bio_vi              TEXT,
    bio_en              TEXT,
    position_vi         VARCHAR(255),
    position_en         VARCHAR(255),
    experience_years    INT DEFAULT 0,
    bar_number          VARCHAR(100),
    languages           VARCHAR(100)[] DEFAULT ARRAY['vi'],
    avatar_url          VARCHAR(500),
    is_featured         BOOLEAN DEFAULT FALSE,
    working_hours       JSONB DEFAULT '{}',
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE service_lawyers (
    service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    lawyer_id   UUID NOT NULL REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
    is_primary  BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (service_id, lawyer_id)
);

CREATE TABLE lawyer_availability (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawyer_id       UUID NOT NULL REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
    day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_duration   INT NOT NULL DEFAULT 60,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   VARCHAR(500) NOT NULL,
    user_agent      VARCHAR(500),
    ip_address      VARCHAR(45),
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id   UUID,
    old_data    JSONB,
    new_data    JSONB,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- I18N STRATEGY: Translation Tables (Scalable Multi-Language)
-- Thay vì title_vi, title_en, content_vi, content_en... → dùng translation table
-- Ưu điểm: thêm ngôn ngữ mới không cần alter schema, dễ cache, clean schema
-- ============================================================
CREATE TABLE locale_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,  -- posts, services, case_studies, categories, faqs
    entity_id   UUID NOT NULL,
    locale      VARCHAR(10) NOT NULL DEFAULT 'vi',  -- vi, en, ja, zh...
    title       VARCHAR(500),
    excerpt     TEXT,
    content     TEXT,
    meta_title  VARCHAR(255),
    meta_desc   VARCHAR(500),
    UNIQUE (entity_type, entity_id, locale)
);

-- ============================================================
-- PUBLIC CONTENT
-- ============================================================
CREATE TABLE services (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(255) NOT NULL UNIQUE,
    icon            VARCHAR(100),
    is_featured     BOOLEAN DEFAULT FALSE,
    display_order   INT DEFAULT 0,
    parent_id       UUID REFERENCES services(id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    -- Standard audit columns
    version         BIGINT NOT NULL DEFAULT 0,  -- optimistic locking
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,                   -- soft delete
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id)
);
CREATE INDEX idx_services_deleted ON services(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE faqs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id      UUID REFERENCES services(id),
    display_order   INT DEFAULT 0,
    is_published    BOOLEAN DEFAULT TRUE,
    -- Standard audit columns
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id)
);

CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path       VARCHAR(1000) NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_type       VARCHAR(100),
    file_size       BIGINT,
    service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
    download_count  INT DEFAULT 0,
    is_public       BOOLEAN DEFAULT FALSE,
    lead_gate       BOOLEAN DEFAULT TRUE,
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id)
);

-- ============================================================
-- BOOKING
-- [IMPROVED v2] Thêm version cho optimistic locking, hash OTP để bảo mật
-- ============================================================
CREATE TABLE appointments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name         VARCHAR(255) NOT NULL,
    client_email        VARCHAR(255) NOT NULL,
    client_phone        VARCHAR(20) NOT NULL,
    lawyer_id           UUID NOT NULL REFERENCES lawyer_profiles(id),
    service_id          UUID NOT NULL REFERENCES services(id),
    scheduled_at        TIMESTAMP NOT NULL,
    duration_minutes    INT NOT NULL DEFAULT 60,
    timezone            VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    meeting_type        VARCHAR(20) NOT NULL DEFAULT 'OFFICE',
    meeting_link        VARCHAR(500),
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    cancel_reason       TEXT,
    internal_notes      TEXT,
    source              VARCHAR(50) DEFAULT 'WEBSITE',
    utm_source          VARCHAR(100),
    utm_medium          VARCHAR(100),
    utm_campaign        VARCHAR(100),
    -- [IMPROVED v2] OTP được hash bằng SHA-256 trước khi lưu (ngăn chặn OTP leak nếu DB bị breach)
    otp_code_hash      VARCHAR(64),                   -- SHA-256 hash của OTP (thay thế otp_code)
    otp_expires_at     TIMESTAMP,
    -- [IMPROVED v2] Optimistic locking cho admin/CSKH updates
    version             BIGINT NOT NULL DEFAULT 0,
    confirmed_at        TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE availability_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawyer_id       UUID NOT NULL REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
    slot_date       DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    is_available    BOOLEAN DEFAULT TRUE,
    appointment_id  UUID REFERENCES appointments(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(lawyer_id, slot_date, start_time)
);

-- ============================================================
-- CRM & LEADS
-- [IMPROVED v2] Thêm channel tracking cho multi-channel attribution
-- ============================================================
CREATE TABLE leads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255),
    phone               VARCHAR(20),
    service_id          UUID REFERENCES services(id),
    message             TEXT,
    source              VARCHAR(50) NOT NULL,
    -- [IMPROVED v2] Multi-channel tracking
    channel             VARCHAR(20),                   -- GOOGLE, FACEBOOK, ZALO, TIKTOK, ORGANIC
    campaign_id         VARCHAR(100),                  -- Ad platform campaign ID
    ad_group_id         VARCHAR(100),                  -- Ad group ID cho ROAS tracking
    utm_source          VARCHAR(100),
    utm_medium          VARCHAR(100),
    utm_campaign        VARCHAR(100),
    status              VARCHAR(30) NOT NULL DEFAULT 'NEW',
    assigned_to         UUID REFERENCES users(id),
    duplicate_hash      VARCHAR(64),
    ip_address          VARCHAR(45),
    user_agent          VARCHAR(500),
    first_contact_at    TIMESTAMP,
    last_contact_at     TIMESTAMP,
    notes               TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE lead_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id     UUID NOT NULL REFERENCES leads(id),
    user_id     UUID REFERENCES users(id),
    content     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name     VARCHAR(255) NOT NULL,
    client_role     VARCHAR(255),
    content_vi      TEXT NOT NULL,
    content_en      TEXT,
    rating          INT CHECK (rating BETWEEN 1 AND 5),
    lawyer_id       UUID REFERENCES lawyer_profiles(id),
    service_id      UUID REFERENCES services(id),
    is_featured     BOOLEAN DEFAULT FALSE,
    is_published    BOOLEAN DEFAULT FALSE,
    source          VARCHAR(50) DEFAULT 'WEBSITE',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE newsletter_subscribers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    name                VARCHAR(255),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verification_token  VARCHAR(100),
    verified_at         TIMESTAMP,
    unsubscribed_at     TIMESTAMP,
    source              VARCHAR(50) DEFAULT 'WEBSITE',
    ip_address          VARCHAR(45),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE job_postings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,
    title_en        VARCHAR(500),
    department      VARCHAR(100),
    location        VARCHAR(255),
    job_type        VARCHAR(50),
    description_vi  TEXT,
    description_en  TEXT,
    requirements_vi TEXT,
    requirements_en TEXT,
    salary_range    VARCHAR(100),
    status          VARCHAR(20) DEFAULT 'DRAFT',
    deadline        DATE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE job_applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES job_postings(id),
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    cv_url          VARCHAR(1000),
    cover_letter    TEXT,
    status          VARCHAR(20) DEFAULT 'NEW',
    applied_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTENT MANAGEMENT
-- ============================================================
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(255) NOT NULL UNIQUE,
    parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
    meta_title_vi   VARCHAR(255),
    meta_title_en   VARCHAR(255),
    meta_desc_vi    VARCHAR(500),
    meta_desc_en    VARCHAR(500),
    display_order   INT DEFAULT 0,
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id)
);

CREATE TABLE tags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(100) NOT NULL UNIQUE,
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id)
);

CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(255) NOT NULL UNIQUE,
    thumbnail_url   VARCHAR(1000),
    author_id       UUID NOT NULL REFERENCES users(id),
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at    TIMESTAMP,
    scheduled_at    TIMESTAMP,
    views           INT DEFAULT 0,
    reading_time    INT,
    og_image_url    VARCHAR(1000),
    is_featured     BOOLEAN DEFAULT FALSE,
    language        VARCHAR(5) DEFAULT 'vi',
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id)
);

CREATE TABLE post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE post_lawyers (
    post_id   UUID REFERENCES posts(id) ON DELETE CASCADE,
    lawyer_id UUID NOT NULL REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, lawyer_id)
);

CREATE TABLE case_studies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(255) NOT NULL UNIQUE,
    outcome         VARCHAR(500),
    thumbnail_url   VARCHAR(1000),
    is_featured     BOOLEAN DEFAULT FALSE,
    is_published    BOOLEAN DEFAULT FALSE,
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id)
);

CREATE TABLE case_study_services (
    case_study_id   UUID REFERENCES case_studies(id) ON DELETE CASCADE,
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (case_study_id, service_id)
);

-- ============================================================
-- CHATBOT
-- ============================================================
CREATE TABLE chatbot_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      VARCHAR(100) NOT NULL UNIQUE,
    user_ip         VARCHAR(45),
    user_agent      VARCHAR(500),
    language        VARCHAR(5) DEFAULT 'vi',
    started_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMP,
    escalated       BOOLEAN DEFAULT FALSE,
    lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
    -- PHI/PI data: encrypt column-level using pgcrypto
    session_key     VARCHAR(255)  -- encrypted session owner identifier
);

CREATE TABLE chatbot_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      VARCHAR(100) NOT NULL REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL, -- USER, BOT, SYSTEM
    -- [IMPROVED v2] Giới hạn 4000 ký tự để tránh abuse và tối ưu GPT context
    content         VARCHAR(4000) NOT NULL,
    intent          VARCHAR(100),
    confidence      DECIMAL(3,2),
    retention_until TIMESTAMP NOT NULL,       -- đánh dấu ngày xóa (mặc định +30 ngày)
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- OUTBOX (Async Events)
-- ============================================================
CREATE TABLE outbox_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id   UUID NOT NULL,
    event_type      VARCHAR(100) NOT NULL,
    payload         JSONB NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    processed       BOOLEAN DEFAULT FALSE,
    processed_at    TIMESTAMP
);

-- ============================================================
-- CHATBOT RETENTION POLICY (GDPR / Data Privacy)
-- ============================================================
-- chatbot_messages lưu nội dung hội thoại có thể chứa PII.
-- Chính sách:
-- 1. retention_until mặc định = NOW() + 30 ngày → auto-delete sau đó
-- 2. Scheduler chạy daily: xóa messages có retention_until < NOW()
-- 3. Trước khi lưu: sanitize/loại bỏ PII (email, phone, CMND) khỏi nội dung chat
-- 4. Cân nhắc: mã hóa column content bằng pgcrypto (encrypt_deps với per-session key)
-- 5. Escalated sessions (chuyển luật sư): giữ lại vĩnh viễn cho compliance

-- ============================================================
-- INDEXES
-- ============================================================
-- Auth
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_lawyer_profiles_slug ON lawyer_profiles(slug);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Public
CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_featured ON services(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_faqs_service ON faqs(service_id) WHERE is_published = TRUE;

-- Booking
CREATE INDEX idx_appointments_lawyer ON appointments(lawyer_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_client_phone ON appointments(client_phone);
-- Partial unique index: ngăn double booking — mỗi luật sư chỉ có 1 slot trống tại 1 thời điểm
-- Chỉ khóa trên PENDING + CONFIRMED (CANCELLED, EXPIRED không count)
CREATE UNIQUE INDEX idx_appointments_unique_slot
    ON availability_slots(lawyer_id, slot_date, start_time)
    WHERE appointment_id IS NOT NULL;
CREATE INDEX idx_availability_slots_lookup ON availability_slots(lawyer_id, slot_date, is_available) WHERE is_available = TRUE;

-- CRM
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_duplicate_hash ON leads(duplicate_hash);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_reviews_published ON reviews(is_published) WHERE is_published = TRUE;

-- Content
CREATE INDEX idx_posts_fts_vi ON posts USING GIN(fts_vi);
CREATE INDEX idx_posts_fts_en ON posts USING GIN(fts_en);
CREATE INDEX idx_posts_published ON posts(status, published_at) WHERE status = 'PUBLISHED';
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_category ON posts(category_id);

-- Chatbot
CREATE INDEX idx_chatbot_sessions_session ON chatbot_sessions(session_id);
CREATE INDEX idx_chatbot_messages_session ON chatbot_messages(session_id);
CREATE INDEX idx_chatbot_messages_retention ON chatbot_messages(retention_until) 
    WHERE retention_until < NOW();  -- cho cleanup scheduler

-- Outbox
-- [IMPROVED v2] Thêm index trên created_at để scheduler xử lý đúng thứ tự
CREATE INDEX idx_outbox_unprocessed ON outbox_events(processed) WHERE processed = FALSE;
CREATE INDEX idx_outbox_unprocessed_ordered
    ON outbox_events(created_at) WHERE processed = FALSE;
```

---

# 04. API ENDPOINTS TỔNG HỢP

## 4.0 API Design Principles [IMPROVED v2]

### API Versioning Strategy

Dùng **URL versioning** — thêm version prefix vào URL path:

```bash
# Breaking changes → tạo version mới
/api/v1/services  →  /api/v2/services
/api/v1/posts     →  /api/v2/posts

# Non-breaking changes → thêm fields vào response (backward compatible)
```

### Pagination Strategy

- **Offset pagination**: cho danh sách nhỏ (< 1000 items), dùng khi cần total count
- **Cursor pagination**: cho danh sách lớn, dùng khi cần performance tốt

```java
// Cursor-based pagination (cho danh sách lớn)
public record CursorPage<T>(
    List<T> content,
    String nextCursor,
    boolean hasNext
)

@GetMapping("/posts")
public ResponseEntity<CursorPage<PostDTO>> getPosts(
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "20") int limit) {
    List<PostDTO> posts = postService.findByCursor(cursor, limit);
    return ResponseEntity.ok(new CursorPage<>(posts, getNextCursor(posts), posts.size() == limit));
}
```

## 4.1 Endpoint Summary

| Nhóm | Số lượng | Auth | Rate Limit |
| :- | :- | :- | :- |
| **Auth** | 9 | Mixed | 5 req/min/IP |
| **Public Content** | 16 | Public | 300 req/min/IP |
| **Booking** | 9 | Mixed | 100 req/min |
| **CRM** | 16 | Mixed | 50 req/min |
| **Content** | 22 | Admin | — |
| **Chatbot** | 6 | Public | 30 req/min/session |
| **Admin** | 12 | Admin | — |
| **Upload** | 3 | Admin | 10 req/min |
| **Webhook** | 2 | Signature | — |
| **Tổng** | **~95** | | |

## 4.2 Chi Tiết API Endpoints

### 4.2.1 Auth (`/api/auth`)

| Method | Endpoint | Auth | Mô tả |
| :- | :- | :- | :- |
| `POST` | `/api/auth/login` | Public | Đăng nhập → JWT |
| `POST` | `/api/auth/logout` | JWT | Invalidate token |
| `POST` | `/api/auth/refresh` | Public | Refresh JWT |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản |
| `POST` | `/api/auth/forgot-password` | Public | Quên mật khẩu |
| `POST` | `/api/auth/reset-password` | Public | Reset password |
| `GET` | `/api/auth/me` | JWT | Thông tin user hiện tại |
| `PUT` | `/api/auth/me` | JWT | Cập nhật profile |
| `POST` | `/api/auth/change-password` | JWT | Đổi mật khẩu |

### 4.2.2 Public Content (`/api/public/*`)

| Method | Endpoint | Auth | Mô tả | Cache |
| :- | :- | :- | :- | :- |
| `GET` | `/api/public/services` | Public | Danh sách dịch vụ | 5 phút |
| `GET` | `/api/public/services/{slug}` | Public | Chi tiết dịch vụ | 5 phút |
| `GET` | `/api/public/lawyers` | Public | Danh sách luật sư | 5 phút |
| `GET` | `/api/public/lawyers/{slug}` | Public | Hồ sơ luật sư | 5 phút |
| `GET` | `/api/public/lawyers/{slug}/services` | Public | Dịch vụ của LS | 5 phút |
| `GET` | `/api/public/faqs` | Public | Danh sách FAQ | 10 phút |
| `GET` | `/api/public/faqs?serviceId=` | Public | FAQ theo dịch vụ | 10 phút |
| `GET` | `/api/public/posts` | Public | Bài viết (filter, phân trang) | 2 phút |
| `GET` | `/api/public/posts/{slug}` | Public | Chi tiết bài viết | 2 phút |
| `GET` | `/api/public/posts/featured` | Public | Bài viết nổi bật | 5 phút |
| `GET` | `/api/public/search` | Public | Full-text search | 2 phút |
| `GET` | `/api/public/documents/{id}` | Lead-gated | Download tài liệu | — |
| `POST` | `/api/public/leads` | Public | Tạo lead |
| `GET` | `/api/public/case-studies` | Public | Case studies |
| `GET` | `/api/public/reviews` | Public | Reviews đã duyệt |
| `GET` | `/api/public/jobs` | Public | Tin tuyển dụng |

### 4.2.3 Booking (`/api/bookings`)

| Method | Endpoint | Auth | Mô tả |
| :- | :- | :- | :- |
| `POST` | `/api/bookings` | Public | Tạo booking (OTP) |
| `POST` | `/api/bookings/{id}/verify` | Public | Xác nhận OTP |
| `POST` | `/api/bookings/{id}/resend-otp` | Public | Gửi lại OTP (trước khi verify) |
| `POST` | `/api/bookings/{id}/cancel` | Public | Client tự hủy (gửi OTP cancel) |
| `GET` | `/api/bookings` | Admin | Danh sách lịch hẹn |
| `GET` | `/api/bookings/{id}` | JWT | Chi tiết lịch hẹn |
| `PATCH` | `/api/bookings/{id}` | JWT | Cập nhật lịch hẹn |
| `DELETE` | `/api/bookings/{id}` | JWT | Hủy lịch hẹn (admin/CSKH) |
| `GET` | `/api/bookings/availability/{lawyerId}` | Public | Slot trống |
| `POST` | `/api/bookings/availability/{lawyerId}` | Admin | Tạo availability |
| `GET` | `/api/bookings/stats` | Admin | Thống kê booking |

### 4.2.4 CRM (`/api/crm/*`)

| Method | Endpoint | Auth | Mô tả |
| :- | :- | :- | :- |
| `GET` | `/api/crm/leads` | Admin | Danh sách leads |
| `GET` | `/api/crm/leads/{id}` | Admin | Chi tiết lead |
| `PATCH` | `/api/crm/leads/{id}` | Admin | Cập nhật lead |
| `POST` | `/api/crm/leads/{id}/notes` | Admin | Thêm ghi chú |
| `GET` | `/api/crm/leads/stats` | Admin | Thống kê leads |
| `GET` | `/api/crm/leads/export` | Admin | Export CSV |
| `GET` | `/api/crm/reviews` | Admin | Tất cả reviews |
| `POST` | `/api/crm/reviews/{id}/publish` | Admin | Duyệt review |
| `POST` | `/api/crm/newsletter/subscribe` | Public | Đăng ký newsletter |
| `GET` | `/api/crm/newsletter/confirm` | Public | Confirm subscription |
| `POST` | `/api/crm/newsletter/unsubscribe` | Public | Unsubscribe |
| `GET` | `/api/crm/newsletter/subscribers` | Admin | Danh sách subscribers |
| `POST` | `/api/crm/jobs` | Admin | Tạo tin tuyển dụng |
| `PUT` | `/api/crm/jobs/{id}` | Admin | Cập nhật tin |
| `GET` | `/api/crm/jobs/applications` | Admin | Danh sách ứng viên |
| `POST` | `/api/crm/jobs/{id}/apply` | Public | Ứng tuyển |

### 4.2.5 Content Management (`/api/admin/content/*`)

| Method | Endpoint | Auth | Mô tả |
| :- | :- | :- | :- |
| `POST` | `/api/admin/posts` | Editor+ | Tạo bài viết |
| `PUT` | `/api/admin/posts/{id}` | Editor+ | Cập nhật bài viết |
| `PATCH` | `/api/admin/posts/{id}/publish` | Editor+ | Publish |
| `PATCH` | `/api/admin/posts/{id}/archive` | Editor+ | Archive |
| `DELETE` | `/api/admin/posts/{id}` | Admin | Xóa bài viết |
| `POST` | `/api/admin/categories` | Editor+ | Tạo danh mục |
| `PUT` | `/api/admin/categories/{id}` | Editor+ | Cập nhật danh mục |
| `POST` | `/api/admin/tags` | Editor+ | Tạo tag |
| `POST` | `/api/admin/case-studies` | Editor+ | Tạo case study |
| `PUT` | `/api/admin/case-studies/{id}` | Editor+ | Cập nhật case study |
| `POST` | `/api/admin/services` | Admin | Tạo dịch vụ |
| `PUT` | `/api/admin/services/{id}` | Admin | Cập nhật dịch vụ |
| `POST` | `/api/admin/faqs` | Editor+ | Tạo FAQ |
| `PUT` | `/api/admin/faqs/{id}` | Editor+ | Cập nhật FAQ |
| `POST` | `/api/admin/documents` | Admin | Tạo document |
| `DELETE` | `/api/admin/documents/{id}` | Admin | Xóa document |

### 4.2.6 Chatbot (`/api/chatbot`)

| Method | Endpoint | Auth | Mô tả |
| :- | :- | :- | :- |
| `POST` | `/api/chatbot/message` | Public | Gửi message |
| `GET` | `/api/chatbot/history/{sessionId}` | Public | Lịch sử chat (cần xác thực session ownership) |
| `POST` | `/api/chatbot/handoff` | Public | Chuyển live agent |
| `GET` | `/api/admin/chatbot/sessions` | Admin | Quản lý sessions |
| `GET` | `/api/admin/chatbot/logs` | Admin | Xem logs |
| `PUT` | `/api/admin/chatbot/config` | Admin | Cấu hình chatbot |

### 4.2.7 Admin (`/api/admin/*`)

| Method | Endpoint | Auth | Mô tả |
| :- | :- | :- | :- |
| `GET` | `/api/admin/users` | Admin | Danh sách users |
| `POST` | `/api/admin/users` | SuperAdmin | Tạo user |
| `PUT` | `/api/admin/users/{id}` | Admin | Cập nhật user |
| `PATCH` | `/api/admin/users/{id}/role` | SuperAdmin | Đổi role |
| `GET` | `/api/admin/dashboard/stats` | Admin | Dashboard stats |
| `GET` | `/api/admin/dashboard/charts` | Admin | Chart data |
| `GET` | `/api/admin/audit-logs` | Admin | Xem audit log |
| `POST` | `/api/admin/lawyers` | Admin | Tạo lawyer profile |
| `PUT` | `/api/admin/lawyers/{id}` | Admin | Cập nhật lawyer |
| `POST` | `/api/admin/upload` | Admin | Upload file |
| `POST` | `/api/admin/upload/image` | Admin | Upload image |
| `GET` | `/api/admin/activity-log` | Admin | Hoạt động gần đây |

### 4.2.8 Webhook

| Method | Endpoint | Auth | Mô tả |
| :- | :- | :- | :- |
| `POST` | `/api/webhooks/sms` | Internal | SMS provider webhook |
| `POST` | `/api/webhooks/otp-callback` | Internal | OTP SMS callback |

---

# 05. CHI TIẾT CÁC MODULE CHÍNH

## 5.1 Security & Authentication

### JWT Configuration

```java
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final RateLimitConfig rateLimitConfig;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login", "/api/auth/refresh",
                    "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/bookings", "/api/bookings/availability/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/bookings").permitAll()
                .requestMatchers("/api/crm/newsletter/subscribe",
                    "/api/crm/newsletter/confirm",
                    "/api/crm/newsletter/unsubscribe").permitAll()
                .requestMatchers("/api/crm/jobs/*/apply").permitAll()
                .requestMatchers("/api/crm/jobs").permitAll()
                .requestMatchers("/api/crm/reviews").permitAll()
                .requestMatchers("/api/chatbot/**").permitAll()
                .requestMatchers("/api/webhooks/**").permitAll()
                // CSRF: ignore cho API (JWT header), bật SameSite=Strict cho cookie-based admin
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/api/auth/**", "/api/public/**", "/api/webhooks/**"))
            .cookieSerializer(cookie -> cookie
                .name("BRS_SESSION").httpOnly(true).secure(true).sameSite("Strict"))
            .headers(h -> h
                .frameOptions(FrameOptionsConfig::deny)
                .referrerPolicy(r -> r.policy(ReferrerPolicy.StrictOriginWhenCrossOrigin)))
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**")
                    .access(rateLimitConfig.swaggerAccess())
                .requestMatchers("/actuator/health/**").permitAll()
                .requestMatchers("/api/auth/me", "/api/auth/me/**").authenticated()
                .requestMatchers("/api/bookings/**").authenticated()
                .requestMatchers("/api/crm/**").hasAnyRole("ADMIN", "CSKH", "LAWYER")
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "EDITOR")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt
                .decoder(jwtTokenProvider.jwtDecoder())
                .jwtAuthenticationConverter(jwtAuthConverter())))
            .addFilterBefore(new OriginValidationFilter(), RateLimitFilter.class)
            .addFilterBefore(rateLimitFilter(), AuthorizationFilter.class)
            .build();
    }

    @Bean
    public RateLimitFilter rateLimitFilter() {
        return new RateLimitFilter(rateLimitConfig);
    }
}

// =====================================================================
// RateLimitConfig — đọc limit từ application.yml, khởi tạo Bucket4j+Redis
// =====================================================================
@Configuration
public class RateLimitConfig {

    @Value("${app.rate-limit.auth:5}")
    private int authLimit;

    @Value("${app.rate-limit.booking:3}")
    private int bookingLimit;

    @Value("${app.rate-limit.lead:5}")
    private int leadLimit;

    @Value("${app.rate-limit.search:60}")
    private int searchLimit;

    @Value("${app.rate-limit.chatbot-per-session:30}")
    private int chatbotPerSessionLimit;

    @Bean
    public BucketRegistry bucketRegistry(RedisConnectionFactory factory) {
        return Bucket4j.extension(RedisBucketManager.class)
            .builder()
            .build(RedisProxyManager.builder(factory.getHostAndPort().toString())
                .withConnectionPoolConfig(b -> b
                    .maxTotal(100)
                    .maxIdle(20)
                    .minIdle(5))
                .build());
    }

    public Bucket authBucket(String ip) {
        return bucketRegistry.builder().addLimit(Bandwidth.classic(
            authLimit, Refill.greedy(authLimit, Duration.ofMinutes(1))
        )).build();
    }

    public Bucket bookingBucket(String ip) {
        return bucketRegistry.builder().addLimit(Bandwidth.classic(
            bookingLimit, Refill.greedy(bookingLimit, Duration.ofMinutes(1))
        )).build();
    }

    public AuthorizationManager<HttpServletRequest, HttpServletResponse> swaggerAccess() {
        return (request, auth) -> {
            if (Boolean.parseBoolean(System.getenv("SWAGGER_ENABLED"))) {
                return AuthorizationDecision.TRUE;
            }
            return AuthorizationDecision.from(
                auth.get().isAuthenticated() &&
                auth.get().getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))
            );
        };
    }
}

// =====================================================================
// RateLimitFilter — thực thi rate limit thực tế, không phải comment
// [IMPROVED v2] Thêm rate limit cho refresh token endpoint
// =====================================================================
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig config;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientId = getClientIdentifier(request);

        Bucket bucket = switch (path) {
            case p when p.startsWith("/api/auth/login") -> config.authBucket(clientId);
            case p when p.startsWith("/api/auth/refresh") -> config.refreshBucket(clientId);  // [IMPROVED v2]
            case p when p.startsWith("/api/bookings") -> config.bookingBucket(clientId);
            case p when p.startsWith("/api/crm/leads") -> config.leadBucket(clientId);
            default -> null;
        };

        if (bucket != null) {
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            response.addHeader("X-Rate-Limit-Limit", String.valueOf(bucket.getAvailableTokens()));

            if (!probe.isConsumed()) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                    "{\"error\":\"Too many requests\",\"retryAfter\":" +
                    probe.getNanosToWaitForRefill() / 1_000_000 + "}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String getClientIdentifier(HttpServletRequest request) {
        // Ưu tiên X-Forwarded-For (đằng sau Nginx), fallback IP
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded != null ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
        // Với chatbot: dùng session ID thay vì IP để per-session limit
        String sessionId = request.getHeader("X-Session-Id");
        return sessionId != null ? "chatbot:" + sessionId : "ip:" + ip;
    }
}

// =====================================================================
// [IMPROVED v2] Account Lockout Service — chống brute-force login
// =====================================================================
@Service
@RequiredArgsConstructor
public class AccountLockoutService {

    private final UserRepository userRepository;
    private final StringRedisTemplate redis;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(30);
    private static final String LOCKOUT_PREFIX = "auth:lockout:";

    public void recordFailedLogin(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return;

        int attempts = user.getFailedAttempts() + 1;
        user.setFailedAttempts(attempts);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(Instant.now().plus(LOCKOUT_DURATION));
            log.warn("Account locked due to {} failed attempts: {}", attempts, email);
        }

        userRepository.save(user);
    }

    public void resetFailedAttempts(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setFailedAttempts(0);
            user.setLockedUntil(null);
            user.setLastLoginAt(Instant.now());
            userRepository.save(user);
        });
    }

    public boolean isLocked(String email) {
        return userRepository.findByEmail(email)
            .map(user -> user.getLockedUntil() != null
                && user.getLockedUntil().isAfter(Instant.now()))
            .orElse(false);
    }

    // Fallback check via Redis (faster than DB query)
    public boolean isLockedRedis(String email) {
        return Boolean.TRUE.equals(
            redis.hasKey(LOCKOUT_PREFIX + email));
    }
}
```

### JWT Token (RS256)

```java
// Access Token: 15 phút
// Refresh Token: 7 ngày (rotation enabled)
// Algorithm: RS256 (private key sign, public key verify)
// Key Rotation: generate key pair mới, sign token mới bằng key mới
// Token format: { header: { alg: RS256, kid: keyId }, body: {...}, signature }

// [IMPROVED v2] Dùng RSA key pair thay vì JWT_SECRET string
// Key paths được đọc từ config/file system, không hardcode trong code

public record JwtClaims(
    UUID sub,           // userId
    String email,
    String role,
    List<String> permissions,
    String jti,         // JWT ID — dùng cho refresh token revocation
    Instant iat,
    Instant exp
) {}

// Token Pair
public record TokenPair(
    String accessToken,
    String refreshToken,
    Instant accessTokenExpiry,
    Instant refreshTokenExpiry
) {}

// =====================================================================
// JWT Key Management — RS256 với Key Rotation
// [IMPROVED v2] Sử dụng RSA key files thay vì JWT_SECRET string
// =====================================================================
// Generate RSA key pair:
//   openssl genrsa -out jwt-private.pem 2048
//   openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
// Lưu trong: /keys/jwt-private.pem, /keys/jwt-public.pem
// =====================================================================
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    @Value("${app.jwt.private-key-path}")
    private Path privateKeyPath;

    @Value("${app.jwt.public-key-path}")
    private Path publicKeyPath;

    @Value("${app.jwt.access-token-expiry:15m}")
    private Duration accessTokenExpiry;

    @Value("${app.jwt.refresh-token-expiry:7d}")
    private Duration refreshTokenExpiry;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    @PostConstruct
    public void init() throws Exception {
        this.privateKey = loadPrivateKey(privateKeyPath);
        this.publicKey = loadPublicKey(publicKeyPath);
    }

    // RS256: sign bằng private key, verify bằng public key
    public String generateAccessToken(User user) {
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("role", user.getRole().name())
            .claim("permissions", user.getPermissions())
            .id(UUID.randomUUID().toString())  // jti
            .issuedAt(Instant.now())
            .expiration(accessTokenExpiry)
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact();
    }

    // Refresh token với ROTATION + replay detection
    @Transactional
    public TokenPair rotateRefreshToken(String oldRefreshToken) {
        Claims claims = parseRefreshToken(oldRefreshToken);

        // 1. Kiểm tra token ĐÃ bị revoke chưa (replay attack detection)
        String jti = claims.getId();
        if (refreshTokenStore.isRevoked(jti)) {
            // ⚠️ TOKEN REUSE → revoke TẤT CẢ token của user
            String userId = claims.getSubject();
            refreshTokenStore.revokeAllForUser(userId);
            throw new SecurityException("Refresh token reuse detected");
        }

        // 2. Revoke token cũ
        refreshTokenStore.revoke(jti);

        // 3. Tạo cặp token mới
        User user = userRepository.findById(UUID.fromString(claims.getSubject()))
            .orElseThrow(() -> new UnauthorizedException("User not found"));
        return createTokenPair(user);
    }

    public JwtDecoder jwtDecoder() {
        return new NimbusJwtDecoderWithPublicKey(this.publicKey);
    }
}

// =====================================================================
// Refresh Token Store (Redis) — rotation + replay detection
// =====================================================================
@Component
@RequiredArgsConstructor
public class RefreshTokenStore {

    private final StringRedisTemplate redis;

    private static final String REVOKE_PREFIX = "jwt:revoked:";
    private static final String USER_TOKENS_PREFIX = "jwt:user:";

    public void revoke(String jti) {
        long ttl = calculateRemainingTtl(jti);
        redis.opsForValue().set(REVOKE_PREFIX + jti, "1", Duration.ofSeconds(ttl));
    }

    public boolean isRevoked(String jti) {
        return Boolean.TRUE.equals(redis.hasKey(REVOKE_PREFIX + jti));
    }

    // Revoke TẤT CẢ token của user (khi phát hiện reuse attack)
    public void revokeAllForUser(String userId) {
        Set<String> tokens = redis.opsForSet().members(USER_TOKENS_PREFIX + userId);
        if (tokens != null) {
            for (String token : tokens) {
                redis.delete(REVOKE_PREFIX + token);
            }
        }
        redis.delete(USER_TOKENS_PREFIX + userId);
    }

    public void saveForUser(String userId, String jti) {
        redis.opsForSet().add(USER_TOKENS_PREFIX + userId, jti);
        redis.expire(USER_TOKENS_PREFIX + userId, Duration.ofDays(8));
    }
}

// =====================================================================
// Origin Validation Filter — chống CSRF + redirect attacks
// =====================================================================
public class OriginValidationFilter extends OncePerRequestFilter {

    private static final Set<String> ALLOWED_ORIGINS = Set.of(
        "https://lawfirm.vn",
        "https://www.lawfirm.vn",
        "http://localhost:3000",
        "http://localhost:5173"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain chain) throws IOException, ServletException {
        String origin = request.getHeader("Origin");

        if (origin != null && !ALLOWED_ORIGINS.contains(origin)) {
            String referer = request.getHeader("Referer");
            if (referer == null || !isRefererAllowed(referer)) {
                log.warn("Blocked request from untrusted origin: {}", origin);
                response.setStatus(403);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Forbidden: invalid origin\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isRefererAllowed(String referer) {
        return ALLOWED_ORIGINS.stream().anyMatch(referer::startsWith);
    }
}

// =====================================================================
// [IMPROVED v2] Webhook HMAC Verification — chống replay attack
// =====================================================================
@Service
@RequiredArgsConstructor
public class WebhookVerificationService {

    private static final Duration MAX_TIMESTAMP_DRIFT = Duration.ofMinutes(5);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    @Value("${app.webhook.secret}")
    private String webhookSecret;

    public void verifySignature(String payload, String signature, String timestamp) {
        // 1. Verify timestamp không quá cũ (chống replay attack)
        Instant requestTime = Instant.ofEpochSecond(Long.parseLong(timestamp));
        Instant now = Instant.now();
        if (Duration.between(requestTime, now).abs().compareTo(MAX_TIMESTAMP_DRIFT) > 0) {
            throw new SecurityException("Webhook timestamp expired or invalid");
        }

        // 2. Verify HMAC-SHA256 signature
        String expectedSignature = computeHmac(payload + timestamp, webhookSecret);
        if (!secureCompare(expectedSignature, signature)) {
            throw new SecurityException("Invalid webhook signature");
        }
    }

    private String computeHmac(String data, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(keySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(rawHmac);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }

    // Constant-time comparison để chống timing attacks
    private boolean secureCompare(String expected, String actual) {
        if (expected == null || actual == null || expected.length() != actual.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < expected.length(); i++) {
            result |= expected.charAt(i) ^ actual.charAt(i);
        }
        return result == 0;
    }
}

// =====================================================================
// [IMPROVED v2] Webhook Controller với HMAC verification
// =====================================================================
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookVerificationService webhookVerification;
    private final SmsService smsService;

    @PostMapping("/sms")
    public ResponseEntity<?> handleSmsWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Webhook-Signature") String signature,
            @RequestHeader("X-Webhook-Timestamp") String timestamp) {

        webhookVerification.verifySignature(payload, signature, timestamp);

        SmsWebhookPayload smsPayload = objectMapper.readValue(payload, SmsWebhookPayload.class);
        smsService.handleDeliveryReport(smsPayload);

        return ResponseEntity.ok().build();
    }
}
```

## 5.2 Booking Flow

```
1. POST /api/bookings
   ├── Validate: phone, email, lawyer available, slot not taken
   ├── [IMPROVED v2] CAPTCHA verification — chống bot book lịch hàng loạt
   ├── PESSIMISTIC LOCK on availability_slot row
   │   @Lock(LockModeType.PESSIMISTIC_WRITE)
   │   SELECT * FROM availability_slots WHERE id = ? FOR UPDATE
   ├── Double-check: slot still available (race condition guard)
   ├── Generate OTP 6-digit → Hash SHA-256 → Redis (TTL 5 phút)
   ├── Send OTP via SMS (RabbitMQ → NotificationConsumer)
   └── Return: { bookingId, status: PENDING }

2. POST /api/bookings/{id}/verify
   ├── Validate OTP (Redis lookup → compare hash)
   ├── PESSIMISTIC LOCK on appointment + availability_slot
   ├── Update status = CONFIRMED
   ├── Update availability_slot: set appointment_id, is_available = false
   ├── Publish outbox event "AppointmentConfirmed"
   ├── Send confirmation email/SMS (RabbitMQ async)
   ├── Create lead if new client
   └── Return: appointment details + meeting link

2b. POST /api/bookings/{id}/resend-otp
   ├── Rate limit check (3 lần/giờ/IP)
   ├── Generate new OTP → update Redis (TTL 5 phút)
   ├── Publish "OtpResent" event → SMS notification
   └── Return: { message: "OTP đã được gửi lại" }

2c. POST /api/bookings/{id}/cancel (client self-cancel)
   ├── Verify: appointment chưa xác nhận, status = PENDING
   ├── PESSIMISTIC LOCK on appointment + availability_slot
   ├── Optional: verify cancel OTP để confirm
   ├── Update status = CANCELLED
   ├── Release availability slot: appointment_id = null, is_available = true
   ├── Publish "AppointmentCancelled" → notify lawyer/CSKH
   └── Return: { message: "Đã hủy lịch hẹn" }

3. Scheduler: appointment-reminder-job
   ├── T-24h: send email reminder
   ├── T-2h: send SMS reminder
   └── Auto-cancel: not confirmed within 4h → status = CANCELLED
```

**[IMPROVED v2] Separate Booking Action Endpoints:**

Thay vì 1 endpoint `PATCH /api/bookings/{id}` xử lý nhiều action khác nhau, tách rõ ràng:

```java
// Reschedule appointment
@PatchMapping("/{id}/reschedule")
public ResponseEntity<AppointmentDTO> reschedule(
        @PathVariable UUID id,
        @RequestBody @Valid RescheduleRequest request) {
    // Đổi giờ hẹn
}

// Assign lawyer
@PatchMapping("/{id}/assign")
public ResponseEntity<AppointmentDTO> assignLawyer(
        @PathVariable UUID id,
        @RequestBody @Valid AssignLawyerRequest request) {
    // Gán luật sư khác
}

// Update status (CSKH)
@PatchMapping("/{id}/status")
public ResponseEntity<AppointmentDTO> updateStatus(
        @PathVariable UUID id,
        @RequestBody @Valid UpdateStatusRequest request) {
    // Đổi status: PENDING → CONFIRMED, CONFIRMED → COMPLETED, etc.
}

// Add internal notes
@PatchMapping("/{id}/notes")
public ResponseEntity<AppointmentDTO> addNotes(
        @PathVariable UUID id,
        @RequestBody @Valid AddNotesRequest request) {
    // Thêm ghi chú nội bộ
}
```

**Race Condition Prevention — dual strategy:**

| Layer | Mechanism | Purpose |
|---|---|---|
| Application | `@Lock(PESSIMISTIC_WRITE)` on slot row | Serializes concurrent booking attempts |
| Database | Partial unique index on `(lawyer_id, slot_date, start_time)` WHERE `appointment_id IS NOT NULL` | Last-resort guard — fails INSERT if duplicate |

## 5.3 Lead Deduplication

```java
@Service
@RequiredArgsConstructor
public class LeadDeduplicationService {

    public String computeHash(String phone, String email) {
        String raw = ((phone != null ? phone : "") + "|" +
                      (email != null ? email : "")).toLowerCase().trim();
        return DigestUtils.sha256Hex(raw);
    }

    @Transactional
    public Lead createLead(LeadRequest request) {
        String hash = computeHash(request.phone(), request.email());

        Optional<Lead> existing = leadRepository.findByDuplicateHash(hash);
        if (existing.isPresent()) {
            Lead lead = existing.get();
            // Chỉ cập nhật timestamp, KHÔNG tự động đổi status
            // Status quản lý bởi nhân viên CRM — tránh mất dữ liệu trạng thái
            lead.setLastContactAt(Instant.now());
            lead.setUpdatedAt(Instant.now());
            // Ghi nhận message mới nhất nếu có
            if (request.message() != null && !request.message().isBlank()) {
                String existingMsg = lead.getNotes() != null ? lead.getNotes() + "\n" : "";
                lead.setNotes(existingMsg + "[" + Instant.now() + "] (dup) " + request.message());
            }
            return leadRepository.save(lead);
        }

        Lead lead = Lead.builder()
            .name(request.name())
            .email(request.email())
            .phone(request.phone())
            .serviceId(request.serviceId())
            .message(request.message())
            .source(request.source())
            .duplicateHash(hash)
            .status(LeadStatus.NEW)
            .firstContactAt(Instant.now())
            .build();

        eventPublisher.publish(lead, "LeadCreated");
        return leadRepository.save(lead);
    }
}
```

## 5.4 Chatbot Architecture

```
User → ChatbotController → ChatSessionService (Redis)
         │
         ├─ IntentClassifier (Rule-based keyword matching)
         │    ├─ Greeting
         │    ├─ Service inquiry
         │    ├─ Booking intent
         │    └─ FAQ match
         │
         ├─ (confidence < 70%) → OpenAI GPT-4o
         │
         └─ LeadService (if contact info collected)
              └─ LeadRepository.save()
```

**Chatbot History — Security:**

```java
@GetMapping("/history/{sessionId}")
public ResponseEntity<ChatbotResponse> getHistory(
        @PathVariable String sessionId,
        @RequestHeader(value = "X-Session-Id", required = false) String headerSessionId) {

    // BẮT BUỘC: validate session ownership
    // Client gửi sessionId qua path PHẢI khớp với session đang active
    if (!chatSessionService.isOwner(sessionId, headerSessionId)) {
        throw new UnauthorizedException("Access denied to this chat session");
    }

    List<ChatMessage> messages = chatSessionService.getHistory(sessionId);
    return ResponseEntity.ok(ChatbotResponse.of(messages));
}
```

## 5.5 Notification (RabbitMQ Async)

```java
// Outbox Pattern
@Service
@RequiredArgsConstructor
public class OutboxEventProcessor {
    
    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void processOutbox() {
        List<OutboxEvent> events = outboxRepository
            .findTop50ByProcessedFalseOrderByCreatedAtAsc();

        if (events.isEmpty()) return;

        List<OutboxEvent> toSave = new ArrayList<>(events.size());

        for (OutboxEvent event : events) {
            try {
                processEvent(event);
                event.setProcessed(true);
                event.setProcessedAt(Instant.now());
            } catch (Exception e) {
                log.error("Failed to process event: {}", event.getId(), e);
                event.setProcessed(false); // keep for retry on next run
            }
            toSave.add(event);
        }

        // Bulk save: 1 batch UPDATE instead of N individual saves
        outboxRepository.saveAll(toSave);
    }

    // Fallback: raw bulk update query for high-throughput scenarios
    // Uses @Modifying @Query to bypass Hibernate first-level cache
    // UPDATE outbox_events SET processed = TRUE, processed_at = NOW()
    // WHERE id = ANY($1::uuid[]) AND processed = FALSE
}

// Notification Queue
@Bean
public Queue notificationQueue() {
    return QueueBuilder.durable("notification.events")
        .withArgument("x-dead-letter-exchange", "dlx")
        .build();
}

@Service
@RequiredArgsConstructor
public class NotificationConsumer {
    
    @RabbitListener(queues = "notification.events")
    public void handle(NotificationEvent event) {
        switch (event.getChannel()) {
            case EMAIL -> emailService.send(event);
            case SMS -> smsService.send(event);
        }
    }
}
```

## 5.6 Caching Strategy

```java
// =====================================================================
// Redis Cache Config — Stampede Protection + Distributed Invalidation
// =====================================================================
@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory)
            .withCacheConfiguration("services",
                baseConfig().entryTtl(Duration.ofMinutes(5)))
            .withCacheConfiguration("lawyers",
                baseConfig().entryTtl(Duration.ofMinutes(5)))
            .withCacheConfiguration("faqs",
                baseConfig().entryTtl(Duration.ofMinutes(10)))
            .withCacheConfiguration("posts",
                baseConfig().entryTtl(Duration.ofMinutes(2)))
            .withCacheConfiguration("search",
                baseConfig().entryTtl(Duration.ofMinutes(1)))
            .withCacheConfiguration("chatbot-sessions",
                baseConfig().entryTtl(Duration.ofMinutes(30)))
            .withCacheConfiguration("locale-keys",
                baseConfig().entryTtl(Duration.ofHours(1)))
            .build();
    }

    private RedisCacheConfiguration baseConfig() {
        return RedisCacheConfiguration.defaultCacheConfig()
            .serializeValuesWith(SerializationPair.fromSerializer(
                new GenericJackson2JsonRedisSerializer()))
            .prefixCacheNameWith("brs:");
    }

    @Bean
    public RedissonClient redissonClient(RedisConnectionFactory factory) {
        Config config = new Config();
        config.useSingleServer()
            .setAddress("redis://" + factory.getHostAndPort())
            .setConnectionMinimumIdleSize(5)
            .setConnectionPoolSize(20);
        return Redisson.create(config);
    }
}

// =====================================================================
// Cache Service — Stampede Protection + Stale-While-Revalidate
// =====================================================================
@Service
@RequiredArgsConstructor
public class CacheService {

    private final RedissonClient redisson;
    private final StringRedisTemplate redis;

    // Stampede protection: dùng distributed lock để chỉ 1 request query DB
    // Request khác dùng stale cache trong lúc lock
    public <T> T getOrLoad(String cacheName, String key,
                           Supplier<T> loader,
                           Duration ttl,
                           Duration staleTtl) {
        String fullKey = cacheName + ":" + key;
        String cached = redis.opsForValue().get(fullKey);

        if (cached != null) {
            return deserialize(cached);
        }

        // Cache miss → acquire lock
        String lockKey = "lock:" + fullKey;
        RLock lock = redisson.getLock(lockKey);

        try {
            // Non-blocking: try lock với timeout = 0 (không đợi)
            boolean acquired = lock.tryLock(0, ttl.toMillis(), TimeUnit.MILLISECONDS);
            if (!acquired) {
                // Lock đang được giữ bởi request khác → đọc stale cache
                String stale = redis.opsForValue().get(fullKey + ":stale");
                if (stale != null) {
                    log.debug("Using stale cache for {}", fullKey);
                    return deserialize(stale);
                }
                // Chờ tối đa 5s
                acquired = lock.tryLock(5, TimeUnit.SECONDS);
            }

            if (acquired) {
                try {
                    T result = loader.get();
                    // Lưu fresh cache
                    redis.opsForValue().set(fullKey, serialize(result), ttl);
                    // Lưu stale cache (sẽ hết hạn sau fresh TTL)
                    redis.opsForValue().set(fullKey + ":stale", serialize(result),
                        ttl.plus(staleTtl));
                    return result;
                } finally {
                    lock.unlock();
                }
            } else {
                throw new CacheException("Failed to acquire cache lock: " + fullKey);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CacheException("Cache lock interrupted: " + fullKey, e);
        }
    }

    // Distributed cache invalidation — evict trên toàn bộ node
    public void evict(String cacheName, String key) {
        String fullKey = cacheName + ":" + key;
        redis.delete(fullKey);
        redis.delete(fullKey + ":stale");
        // Publish eviction event → các node khác tự động evict
        redis.convertAndSend("cache:evict", cacheName + ":" + key);
    }

    // [IMPROVED v2] Cache warming: chạy khi startup với proper async + error handling
    @EventListener(ApplicationReadyEvent.class)
    public void warmCache() {
        log.info("Cache warming: starting...");

        CompletableFuture.allOf(
            CompletableFuture.runAsync(() -> warmServices()),
            CompletableFuture.runAsync(() -> warmLawyers()),
            CompletableFuture.runAsync(() -> warmFaqs()),
            CompletableFuture.runAsync(() -> warmCategories())
        ).exceptionally(ex -> {
            log.error("Cache warming failed", ex);
            return null;
        });

        log.info("Cache warming: completed");
    }

    private void warmServices() {
        try {
            List<ServiceEntity> services = serviceRepository.findByIsActiveTrue();
            services.forEach(s -> redis.opsForValue().set(
                "brs:services:" + s.getSlug(),
                serialize(s),
                Duration.ofMinutes(5)));
            log.info("Warmed {} services", services.size());
        } catch (Exception e) {
            log.warn("Failed to warm services cache", e);
        }
    }

    private void warmLawyers() { /* ... */ }
    private void warmFaqs() { /* ... */ }
    private void warmCategories() { /* ... */ }
}

// =====================================================================
// Redis Pub/Sub — Cache Invalidation Across Nodes
// =====================================================================
@Configuration
public class CacheInvalidationListener {

    @Bean
    public MessageListenerAdapter cacheInvalidationReceiver(CacheInvalidationService service) {
        return new MessageListenerAdapter((msg) -> {
            String key = new String(msg.getBody());
            log.debug("Received cache eviction: {}", key);
            service.evictLocally(key);
        });
    }

    @Bean
    public ChannelTopic cacheEvictionTopic() {
        return new ChannelTopic("cache:evict");
    }
}

// =====================================================================
// [IMPROVED v2] Redis Health Indicator — fallback khi Redis down
// =====================================================================
@Component
@RequiredArgsConstructor
@Slf4j
public class RedisHealthIndicator implements HealthIndicator {

    private final StringRedisTemplate redisTemplate;

    @Override
    public Health health() {
        try {
            String pong = redisTemplate.getConnectionFactory()
                .getConnection().ping();
            return Health.up()
                .withDetail("ping", pong)
                .withDetail("database", "Redis")
                .build();
        } catch (Exception e) {
            log.error("Redis health check failed", e);
            return Health.down()
                .withDetail("error", e.getMessage())
                .withException(e)
                .build();
        }
    }
}

// =====================================================================
// [IMPROVED v2] Cache Fallback — Caffeine local cache khi Redis down
// =====================================================================
@Configuration
@EnableConfigurationProperties(CacheProperties.class)
public class CacheFallbackConfig {

    @Bean
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(5)));
        return cacheManager;
    }
}

// =====================================================================
// [IMPROVED v2] ETag Support cho Public Endpoints — giảm bandwidth
// =====================================================================
@RestController
@RequiredArgsConstructor
public class PublicServiceController {

    private final ServiceEntityService serviceEntityService;
    private final StringRedisTemplate redis;

    @GetMapping("/api/public/services")
    public ResponseEntity<List<ServiceDTO>> getServices(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {

        List<ServiceDTO> services = serviceEntityService.getActiveServices();
        String etag = computeEtag(services);

        if (etag.equals(ifNoneMatch)) {
            return ResponseEntity.status(304).build();  // Not Modified
        }

        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)))
            .eTag(etag)
            .body(services);
    }

    private String computeEtag(Object data) {
        try {
            return "\"" + DigestUtils.sha256Hex(
                objectMapper.writeValueAsString(data)
            ).substring(0, 16) + "\"";
        } catch (JsonProcessingException e) {
            return "\"" + UUID.randomUUID() + "\"";
        }
    }
}

## 5.7 File Upload (Cloudinary)

```java
// pom.xml dependency
// <dependency>
//     <groupId>com.cloudinary</groupId>
//     <artifactId>cloudinary-http-server</artifactId>
//     <version>2.0.0</version>
// </dependency>

@Configuration
public class CloudinaryConfig {
    
    @Bean
    public Cloudinary cloudinary(
            @Value("${app.cloudinary.cloud-name}") String cloudName,
            @Value("${app.cloudinary.api-key}") String apiKey,
            @Value("${app.cloudinary.api-secret}") String apiSecret) {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret,
            "secure", true
        ));
    }
}

// pom.xml dependency:
// <dependency>
//     <groupId>org.apache.tika</groupId>
//     <artifactId>tika-core</artifactId>
//     <version>2.9.1</version>
// </dependency>

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    private final Cloudinary cloudinary;
    private static final Tika TIKA = new Tika();  // thread-safe, reuse globally

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "jpg", "jpeg", "png", "webp", "gif", "pdf", "doc", "docx"
    );

    private static final Set<String> ALLOWED_MIME_PREFIXES = Set.of(
        "image/", "application/pdf", "application/msword",
        "application/vnd.openxmlformats"
    );

    private static final Map<String, String> FOLDER_MAP = Map.of(
        "avatar", "brs/avatars",
        "lawyer", "brs/lawyers",
        "post", "brs/posts",
        "document", "brs/documents",
        "case-study", "brs/case-studies",
        "job", "brs/jobs"
    );
    
    public String upload(MultipartFile file, String folder) {
        validateFile(file);
        
        String targetFolder = FOLDER_MAP.getOrDefault(folder, "brs/misc");
        String publicId = targetFolder + "/" + UUID.randomUUID();
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", targetFolder,
                    "resource_type", getResourceType(file.getContentType()),
                    "allowed_formats", ALLOWED_EXTENSIONS.toArray(),
                    "transformation", new Transformation()
                        .width(1200)
                        .crop("limit")
                        .quality("auto:good"),
                    "eager", new Transformation().width(400).crop("thumb").chain(),
                    "eager_notification_url", "" // async notification
                )
            );
            
            log.info("Uploaded file: {} → {}", publicId, result.get("secure_url"));
            return (String) result.get("public_id");
            
        } catch (IOException e) {
            throw new BusinessException(ErrorCodes.FILE_UPLOAD_FAILED, 
                "Upload failed: " + e.getMessage());
        }
    }
    
    public String uploadRaw(MultipartFile file, String folder) {
        validateFile(file);

        String targetFolder = FOLDER_MAP.getOrDefault(folder, "brs/misc");
        String publicId = targetFolder + "/" + UUID.randomUUID();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", targetFolder,
                    "resource_type", "raw",
                    "allowed_formats", ALLOWED_EXTENSIONS.toArray()
                )
            );

            // ⚠️ Malware scanning: DOC/PDF → ClamAV hoặc VirusTotal
            String mimeType = getResourceType(file.getContentType());
            if (!"image".equals(mimeType)) {
                String uploadedUrl = (String) result.get("secure_url");
                malwareScanService.scanAsync(publicId, uploadedUrl, file.getBytes(), mimeType);
            }

            return (String) result.get("public_id");
        } catch (IOException e) {
            throw new BusinessException(ErrorCodes.FILE_UPLOAD_FAILED,
                "Upload failed: " + e.getMessage());
        }
    }

// =====================================================================
// Malware Scanning Service — ClamAV / VirusTotal
// =====================================================================
// Workflow: Upload → quarantine (Cloudinary flags) → scan → approved/blocked
@Service
@RequiredArgsConstructor
public class MalwareScanService {

    private final Cloudinary cloudinary;
    private final StringRedisTemplate redis;

    private static final String SCAN_QUEUE = "file:scan:queue";

    // Ưu tiên: ClamAV (self-hosted) → VirusTotal API (backup)
    // ClamAV: chạy container clamav/clamav:latest, port 3310
    // VirusTotal: gọi API /files endpoint, giới hạn 4 req/min (free tier)

    public void scanAsync(String publicId, String url, byte[] content, String resourceType) {
        // Publish vào scan queue (RabbitMQ) → async worker xử lý
        // Quá trình scan không block upload response
        ScanJob job = new ScanJob(publicId, url, resourceType, Instant.now());
        scanQueue.publish(job);
    }

    @RabbitListener(queues = "file.scan")
    public void handleScan(ScanJob job) {
        ScanResult result;

        // Thứ tự ưu tiên: ClamAV local → VirusTotal cloud
        try {
            result = scanWithClamAV(job);
        } catch (Exception e) {
            log.warn("ClamAV failed, fallback to VirusTotal: {}", e.getMessage());
            result = scanWithVirusTotal(job);
        }

        if (result.isMalicious()) {
            // 1. Xóa file khỏi Cloudinary
            deleteFromCloudinary(job.publicId());
            // 2. Ghi log audit
            auditLogService.log(AuditAction.FILE_MALWARE_DETECTED,
                null, null, Map.of("publicId", job.publicId(), "threat", result.threat()));
            log.error("MALWARE DETECTED and removed: {} — {}", job.publicId(), result.threat());
        } else {
            // 3. Đánh dấu approved trong Redis
            redis.opsForValue().set("file:scan:approved:" + job.publicId(), "1", Duration.ofDays(30));
            log.info("File scan passed: {}", job.publicId());
        }
    }

    private ScanResult scanWithClamAV(ScanJob job) throws IOException {
        // Gọi ClamAV TCP socket (clamd daemon)
        // Ví dụ dùng clamav-client library
        ClamAVClient client = new ClamAVClient("clamav", 3310);
        ScanResult result = client.scan(job.content());

        if (result.isMalicious()) {
            return ScanResult.malicious("ClamAV: " + result.description());
        }
        return ScanResult.clean();
    }

    private ScanResult scanWithVirusTotal(ScanJob job) {
        // 1. Upload file hash trước
        String sha256 = DigestUtils.sha256Hex(job.content());
        // 2. Check cache
        ScanResult cached = checkVirusTotalCache(sha256);
        if (cached != null) return cached;

        // 3. Upload + scan
        VirusTotalResponse vt = virusTotalApi.upload(job.content(), sha256);
        if (vt.isMalicious()) {
            return ScanResult.malicious("VT: " + vt.threatCategory());
        }
        return ScanResult.clean();
    }
}
    
    public String getSecureUrl(String publicId) {
        return cloudinary.url()
            .resourceType(getResourceTypeForUrl(publicId))
            .secure(true)
            .generate(publicId);
    }
    
    public String getThumbnailUrl(String publicId, int width, int height) {
        return cloudinary.url()
            .resourceType("image")
            .transformation(new Transformation()
                .width(width)
                .height(height)
                .crop("fill")
                .gravity("auto")
                .quality("auto")
                .fetchFormat("auto"))
            .secure(true)
            .generate(publicId);
    }
    
    public boolean delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            return true;
        } catch (IOException e) {
            log.error("Delete failed for: {}", publicId, e);
            return false;
        }
    }
    
    public Map<String, Object> getMetadata(String publicId) {
        try {
            return cloudinary.api().resource(publicId, ObjectUtils.asMap(
                "colors", true,
                "image_metadata", true
            ));
        } catch (IOException e) {
            log.error("Get metadata failed for: {}", publicId, e);
            return Map.of();
        }
    }
    
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCodes.FILE_EMPTY, "File is empty");
        }

        // Bước 1: Detect MIME thực tế từ byte stream (không tin header từ client)
        String actualMimeType;
        try {
            actualMimeType = TIKA.detect(file.getInputStream(), file.getOriginalFilename());
        } catch (IOException e) {
            throw new BusinessException(ErrorCodes.FILE_UPLOAD_FAILED,
                "Cannot detect file type: " + e.getMessage());
        }

        // Bước 2: Chỉ chấp nhận MIME type đã detect
        if (actualMimeType == null || ALLOWED_MIME_PREFIXES.stream()
                .noneMatch(actualMimeType::startsWith)) {
            throw new BusinessException(ErrorCodes.FILE_TYPE_NOT_ALLOWED,
                "File type not allowed: " + actualMimeType);
        }

        // Bước 3: Validate extension (để xác định resource_type cho Cloudinary)
        String ext = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(ext.toLowerCase())) {
            throw new BusinessException(ErrorCodes.FILE_TYPE_NOT_ALLOWED,
                "Extension not allowed: " + ext);
        }

        // Bước 4: MIME type client gửi phải khớp với detect (detect mismatch = red flag)
        String clientMime = file.getContentType();
        if (clientMime != null && !clientMime.equals(actualMimeType)
                && !isKnownMismatch(clientMime, actualMimeType)) {
            log.warn("MIME type mismatch: client says {} but detected {}",
                clientMime, actualMimeType);
            // Log nhưng vẫn cho qua vì Tika là ground truth
        }

        long maxSize = getMaxSize(actualMimeType);
        if (file.getSize() > maxSize) {
            throw new BusinessException(ErrorCodes.FILE_SIZE_EXCEEDED,
                "File size exceeds " + (maxSize / 1024 / 1024) + "MB limit");
        }
    }

    // Một số extension có MIME variant phổ biến, không coi là attack
    private boolean isKnownMismatch(String clientMime, String detectedMime) {
        Map<String, Set<String>> knownVariants = Map.of(
            "application/octet-stream", Set.of("application/pdf", "application/msword"),
            "text/plain", Set.of("application/pdf")
        );
        return knownVariants.getOrDefault(clientMime, Set.of()).contains(detectedMime);
    }
    
    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
    
    private String getResourceType(String contentType) {
        if (contentType == null) return "raw";
        if (contentType.startsWith("image/")) return "image";
        if (contentType.startsWith("video/")) return "video";
        return "raw";
    }
    
    private String getResourceTypeForUrl(String publicId) {
        if (publicId.contains("/avatars") || publicId.contains("/lawyers") 
                || publicId.contains("/posts") || publicId.contains("/case-studies")) {
            return "image";
        }
        return "raw";
    }
    
    private long getMaxSize(String contentType) {
        if (contentType != null && contentType.startsWith("image/")) {
            return 5L * 1024 * 1024;  // 5 MB for images
        }
        return 10L * 1024 * 1024;       // 10 MB for documents
    }
}
```

**Cloudinary Transformation Examples:**

| Use Case | Transformation |
| :- | :- |
| Lawyer avatar | `c_fill,w_300,h_300,g_face,r_max` |
| Post thumbnail | `c_limit,w_1200,q_auto:good` |
| Case study image | `c_scale,w_800,q_auto` |
| OG image | `c_fill,w_1200,h_630,q_auto` |

**Environment Variables:**

```bash
# .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# 06. IMPLEMENTATION PHASES

## Phase 1: Foundation (Tuần 1–2)

| Task | Deliverable | Priority |
| :- | :- | :- |
| Project scaffolding | Maven project, folder structure | Critical |
| Database migrations (Flyway) | All tables + indexes | Critical |
| Auth module | Login, JWT, User CRUD, RBAC | Critical |
| Security config | Spring Security, CORS, rate limit | Critical |
| Common module | DTOs, exceptions, mapper utilities | Critical |
| Docker Compose | Full local environment | Critical |
| Integration test | Auth flow | High |

## Phase 2: Core Public APIs (Tuần 3–4)

| Task | Deliverable | Priority |
| :- | :- | :- |
| Public Content APIs | Services, Lawyers, FAQs, Reviews | High |
| Full-text Search | PostgreSQL GIN index | High |
| File Upload | Cloudinary integration | High |
| Lead & CRM APIs | Lead capture, Kanban, deduplication | High |
| Newsletter | Double opt-in, unsubscribe | Medium |

## Phase 3: Booking System (Tuần 5–6)

| Task | Deliverable | Priority |
| :- | :- | :- |
| Booking CRUD | Create, verify, update, cancel | Critical |
| OTP System | Redis OTP, SMS integration | Critical |
| Availability System | Slot management, conflict detection | High |
| Outbox & Notifications | Async email/SMS | High |
| Reminder Scheduler | T-24h, T-2h reminders | High |

## Phase 4: Content & Admin (Tuần 7–9)

| Task | Deliverable | Priority |
| :- | :- | :- |
| Content APIs | Posts, Categories, Tags CRUD | High |
| Rich Text Editor | Sanitized HTML storage | High |
| SEO Auto-generation | Meta title/description | Medium |
| Case Studies | CRUD + relations | Medium |
| Job Postings | Job board + applications | Medium |
| Admin Dashboard | Stats, charts, activity | High |
| Audit Logging | Full audit trail | High |

## Phase 5: Chatbot & Polish (Tuần 10–11)

| Task | Deliverable | Priority |
| :- | :- | :- |
| Chatbot Service | Rule-based + AI hybrid | High |
| Redis Sessions | Session management | High |
| Lead Integration | Chatbot → CRM | Medium |
| Performance tuning | Redis caching, query optimization | Medium |
| Security hardening | WAF rules, penetration test | High |

## Phase 6: Deploy & Launch (Tuần 12–13)

| Task | Deliverable | Priority |
| :- | :- | :- |
| CI/CD Pipeline | GitHub Actions | Critical |
| Docker build | Single JAR + Dockerfile | Critical |
| Monitoring | Sentry + logs | High |
| Load testing | k6 performance tests | Medium |
| Documentation | API docs (OpenAPI) | Medium |
| Go-live | Smoke tests, DNS cutover | Critical |

---

# 07. DOCKER DEPLOYMENT

## 7.1 docker-compose.yml

```yaml
version: '3.9'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: docker
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: brs_db
      DB_USER: ${DB_USER:-brs}
      DB_PASSWORD: ${DB_PASSWORD:-brspass}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_PORT: 5672
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME:-your_cloud_name}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY:-your_api_key}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET:-your_api_secret}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
      rabbitmq:
        condition: service_started
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: brs_db
      POSTGRES_USER: ${DB_USER:-brs}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-brspass}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/postgres/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
    restart: unless-stopped

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    command: redis-server --appendonly yes

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmqdata:/var/lib/rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-brs}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-brspass}
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # [IMPROVED v2] ClamAV malware scanning
  clamav:
    image: clamav/clamav:latest
    ports:
      - "3310:3310"
    volumes:
      - clamavdata:/var/lib/clamav
    environment:
      CLAMAV_NO_CLAMD: "false"
      CLAMD_STARTUP_TIMEOUT: "300"
    healthcheck:
      test: ["CMD", "clamd", "--version"]
      interval: 60s
      timeout: 30s
      retries: 3
      start_period: 120s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  rabbitmqdata:
  clamavdata:  # [IMPROVED v2] ClamAV data volume
```

## 7.2 Dockerfile

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Layer 1: chỉ copy pom.xml → cache được khi pom.xml không đổi
COPY pom.xml .
# Tải toàn bộ dependencies xuống local Maven repository
# Layer này chỉ rebuild khi pom.xml thay đổi
RUN { echo "Downloading dependencies..."; \
      mvn dependency:go-offline -q -B -DskipTests; } 2>&1 | tail -3

# Layer 2: copy source code → chỉ rebuild khi code thay đổi
COPY src ./src

# Layer 3: compile + package — dependencies đã có sẵn ở layer 1
RUN mvn clean package -q -DskipTests -Pprod

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY docker-entrypoint.sh .

RUN apk add --no-cache curl bash
RUN chmod +x docker-entrypoint.sh

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health/liveness \
    && curl -f http://localhost:8080/actuator/health/readiness \
    || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
```

---

# 08. APPLICATION CONFIGURATION

## application.yml (Production)

```yaml
server:
  port: 8080
  shutdown: graceful
  # [IMPROVED v2] Graceful shutdown timeout
  spring:
    lifecycle:
      timeout-per-shutdown-phase: 30s
  tomcat:
    threads:
      max: 200
      min-spare: 10
    max-connections: 10000

spring:
  application:
    name: brs-backend
  profiles:
    active: ${SPRING_PROFILES:active}
  
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:brs_db}
    username: ${DB_USER:brs}
    password: ${DB_PASSWORD:brspass}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000
  
  jpa:
    open-in-view: false
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
    hibernate:
      ddl-auto: validate
    show-sql: false
  
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
  
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      timeout: 2000ms
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 4
  
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:brs}
    password: ${RABBITMQ_PASSWORD:brspass}
  
  mail:
    host: smtp.sendgrid.net
    port: 587
    username: apikey
    password: ${SENDGRID_API_KEY}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 50MB

app:
  # [IMPROVED v2] Dùng RSA key pair paths thay vì JWT_SECRET string
  jwt:
    # Generate keys: openssl genrsa -out jwt-private.pem 2048 && openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
    private-key-path: ${JWT_PRIVATE_KEY_PATH:/keys/jwt-private.pem}
    public-key-path: ${JWT_PUBLIC_KEY_PATH:/keys/jwt-public.pem}
    access-token-expiry: 15m
    refresh-token-expiry: 7d

  # [IMPROVED v2] Webhook HMAC secret
  webhook:
    secret: ${WEBHOOK_SECRET:change-this-in-production}

  cors:
    allowed-origins:
      - "http://localhost:3000"
      - "https://lawfirm.vn"
      - "https://www.lawfirm.vn"
    allowed-methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
    max-age: 3600
  
  rate-limit:
    auth: 5         # requests per minute per IP
    booking: 3      # requests per minute per IP
    lead: 5         # requests per minute per IP
    search: 60      # requests per minute per IP
    chatbot-per-session: 30  # requests per minute per chatbot session
  # ⚠️ Rate limit được enforce thực tế bởi RateLimitFilter + Bucket4j/Redis
  # Giá trị trên là config thực, KHÔNG phải comment document
  
  cloudinary:
    cloud-name: ${CLOUDINARY_CLOUD_NAME:}
    api-key: ${CLOUDINARY_API_KEY:}
    api-secret: ${CLOUDINARY_API_SECRET:}

  openai:
    api-key: ${OPENAI_API_KEY:}
    model: gpt-4o
    temperature: 0.3
  
  sms:
    provider: ${SMS_PROVIDER:}
    api-key: ${SMS_API_KEY:}

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
    # Chỉ bật Swagger UI trên môi trường dev/staging
    # Production: set SPRING_PROFILES=prod → springdoc tự động bị vô hiệu hóa
    enabled: ${SWAGGER_ENABLED:false}
    # Bảo mật: chỉ cho phép truy cập Swagger khi có role ADMIN
    # Viết filter check: nếu request /swagger-ui/** mà không có JWT hợp lệ → 401

management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true  # [IMPROVED v2] Kubernetes readiness/liveness probes
  health:
    readiness-state:
      enabled: true
    liveness-state:
      enabled: true
  # [IMPROVED v2] Tách metrics endpoint ra service riêng, không expose trực tiếp
  # metrics.export.prometheus.enabled: false

logging:
  level:
    root: INFO
    com.lawfirm.brs: DEBUG
    org.springframework.security: WARN
    org.hibernate.SQL: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

---

# 09. DEVELOPMENT SETUP

## 9.1 Prerequisites

- Java 21 LTS
- Maven 3.9+
- Docker & Docker Compose
- (Optional) IntelliJ IDEA Ultimate cho Spring Boot support

## 9.2 Quick Start

```bash
# 1. Clone và cd vào project
cd brs-backend

# 2. Tạo file .env
cp .env.example .env
# Edit .env với các giá trị phù hợp

# 3. Start infrastructure
docker compose up -d postgres redis rabbitmq

# 4. Build và run
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Hoặc build JAR và chạy với Docker
./scripts/build.sh
docker compose up -d
```

---

# 10. TESTING STANDARDS [IMPROVED v2]

## 10.1 Testing Philosophy

- **TDD (Test-Driven Development)**: Viết test TRƯỚC khi implement
  1. RED: Viết unit test → test fail
  2. GREEN: Implement code để pass test
  3. REFACTOR: Cải thiện code mà vẫn pass test

## 10.2 Test Coverage Requirements

| Layer | Coverage Target | Test Types |
| :- | :- | :- |
| **Service layer** | 80%+ line coverage | JUnit 5 + Mockito |
| **Controller layer** | 70%+ line coverage | MockMvc / REST Assured |
| **Critical paths** (auth, booking, payment) | 90%+ branch coverage | Integration tests |
| **Repository layer** | Query correctness | Integration tests |

## 10.3 Test Types

### Unit Tests (Service Layer)

```java
@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private OtpService otpService;
    @InjectMocks private BookingService bookingService;

    @Test
    void shouldCreateBooking_WhenSlotIsAvailable() {
        // Given
        UUID lawyerId = UUID.randomUUID();
        AvailabilitySlot slot = createAvailableSlot(lawyerId);
        when(availabilitySlotRepository.findByIdWithLock(slot.getId()))
            .thenReturn(Optional.of(slot));

        // When
        Appointment result = bookingService.createBooking(request);

        // Then
        assertNotNull(result);
        assertEquals(AppointmentStatus.PENDING, result.getStatus());
        verify(otpService).sendOtp(anyString());
    }

    @Test
    void shouldThrowException_WhenSlotAlreadyTaken() {
        // Test race condition prevention
    }
}
```

### Integration Tests (với Testcontainers)

```java
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class BookingFlowIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7.2")
        .withExposedPorts(6379);

    @Test
    void shouldPreventDoubleBooking() {
        // 2 concurrent requests → chỉ 1 thành công
        CountDownLatch latch = new CountDownLatch(2);
        AtomicInteger successCount = new AtomicInteger(0);

        // Launch 2 concurrent booking attempts
        CompletableFuture.allOf(
            CompletableFuture.runAsync(() -> book(latch, successCount)),
            CompletableFuture.runAsync(() -> book(latch, successCount))
        ).join();

        // Assert: chỉ 1 booking thành công
        assertEquals(1, successCount.get());
    }
}
```

### Performance Tests (k6)

```javascript
// k6/booking-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.post('http://localhost:8080/api/bookings', JSON.stringify({
    phone: '0912345678',
    email: 'test@example.com',
    lawyerId: '...',
    scheduledAt: '2026-06-01T10:00:00Z'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
```

## 10.4 CI/CD Testing Pipeline

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: brs_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      redis:
        image: redis:7.2
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Run unit tests
        run: mvn test -Dtest=*ServiceTest -DfailIfNoTests=false

      - name: Run integration tests
        run: mvn verify -Dspring.profiles.active=test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: target/site/jacoco/jacoco.xml
```

---

# 11. ERROR RESPONSE FORMAT [IMPROVED v2]

## 11.1 Standard Error Response

Tất cả errors trả về theo format chuẩn:

```java
public record ErrorResponse(
    String error,           // Mã lỗi: "VALIDATION_ERROR", "NOT_FOUND"
    String message,         // Message human-readable (i18n key)
    String path,            // Request path
    Instant timestamp,      // Server timestamp
    String traceId,         // Distributed trace ID
    Map<String, String> details  // Field-level errors (optional)
) {}
```

**Example Error Responses:**

```json
// 400 Bad Request - Validation Error
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "path": "/api/bookings",
  "timestamp": "2026-05-28T10:30:00Z",
  "traceId": "abc123def456",
  "details": {
    "phone": "Số điện thoại không hợp lệ",
    "email": "Email không được trống"
  }
}

// 401 Unauthorized
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required",
  "path": "/api/bookings",
  "timestamp": "2026-05-28T10:30:00Z",
  "traceId": "abc123def456"
}

// 404 Not Found
{
  "error": "NOT_FOUND",
  "message": "Appointment not found",
  "path": "/api/bookings/550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-05-28T10:30:00Z",
  "traceId": "abc123def456"
}

// 429 Too Many Requests
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "path": "/api/auth/login",
  "timestamp": "2026-05-28T10:30:00Z",
  "traceId": "abc123def456",
  "details": {
    "retryAfter": "60"
  }
}

// 500 Internal Server Error
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "path": "/api/bookings",
  "timestamp": "2026-05-28T10:30:00Z",
  "traceId": "abc123def456"
}
```

## 11.2 Global Exception Handler

```java
@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalExceptionHandler {

    private final ObjectMapper objectMapper;

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                e -> e.getDefaultMessage() != null ? e.getDefaultMessage() : "Invalid value",
                (a, b) -> a  // Keep first error if duplicate
            ));

        return ResponseEntity.badRequest().body(new ErrorResponse(
            "VALIDATION_ERROR",
            "Request validation failed",
            getCurrentPath(),
            Instant.now(),
            MDC.get("traceId"),
            errors
        ));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(new ErrorResponse(
            "NOT_FOUND",
            ex.getMessage(),
            getCurrentPath(),
            Instant.now(),
            MDC.get("traceId"),
            null
        ));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimit(RateLimitExceededException ex) {
        return ResponseEntity.status(429).body(new ErrorResponse(
            "RATE_LIMIT_EXCEEDED",
            "Too many requests. Please try again later.",
            getCurrentPath(),
            Instant.now(),
            MDC.get("traceId"),
            Map.of("retryAfter", String.valueOf(ex.getRetryAfterSeconds()))
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(500).body(new ErrorResponse(
            "INTERNAL_ERROR",
            "An unexpected error occurred",
            getCurrentPath(),
            Instant.now(),
            MDC.get("traceId"),
            null
        ));
    }
}
```

## 11.3 Error Codes Reference

| HTTP Status | Error Code | Mô tả |
| :- | :- | :- |
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 400 | `INVALID_REQUEST` | Request format invalid |
| 401 | `UNAUTHORIZED` | Authentication required |
| 401 | `TOKEN_EXPIRED` | JWT token expired |
| 401 | `TOKEN_INVALID` | JWT token invalid |
| 403 | `FORBIDDEN` | Access denied |
| 403 | `ACCOUNT_LOCKED` | Account temporarily locked |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (e.g., slot taken) |
| 422 | `BUSINESS_ERROR` | Business rule violation |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Internal server error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

# 12. IMPROVEMENTS SUMMARY [IMPROVED v2]

## 12.1 Priority Matrix

| Ưu tiên | Improvement | Impact | Effort |
| :- | :- | :- | :- |
| **HIGH** | Hash OTP before storing | Security | Low |
| **HIGH** | Add version column to appointments | Data integrity | Low |
| **HIGH** | CAPTCHA for booking endpoint | Security | Medium |
| **HIGH** | Use RSA key pair properly for RS256 | Security | Medium |
| **HIGH** | Add optimistic locking for appointment updates | Data integrity | Low |
| **MEDIUM** | Cursor-based pagination for large lists | Performance | Medium |
| **MEDIUM** | Structured error response format | Developer experience | Medium |
| **MEDIUM** | Cache fallback when Redis down | Reliability | Medium |
| **MEDIUM** | Lock account after failed login | Security | Low |
| **MEDIUM** | Webhook HMAC verification | Security | Medium |
| **LOW** | ETag support for public endpoints | Performance | Low |
| **LOW** | Separate booking PATCH endpoints | Code quality | Medium |
| **LOW** | Test coverage documentation | Process | Low |
| **LOW** | ClamAV malware scanning | Security | Medium |
| **LOW** | Account lockout fields | Security | Low |

## 12.2 Files to Update

| Component | File | Changes |
| :- | :- | :- |
| Database | `V6__security_improvements.sql` | Add columns, indexes |
| Security | `SecurityConfig.java` | Add account lockout |
| Security | `WebhookController.java` | Add HMAC verification |
| Security | `RateLimitConfig.java` | Add refresh token bucket |
| Booking | `BookingController.java` | Separate action endpoints |
| Booking | `OtpService.java` | Hash OTP |
| Caching | `CacheService.java` | Add Redis health check |
| Caching | `PublicController.java` | Add ETag support |
| Config | `application.yml` | JWT keys, actuator |
| Docker | `docker-compose.yml` | Add ClamAV |
| Testing | `BookingFlowIntegrationTest.java` | Testcontainers |
| Errors | `GlobalExceptionHandler.java` | Structured errors |

---

# 13. ESTIMATED EFFORT

| Module | Classes | Complexity | Estimate |
| :- | :- | :- | :- |
| Foundation (Auth, Security, Config) | 35 | Medium | 2 tuần |
| Public APIs (Services, Lawyers, FAQs) | 30 | Medium | 1.5 tuần |
| Booking System (OTP, Calendar, Notify) | 40 | High | 2 tuần |
| Lead & CRM (Lead, Review, Newsletter) | 30 | Medium | 1.5 tuần |
| Content Management (Posts, Rich Text) | 45 | High | 2 tuần |
| Chatbot (AI, Session, Redis) | 25 | High | 1.5 tuần |
| Admin Dashboard & User Management | 25 | Medium | 1 tuần |
| Notifications (Email, SMS) | 15 | Medium | 1 tuần |
| Infrastructure (Docker, CI/CD, Monitoring) | — | Medium | 1 tuần |
| **TỔNG** | **~245** | — | **~13.5 tuần** |

> Ước tính cho 1–2 backend developers. Có thể rút ngắn nếu 2 dev làm song song hoặc thuê thêm contractor.

---

*Tài liệu kiến trúc Backend Monolithic BRS v2.0 — ICRC Law — Tháng 5/2026*
*Bản cải tiến v2 — Bao gồm security hardening, performance optimization, testing standards*
*Nội bộ – Bảo mật*
