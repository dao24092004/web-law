# TÀI LIỆU BÀN GIAO VẬN HÀNH VÀ TRIỂN KHAI

**Hệ thống:** ICRC Law, nền tảng website tư vấn pháp lý trực tuyến
**Tên thương hiệu hiển thị:** ICRC Law
**Tên pháp lý:** Công ty Luật TNHH ICRC
**Domain chính:** icrclaw.com
**Email liên hệ:** contact@icrclaw.com
**Hotline:** 0969 967 389 - 0975 967 364
**Địa chỉ chuẩn hiển thị:** Đường 381, Xã Nguyễn Văn Linh, Tỉnh Hưng Yên
**Phiên bản tài liệu:** 3.0  
**Ngày rà soát:** 05/10/2026  
**Trạng thái:** Đã xác minh local end-to-end; **chưa nghiệm thu production end-to-end**.

> Tài liệu này phản ánh mã nguồn và cấu hình đang có trong repository tại thời điểm rà soát. Không coi hệ thống là sẵn sàng mở public cho đến khi hoàn tất mục **Blocker trước production** và ký checklist nghiệm thu ở cuối tài liệu.

## 1. Tóm tắt điều hành

Hệ thống gồm frontend Next.js, backend Spring Boot, PostgreSQL, Redis, RabbitMQ và Nginx. Chức năng nghiệp vụ chính đã có: website public, đăng nhập, booking, CRM, quản trị nội dung, quản lý luật sư/dịch vụ, chatbot, thông báo, newsletter, upload file và audit log.

Kết quả kiểm tra tại máy phát triển:

| Hạng mục | Kết quả | Ghi chú |
|---|---:|---|
| Backend `mvn -q test` | PASS | Lệnh kết thúc `exit_code=0`; có warning trong log test cần xử lý kỹ thuật |
| Frontend `npm run test:run` | PASS | 9 test files, 72 tests passed |
| Frontend `npm run build` | PASS | Next.js 16.2.6 tạo production build thành công |
| Compose production `config` | PASS | File compose render được với template env |
| Frontend `npm run lint` | PASS | Exit code 0; còn cảnh báo lint cần phân loại và xử lý theo backlog |
| E2E booking Chromium | PASS | 5/5; gồm chọn dịch vụ, điều hướng và xử lý conflict HTTP 409 |
| E2E public/admin smoke Chromium | PASS | 20/20; gồm responsive và các route public/admin |
| Backend health/API smoke | PASS | `/actuator/health` và `/api/public/services` trả HTTP 200 |
| Local containers | PASS | PostgreSQL, Redis và RabbitMQ đều healthy |
| Docker production build | PASS | Đã xác nhận build backend/frontend; không nhúng `.env` hoặc JWT private key vào image |
| Smoke test HTTPS/API/SMTP/OTP | **CHƯA XÁC NHẬN** | Chưa có production DNS, certificate và secret thật trong môi trường hiện tại |

### Kết luận phát hành

- Có thể tiếp tục chuẩn bị hạ tầng và xử lý blocker.
- Chưa được đánh dấu là production-ready.
- Không dùng dữ liệu, mật khẩu hoặc secret development để mở public.
- Không chạy deploy thật chỉ dựa trên việc test/build local đã pass.

## 2. Blocker trước production

### Bắt buộc xử lý

1. **JWT keys production phải được cung cấp qua runtime secret.**
   - `brs-backend/Dockerfile` không copy private key vào image.
   - Compose production mount `../keys/jwt-private.pem` và `../keys/jwt-public.pem` từ `brs-backend/keys/` vào `/app/keys/` trong container.
   - Cần tạo key ngoài Git/secret manager trước khi deploy; private key chỉ được mount lúc runtime.

2. **Secret frontend development phải được rotate và loại khỏi deployment.**
   - `frontend/vp-luat/.env` hiện chứa `NEXTAUTH_SECRET` dạng development.
   - Không đưa file này lên server production nếu chưa kiểm tra quyền truy cập và rotate secret.
   - Production phải dùng `AUTH_SECRET`/`NEXTAUTH_SECRET` random tối thiểu 32 ký tự, lưu trong secret manager hoặc file env quyền `600`.

3. **Cảnh báo lint frontend cần xử lý theo backlog.**
   - `npm run lint` hiện đã kết thúc với exit code 0.
   - Vẫn còn các cảnh báo hiện hữu; cần phân loại, xử lý và đưa vào CI để không tăng thêm trước release.

