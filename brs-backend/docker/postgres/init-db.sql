-- ============================================================
-- PostgreSQL Initialization Script
-- Chạy MỘT LẦN duy nhất, khi volume /var/lib/postgresql/data còn trống.
--
-- Lưu ý: database và user ứng dụng do chính image postgres tạo sẵn từ
-- biến môi trường POSTGRES_DB / POSTGRES_USER. Script này KHÔNG tạo user
-- ứng dụng, không tham chiếu tên database cụ thể, và không chứa mật khẩu
-- cứng — nhờ vậy dùng chung được cho cả dev lẫn production.
--
-- Toàn bộ schema do Flyway quản lý (src/main/resources/db/migration).
-- ============================================================

-- Extension dùng cho tìm kiếm full-text. Flyway V21 cũng tự tạo, nhưng tạo
-- sẵn ở đây giúp migration chạy được ngay cả ở lần chạy đầu tiên.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Schema riêng cho extension, tránh đụng độ với schema public.
CREATE SCHEMA IF NOT EXISTS extensions;
