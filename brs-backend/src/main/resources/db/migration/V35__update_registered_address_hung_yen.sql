-- ============================================================
-- V35__update_registered_address_hung_yen.sql
-- Align the company registered address with the office address:
-- Đường 381, Xã Nguyễn Văn Linh, Tỉnh Hưng Yên
-- Idempotent: no effect once the old string is gone.
-- ============================================================

UPDATE system_settings
SET value_json = replace(
        value_json::text,
        'Tổ 9, Thành phố Hà Nội, Việt Nam',
        'Đường 381, Xã Nguyễn Văn Linh, Tỉnh Hưng Yên'
    )::jsonb
WHERE namespace = 'PUBLIC_SITE'
  AND value_json IS NOT NULL;
