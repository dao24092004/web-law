-- ============================================================
-- V34__update_office_address_hung_yen.sql
-- Move the office address to: Đường 381, Xã Nguyễn Văn Linh, Tỉnh Hưng Yên
-- Updates every occurrence inside PUBLIC_SITE settings (contact.address,
-- offices[*].address, offices[*].city) for both vi and en locales.
-- Idempotent: re-running has no effect once the old strings are gone.
-- ============================================================

UPDATE system_settings
SET value_json = replace(
        replace(
            replace(
                replace(
                    value_json::text,
                    'Tầng 3, số 142 Phố Lê Duẩn, Phường Khâm Thiên, TP Hà Nội',
                    'Đường 381, Xã Nguyễn Văn Linh, Tỉnh Hưng Yên'
                ),
                '3rd floor, 142 Le Duan Street, Kham Thien Ward, Hanoi',
                'Road 381, Nguyen Van Linh Commune, Hung Yen Province'
            ),
            '"city": "Hà Nội"',
            '"city": "Hưng Yên"'
        ),
        '"city": "Hanoi"',
        '"city": "Hung Yen"'
    )::jsonb
WHERE namespace = 'PUBLIC_SITE'
  AND value_json IS NOT NULL;
