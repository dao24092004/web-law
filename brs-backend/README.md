# BRS Backend - Law Firm Backend Platform

Backend RESTful API cho website ICRC Law - Công ty Luật TNHH ICRC, được xây dựng trên Java 21 và Spring Boot 3.3.

## Tính Năng Chính

- **Authentication & Authorization**: JWT RS256 với token rotation
- **Booking System**: Hệ thống đặt lịch tư vấn với OTP verification
- **CRM**: Quản lý leads, reviews, newsletter
- **Content Management**: Blog, categories, tags
- **Chatbot**: AI-powered chatbot với OpenAI/Gemini integration
- **Multi-language**: Hỗ trợ Vietnamese, English

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Java 21 LTS |
| Framework | Spring Boot 3.3.x |
| Database | PostgreSQL 16 |
| ORM | Spring Data JPA |
| Migration | Flyway |
| Cache | Redis 7.2 |
| Message Broker | RabbitMQ 3.13 |
| Security | Spring Security 6 + JWT RS256 |
| API Docs | springdoc-openapi 2.3 |
| Container | Docker |

## Cấu Trúc Project

```
brs-backend/
├── src/main/java/com/lawfirm/brs/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST Controllers
│   ├── service/         # Business Logic
│   ├── repository/      # Data Access
│   ├── dto/             # Request/Response DTOs
│   ├── entity/          # JPA Entities
│   ├── mapper/          # Entity <-> DTO Mapping
│   ├── exception/       # Exception Handling
│   ├── constants/       # Enums & Constants
│   ├── util/            # Utilities
│   └── messaging/       # RabbitMQ Producers/Consumers
├── src/main/resources/
│   ├── application.yml  # Main configuration
│   └── db/migration/    # Flyway migrations
├── docker/             # Docker configurations
└── scripts/            # Build & deployment scripts
```

## Hướng Dẫn Cài Đặt (Khi Pull Về Mới)

### 1. Yêu Cầu Hệ Thống

- JDK 21+
- Maven 3.9+
- Docker & Docker Compose

### 2. Copy và Cấu Hình Environment

```bash
# Copy file .env.example thành .env
cp .env.example .env

# Chỉnh sửa .env với thông tin của bạn (database, cloudinary, etc.)
```

set PGPASSWORD=password
psql -U postgres -h localhost -p 5434 -c "CREATE DATABASE brs_db;"

### Seed dữ liệu khởi tạo một lần

Các migration Flyway cũ được giữ nguyên để bảo toàn lịch sử. Seed runtime mới dùng marker `initial-content-v1` trong bảng `seed_runs`, khóa advisory PostgreSQL và mặc định tắt. Không đặt mật khẩu quản trị trong source code hoặc log.

- Fresh database: chạy Flyway trước, đặt `APP_SEED_ENABLED=true`, `APP_SEED_MODE=IF_EMPTY`, `APP_SEED_ADMIN_EMAIL` và `APP_SEED_ADMIN_PASSWORD` qua secret manager, rồi khởi động đúng một lần.
- Existing database: giữ `APP_SEED_ENABLED=false`; nếu dữ liệu legacy đã tồn tại, initializer chỉ ghi marker completed và không chèn dữ liệu mẫu.
- Production: mặc định luôn tắt. Chỉ bật tạm thời cho database mới sau khi backup và kiểm tra secret, sau khi marker completed phải tắt lại.
- Retry sau lỗi: xem log trạng thái `FAILED`, xử lý nguyên nhân, giữ cùng `APP_SEED_KEY` rồi khởi động lại. Transaction seed sẽ rollback dữ liệu của lần lỗi.
- Không dùng `FORCE_EXISTING` nếu chưa có kế hoạch backup và xác nhận dữ liệu nghiệp vụ; mode này có thể tạo tài khoản seed trên database đang có dữ liệu.

### 3. Tạo JWT Keys

```bash
# Tạo thư mục keys nếu chưa có
mkdir -p keys

# Tạo cặp khóa RSA
openssl genrsa -out keys/jwt-private.pem 2048
openssl rsa -in keys/jwt-private.pem -pubout -out keys/jwt-public.pem
```

### 4. Khởi Động Infrastructure (Database, Redis, RabbitMQ)

```bash
# Chạy từ thư mục brs-backend; Compose file nằm trong docker/
docker compose -f docker/docker-compose.yml up -d postgres redis rabbitmq
```

### 5. Build Ứng Dụng

```bash
mvn clean install
```

### 6. Chạy Ứng Dụng

```bash
mvn spring-boot:run
```

Hoặc chạy với Maven wrapper:

```bash
./mvnw spring-boot:run
```

Ứng dụng sẽ chạy tại `http://localhost:8080`

---

## Các Lệnh Thường Dùng

```bash
# Chạy tests
mvn test

# Build JAR file
mvn clean package -DskipTests

# Chạy với profile cụ thể
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"
```