4. **Bộ nhận diện thương hiệu production đã thống nhất.**
   - Tên thương hiệu hiển thị: **ICRC Law**.
   - Tên pháp lý: **Công ty Luật TNHH ICRC**.
   - Domain chính: **icrclaw.com**; email liên hệ: **contact@icrclaw.com**.
   - Hotline: **0969 967 389 - 0975 967 364**; địa chỉ hiển thị: **Đường 381, Xã Nguyễn Văn Linh, Tỉnh Hưng Yên**.
   - Các định danh kỹ thuật như thư mục `vp-luat` và package Java được giữ nguyên để không ảnh hưởng build/deployment.

5. **Chưa có nghiệm thu hạ tầng thật.**
   - Chưa kiểm tra DNS, TLS, firewall, backup restore, SMTP, OTP/SMS, OpenAI/Gemini, webhook và CDN/WAF bằng tài khoản production.

### Rủi ro cần theo dõi

- CI hiện chỉ kiểm tra backend. Workflow chưa chạy frontend lint, frontend unit test, frontend build hoặc E2E.
- Backend test vẫn ghi một số warning Hibernate/encoding trong log; cần theo dõi riêng, nhưng không làm fail test suite hiện tại.
- Base config có `spring.jpa.hibernate.ddl-auto: update`; production cần xác nhận profile `prod` không cho phép schema drift ngoài Flyway.
- Nginx dùng certificate mount và `ssl_stapling on`; phải chạy `nginx -t` bằng certificate thật trước khi mở port 443.
- Upload lưu trên Docker volume local. Nếu chạy nhiều node hoặc mất volume, file có thể không còn; cần backup volume hoặc chuyển object storage.

## 3. Kiến trúc và luồng request