## API Documentation

Swagger UI: `http://localhost:8080/swagger-ui.html`

## Test Accounts (Dev)

| Email | Password | Role |
|-------|----------|------|
| admin@lawfirm.vn | Admin@123 | SUPER_ADMIN |
| editor@lawfirm.vn | Admin@123 | EDITOR |
| cskh@lawfirm.vn | Admin@123 | CSKH |
| lawyer1@lawfirm.vn | Admin@123 | LAWYER |

## Environment Variables

Xem file `.env.example` để biết đầy đủ các biến môi trường.

| Variable | Description | Default |
|----------|-------------|---------|
| SPRING_PROFILES_ACTIVE | Profile (dev/prod) | dev |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5434 |
| DB_NAME | Database name | brs_dev |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | password |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| REDIS_PASSWORD | Redis password | (empty) |
| RABBITMQ_HOST | RabbitMQ host | localhost |
| RABBITMQ_PORT | RabbitMQ port | 5672 |
| JWT_PRIVATE_KEY_PATH | Path to JWT private key | keys/jwt-private.pem |
| JWT_PUBLIC_KEY_PATH | Path to JWT public key | keys/jwt-public.pem |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | - |
| CLOUDINARY_API_KEY | Cloudinary API key | - |
| CLOUDINARY_API_SECRET | Cloudinary API secret | - |
| OPENAI_API_KEY | OpenAI API key | - |

## Sử Dụng Docker Compose (Toàn Bộ Stack)

```bash
cd docker
docker-compose up -d
```

## Triển khai lên production

### 1. Chuẩn bị thư mục

```bash
cd vpluat/brs-backend/docker
cp .env.production.example .env.production
```

Điền vào `.env.production`, tối thiểu các biến sau:

| Biến | Yêu cầu |
|---|---|
| `DOMAIN` | domain thật, vd `lawfirm.vn` |
| `DB_PASSWORD` | ít nhất 16 ký tự |
| `REDIS_PASSWORD` | ít nhất 16 ký tự |
| `WEBHOOK_SECRET` | ít nhất 16 ký tự |
| `WEBHOOKS_SMS_SECRET` | bắt buộc, ít nhất 16 ký tự |
| `WEBHOOKS_OTP_SECRET` | bắt buộc, ít nhất 16 ký tự |
| `OPENAI_API_KEY` | tuỳ chọn, chatbot cần |

### 2. Đặt chứng thư SSL

```bash
# Giấy Let's Encrypt
certbot certonly --webroot -w ./nginx/certbot -d lawfirm.vn -d www.lawfirm.vn

cp /etc/letsencrypt/live/lawfirm.vn/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/lawfirm.vn/privkey.pem  nginx/ssl/
```

Không có cert thì nginx sẽ không khởi động.

### 3. Đặt JWT key

```bash
mkdir -p keys
[ -f keys/jwt-private.pem ] || openssl genrsa -out keys/jwt-private.pem 4096
[ -f keys/jwt-public.pem ]  || openssl rsa -in keys/jwt-private.pem -pubout -out keys/jwt-public.pem

chmod 644 keys/jwt-private.pem keys/jwt-public.pem
```

`chmod 644` là bắt buộc: container chạy user uid 100, nếu key ở mode 600 thuộc
uid khác thì ứng dụng sẽ **im lặng** tạm key mới, khiến token của người dùng hỏng
mỗi lần restart.

### 4. Triển khai

```bash
./deploy.sh
```

Script sẽ tự kiểm tra môi trường, secret, SSL, key, cổng; build image; khởi động;
đợi tất cả container healthy; rồi kiểm tra lại xem có endpoint nhạy cảm nào bị
lộ hay không. Chạy lại `./deploy.sh` mỗi khi cập nhật phiên bản mới.

### Nâng cấp không gián đoạn

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d backend frontend
```

## Bảo mật

Xem `benchmark/BAO-CAO-BAO-MAT.md` để biết chi tiết các lỗ hổng đã phát hiện và
sửa. Những điểm cần chú ý khi vận hành:

- **Không publish port backend.** Service `backend` trong `docker-compose.prod.yml`
  không có `ports:`. Chỉ nginx được mở 80/443. Nếu lỡ publish, kẻ tấn công có
  thể giả mạo `X-Forwarded-For` để bỏ qua rate limit.
- **Đổi mật khẩu admin** được seed sẵn trước khi mở website.
- **Sao lưu PostgreSQL** định kỳ — volume `postgres_data` là toàn bộ dữ liệu.
- **Theo dõi log nginx** để phát hiện dấu hiệu dò mật khẩu (nhiều 401/429).

## Building for Production

```bash
# Build JAR
mvn clean package -Pprod

# Build Docker image
docker build -t brs-backend:latest .
```

## License

Internal Use Only - LawFirm