```text
Internet
   |
   | 80/443
   v
Nginx
   |-- /api/*, /health, /files/* -> Spring Boot :8080
   `-- /*                         -> Next.js :3000

Spring Boot :8080
   |-- PostgreSQL 16  (database chính, Flyway V1..V27)
   |-- Redis 7        (OTP, refresh token, lock, cache, rate limit)
   |-- RabbitMQ 3.13 (async notification/email/outbox)
   `-- SMTP / OpenAI / webhook tùy cấu hình
```

Production Compose có các service:

| Service | Container | Vai trò | Public port |
|---|---|---|---|
| `postgres` | `brs-postgres` | Database | Không publish |
| `redis` | `brs-redis` | Cache/token/lock | Không publish |
| `rabbitmq` | `brs-rabbitmq` | Message broker | Không publish |
| `backend` | `brs-backend` | REST API | Chỉ qua Nginx |
| `frontend` | `brs-frontend` | Next.js standalone | Chỉ qua Nginx |
| `nginx` | `brs-nginx` | TLS/reverse proxy/rate limit | `80`, `443` |

Các container dùng network nội bộ `brs-internal`. Chỉ Nginx được publish ra Internet.

## 4. Phạm vi chức năng

### Public

- Trang chủ, dịch vụ, luật sư, tin tức/bài viết.
- Đặt lịch tư vấn theo wizard.
- Form liên hệ/lead.
- Chatbot AI và handoff cho nhân viên.
- Đánh giá, FAQ, case study, newsletter tùy dữ liệu đã bật.
- Hai locale `vi` và `en`.

### Auth và portal

- Đăng nhập Credentials qua NextAuth.
- Route `/admin/*` dành cho người dùng quản trị theo role/permission.
- Route `/staff/*` dành cho vận hành nội bộ.
- Backend dùng JWT RS256, access token 15 phút và refresh token 7 ngày theo cấu hình hiện tại.

### Admin/staff

- Dashboard, bookings, CRM/leads, notes, blog/posts, dịch vụ, luật sư và lịch làm việc.
- Users, roles, permissions, settings, SMTP test.
- Landing pages, jobs/applications, reviews, FAQ, case studies.
- Chatbot sessions, notifications, newsletter và audit logs.
- Upload file và phục vụ file qua `/files/*`.

## 5. Cấu trúc repository

```text
vpluat/
├── brs-backend/
│   ├── src/main/java/com/lawfirm/brs/       # API, service, security, messaging
│   ├── src/main/resources/                  # config, mail templates, Flyway
│   ├── docker/docker-compose.yml            # local infrastructure
│   ├── docker/docker-compose.prod.yml       # production stack
│   ├── docker/nginx/nginx.conf              # reverse proxy
│   ├── docker/.env.production.example       # env template
│   ├── Dockerfile                            # backend image
│   └── pom.xml
├── frontend/vp-luat/
│   ├── src/app/                              # App Router/public/auth/admin/staff
│   ├── src/features/                         # domain features
│   ├── src/lib/api/                          # API clients
│   ├── tests/unit/                           # Vitest
│   ├── tests/e2e/                            # Playwright
│   ├── Dockerfile                            # Next standalone image
│   └── package.json
├── README.md
├── TEST_PLAN.md
└── HANDOVER.md
```

Migration database hiện có từ `V1__init_schema.sql` đến `V27__create_seed_runs.sql`. Không sửa migration đã chạy trên production; thêm migration mới với số tiếp theo.

## 6. Yêu cầu production

Khuyến nghị:

- Ubuntu 22.04/24.04 LTS.
- Tối thiểu 4 vCPU, 8 GB RAM, 80 GB SSD; tăng theo traffic/upload/log.
- Docker Engine và Docker Compose plugin tương thích với Compose file.
- DNS A/AAAA cho domain public, admin và API.
- TLS certificate bao phủ các hostname được sử dụng.
- Firewall chỉ mở `22` (giới hạn IP/VPN nếu có), `80`, `443`.
- PostgreSQL, Redis, RabbitMQ, backend và frontend không expose trực tiếp ra Internet.
- Có storage backup độc lập với VPS.

Hostname mẫu trong cấu hình hiện tại:

- `icrclaw.com`
- `www.icrclaw.com`
- `admin.icrclaw.com`
- `api.icrclaw.com`

Phải thay bằng hostname đã được chủ sở hữu xác nhận nếu thương hiệu/domain thực tế khác.

## 7. Cấu hình secret và environment

### Tạo env production

```bash
cd /opt/vpluat/brs-backend/docker
cp .env.production.example .env.production
chmod 600 .env.production
${EDITOR:-vi} .env.production
```

Bắt buộc thay toàn bộ placeholder và kiểm tra không còn giá trị mẫu:

- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `RABBITMQ_USER`
- `RABBITMQ_PASSWORD`
- `WEBHOOK_SECRET` tối thiểu 32 ký tự random
- `DOMAIN`
- `CORS_ORIGIN_*`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`
- SMTP variables nếu bật email
- `OPENAI_API_KEY` nếu bật chatbot OpenAI

Không commit `.env.production`, private key, certificate hoặc access token.

### JWT key runtime

Tạo key trên máy được kiểm soát hoặc secret manager:

```bash
mkdir -p /opt/vpluat/brs-backend/keys
openssl genrsa -out /opt/vpluat/brs-backend/keys/jwt-private.pem 2048
openssl rsa \
  -in /opt/vpluat/brs-backend/keys/jwt-private.pem \
  -pubout \
  -out /opt/vpluat/brs-backend/keys/jwt-public.pem
chmod 600 /opt/vpluat/brs-backend/keys/jwt-private.pem
chmod 644 /opt/vpluat/brs-backend/keys/jwt-public.pem
```

Private key không được copy vào Git, Docker image, log hoặc chat. Khi rotate key, phải có kế hoạch invalidation/refresh token và thời điểm chuyển đổi.

### TLS

Đặt certificate theo đúng mount của Compose:

```text
brs-backend/docker/nginx/ssl/fullchain.pem
brs-backend/docker/nginx/ssl/privkey.pem
```

Kiểm tra certificate có đủ hostname và không hết hạn trước khi deploy. Không dùng certificate self-signed cho public production.

## 8. Quy trình deploy production

### 8.1 Chuẩn bị release

```bash
cd /opt/vpluat
git fetch origin
git checkout main
git pull --ff-only origin main
git rev-parse HEAD
```

Chỉ deploy commit đã được review, test và lưu lại trong biên bản release. Kiểm tra working tree không có thay đổi ngoài dự kiến.

### 8.2 Preflight Compose

```bash
cd /opt/vpluat/brs-backend/docker
docker compose --env-file .env.production -f docker-compose.prod.yml config
```

Nếu lệnh trên báo thiếu biến hoặc không render được, dừng deploy.

### 8.3 Backup trước nâng cấp

```bash
mkdir -p /opt/backups
export BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

cd /opt/vpluat/brs-backend/docker
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$DB_USER" -d "$DB_NAME" \
  | gzip > "/opt/backups/icrc-db-$BACKUP_DATE.sql.gz"
```

`DB_USER` và `DB_NAME` phải được nạp từ env production trong shell vận hành. Không ghi mật khẩu vào command line/log.

Backup uploads:

```bash
docker run --rm \
  -v brs-backend_backend_uploads:/data:ro \
  -v /opt/backups:/backup \
  alpine tar -czf "/backup/icrc-uploads-$BACKUP_DATE.tar.gz" -C /data .
```

### 8.4 Build và khởi động

```bash
cd /opt/vpluat/brs-backend/docker
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Không chạy `docker compose down -v` trên production. Lệnh này có thể xóa volume database, Redis, RabbitMQ và uploads.

## 9. Seed admin lần đầu

Migration legacy có thể chứa dữ liệu test cũ. Không sử dụng mật khẩu legacy.

Chỉ với database mới, sau khi đã backup/duyệt:

```ini
APP_SEED_ENABLED=true
APP_SEED_MODE=IF_EMPTY
APP_SEED_ADMIN_EMAIL=admin@<domain-da-xac-nhan>
APP_SEED_ADMIN_PASSWORD=<secret-tam-thoi-khong-ghi-vao-git>
APP_SEED_ADMIN_NAME=Quan tri vien
```

Khởi động backend một lần, kiểm tra log seed completed, sau đó xóa password seed và đặt:

```ini
APP_SEED_ENABLED=false
```

Khởi động lại backend. Với database đang có dữ liệu, giữ seed tắt. Không dùng `FORCE_EXISTING` nếu chưa có kế hoạch backup và phê duyệt bằng văn bản.

## 10. Kiểm tra sau deploy

### Kiểm tra container và log

```bash
cd /opt/vpluat/brs-backend/docker

docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 nginx
docker compose --env-file .env.production -f docker-compose.prod.yml exec nginx nginx -t
```

Tất cả service phải ở trạng thái running/healthy phù hợp. Không bỏ qua lỗi Flyway, JWT key, database, Redis, RabbitMQ hoặc SSL.

### Smoke test HTTP

```bash
curl -fsS https://<domain>/health
curl -fsS https://api.<domain>/api/public/services
curl -fsS https://<domain>/
curl -fsS https://admin.<domain>/login
```

Kiểm tra thủ công trên desktop và mobile:

- Trang chủ, dịch vụ, luật sư, bài viết.
- Login/logout và redirect unauthorized.
- Booking: chọn dịch vụ, luật sư, slot, xác nhận.
- Contact/lead và email/notification nếu đã bật.
- Admin: booking, CRM, content, upload, audit.
- Staff: booking/CRM theo role.
- Chatbot/handoff nếu đã cấu hình provider.
- Locale `vi` và `en`.

Không public `/actuator`, Swagger hoặc port nội bộ. Production hiện tắt Swagger qua `application-prod.yml`.

## 11. API và endpoint chính

Base URL mẫu: `https://api.<domain>/api`.

| Nhóm | Endpoint mẫu |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Public services | `GET /public/services`, `GET /public/services/{slug}` |
| Public lawyers | `GET /public/lawyers`, `GET /public/lawyers/{slug}` |
| Public posts | `GET /public/posts`, `GET /public/posts/{slug}` |
| Booking | `POST /bookings`, `POST /bookings/{id}/verify`, `GET /bookings/availability/{lawyerId}` |
| Admin bookings | `GET /bookings`, `PATCH /bookings/{id}/status`, reschedule theo controller |
| CRM | `GET/POST /crm/leads`, `PATCH /crm/leads/{id}`, notes theo controller |
| Chatbot | `POST /chatbot/message`, `POST /chatbot/handoff` |
| Admin content | `/admin/posts`, `/admin/services`, `/admin/lawyers`, `/admin/faqs`, `/admin/case-studies` |
| Admin system | `/admin/users`, `/admin/roles`, `/admin/settings`, `/admin/audit-logs` |
| Files | `POST /admin/upload/*`, `GET /files/{filename}` |
| Health | `GET /health` qua Nginx; actuator nội bộ |

Bảng trên là danh sách định hướng. Khi tích hợp, đối chiếu trực tiếp controller/DTO trong source hoặc OpenAPI ở môi trường dev; không tự suy diễn method/path chưa được kiểm tra.

## 12. Backup, restore và retention

### Chính sách tối thiểu

- Backup database hàng ngày, giữ tối thiểu 30 bản.
- Backup uploads cùng lịch hoặc theo thay đổi dữ liệu.
- Có ít nhất một bản sao ở storage khác VPS.
- Mã hóa backup và giới hạn quyền đọc.
- Ghi lại commit, schema version, thời điểm backup và người thực hiện.
- Test restore tối thiểu hàng tháng trên môi trường riêng.

### Restore database

Restore chỉ thực hiện khi có phê duyệt:

```bash
cd /opt/vpluat/brs-backend/docker

gunzip -c /opt/backups/icrc-db-YYYYMMDD_HHMMSS.sql.gz \
  | docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
    psql -U "$DB_USER" -d "$DB_NAME"
```

Trước restore phải xác định rõ: mục tiêu restore, thời điểm backup, mất dữ liệu chấp nhận được, trạng thái ứng dụng và kế hoạch smoke test sau restore. Không restore đè production khi chưa cô lập traffic hoặc có kế hoạch rollback.

## 13. Rollback

```bash
cd /opt/vpluat
git checkout <commit-da-duoc-kiem-tra-truoc-do>
cd brs-backend/docker
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Không tự ý rollback Flyway migration đã chạy. Migration destructive cần backup, backward-compatible rollout hoặc kế hoạch phục hồi database riêng.

## 14. Phát triển local

```bash
# Infrastructure
cd brs-backend/docker
docker compose up -d postgres redis rabbitmq

# Backend
cd ..
cp .env.example .env
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Frontend, terminal khác
cd ../../frontend/vp-luat
npm ci
npm run dev
```

URL mặc định:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Swagger dev: `http://localhost:8080/swagger-ui.html`

Không dùng tài khoản/mật khẩu trong README cũ cho production. Nếu cần seed local, dùng secret riêng trong `.env` gitignored.

## 15. Quality gate trước release

### Lệnh xác nhận

```bash
# Backend
cd brs-backend
mvn -q test

# Frontend
cd ../frontend/vp-luat
npm ci
npm run test:run
npm run build
npm run lint
```

Kết quả rà soát ngày 05/10/2026: backend `mvn -q test` PASS; frontend unit `72/72` PASS; frontend lint PASS (exit code 0); frontend build PASS; booking E2E Chromium `5/5` PASS; public/admin smoke E2E Chromium `20/20` PASS; backend health và public services đều HTTP 200. Production DNS/TLS/SMTP/OTP, secret thật, backup/restore và deploy trên hạ tầng thật chưa được nghiệm thu trong môi trường local.

### CI cần bổ sung

Workflow hiện có cần được mở rộng để chạy tối thiểu:

- Frontend `npm ci`, `npm run lint`, `npm run test:run`, `npm run build`.
- Backend test và package.
- Compose config/build smoke test không dùng secret thật.
- E2E smoke trên môi trường ephemeral hoặc staging.
- Dependency/security scan theo chính sách tổ chức.

## 16. Bảo mật vận hành

- Dùng secret manager hoặc env file ngoài Git, permission `600`.
- Rotate secret đã từng xuất hiện trong file local, đặc biệt `NEXTAUTH_SECRET` development.
- Không dùng tài khoản/mật khẩu seed legacy.
- Không dùng database user superuser cho ứng dụng production.
- Không expose `5432`, `6379`, `5672`, `15672`, `3000`, `8080`.
- Không log password, token, JWT private key hoặc PII không cần thiết.
- Bật quota cho AI provider và rate limit cho auth, booking, lead, search, chatbot.
- Kiểm tra quyền upload, MIME type, extension, kích thước file và đường dẫn file.
- Đảm bảo cookie production có `Secure`, `HttpOnly`, `SameSite` phù hợp HTTPS.
- Kiểm tra CORS chỉ chứa origin thật, không dùng wildcard khi `allow-credentials=true`.
- Review dependency và CVE định kỳ.

## 17. Xử lý sự cố

1. Ghi nhận thời gian, URL, người dùng ảnh hưởng và bước tái hiện.
2. Kiểm tra `docker compose ps`, health endpoint và log Nginx/backend.
3. Kiểm tra disk, RAM, CPU, Docker volume và kết nối PostgreSQL/Redis/RabbitMQ.
4. Với lỗi dữ liệu, dừng thay đổi không cần thiết và tạo backup trước điều tra.
5. Không chạy `down -v`, `FLUSHALL` hoặc reset database khi chưa đánh giá tác động.
6. Nếu lỗi sau release, đối chiếu commit, migration và log deploy; rollback app trước, rollback DB chỉ theo kế hoạch.
7. Ghi post-incident: nguyên nhân gốc, phạm vi ảnh hưởng, thời gian khôi phục và hành động phòng ngừa.

| Mức | Ví dụ | Mục tiêu phản hồi |
|---|---|---:|
| Critical | Website/API down, mất dữ liệu, login toàn hệ thống lỗi | ≤ 2 giờ |
| High | Booking, email chính hoặc portal lỗi | ≤ 8 giờ |
| Medium | Tính năng phụ lỗi, có workaround | ≤ 24 giờ |
| Low | Cải tiến/câu hỏi sử dụng | ≤ 3 ngày |

## 18. Thông tin cần bàn giao ngoài repository

Không ghi các giá trị này trực tiếp vào Git. Bàn giao qua password manager/secret manager và biên bản bảo mật:

- Tài khoản VPS/cloud, DNS, registry, CDN/WAF và certificate.
- Production env và vị trí secret manager.
- JWT key rotation procedure.
- PostgreSQL backup location, encryption key và restore approver.
- SMTP account, SMS/OTP provider, webhook secret.
- OpenAI/Gemini key, quota và billing owner.
- Tài khoản admin/staff production và người phê duyệt quyền.
- Kênh cảnh báo, người trực, lịch backup và lịch kiểm tra restore.
- Tên pháp lý, domain, logo, hotline, email, chính sách privacy/terms.

## 19. Checklist nghiệm thu production

### Sở hữu và nội dung

- [ ] Đã xác nhận tên pháp lý, tên hiển thị và domain chính.
- [ ] Đã xác nhận hotline, email, địa chỉ, logo và nội dung pháp lý.
- [ ] Đã rà soát dữ liệu seed/legacy, không còn account/password test cần vô hiệu hóa.

### Hạ tầng và secret

- [ ] DNS đã trỏ đúng và DNS propagation đã kiểm tra.
- [ ] TLS certificate hợp lệ cho tất cả hostname.
- [ ] Firewall chỉ mở port cần thiết.
- [ ] `.env.production` đã tạo ngoài Git, permission đúng, không còn placeholder.
- [ ] `AUTH_SECRET`/`NEXTAUTH_SECRET` đã rotate từ development.
- [ ] JWT keys tồn tại đúng vị trí runtime và không nằm trong image/Git.
- [ ] Docker build backend/frontend đã chạy thành công.
- [ ] Compose config và `nginx -t` pass.

### Ứng dụng

- [ ] PostgreSQL, Redis, RabbitMQ healthy.
- [ ] Flyway hoàn tất, không có migration error.
- [ ] Seed admin đã tạo đúng cách và `APP_SEED_ENABLED=false` sau lần đầu.
- [ ] `/health` trả HTTP 200.
- [ ] Public pages, login/logout, booking và contact đã smoke test.
- [ ] Admin/staff role và permission đã smoke test.
- [ ] Upload, email, OTP/webhook và chatbot đã test theo phạm vi bật.
- [ ] Locale `vi`/`en`, desktop/mobile và các redirect đã kiểm tra.

### Dữ liệu và vận hành

- [ ] Database backup đã tạo và có thể đọc.
- [ ] Upload backup đã tạo.
- [ ] Đã test restore ở môi trường riêng hoặc có biên bản test gần nhất.
- [ ] Đã cấu hình retention/cron và bản sao ngoài VPS.
- [ ] Đã ghi commit release và migration version.
- [ ] Đã ghi người trực vận hành và kênh escalation.
- [ ] Đã lập kế hoạch xử lý frontend lint error/warnings và CI gap.

## 20. Biên bản release

- **Ngày/giờ release:** ........................................................
- **Domain production:** ......................................................
- **Commit:** ......................................................................
- **Flyway version:** ..........................................................
- **Người triển khai:** ........................................................
- **Người phê duyệt:** ........................................................
- **Backup trước release:** ...................................................
- **Kết quả smoke test:** .....................................................
- **Rollback point:** ..........................................................
- **Ghi chú/rủi ro chấp nhận:** ..............................................

**Nguyên tắc cuối:** chỉ mở production sau khi các checkbox bắt buộc đã được xác nhận bởi người có quyền phê duyệt. Tài liệu này không chứa secret và không thay thế biên bản nghiệm thu hoặc quy trình quản lý thay đổi.