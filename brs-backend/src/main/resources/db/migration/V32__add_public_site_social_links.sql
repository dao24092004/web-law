UPDATE system_settings
SET value_json = jsonb_set(
    jsonb_set(
        value_json,
        '{vi,socialLinks}',
        COALESCE(value_json #> '{vi,socialLinks}', '{"facebook":"","linkedin":"","youtube":"","instagram":""}'::jsonb),
        true
    ),
    '{en,socialLinks}',
    COALESCE(value_json #> '{en,socialLinks}', '{"facebook":"","linkedin":"","youtube":"","instagram":""}'::jsonb),
    true
)
WHERE namespace = 'PUBLIC_SITE'
  AND value_json IS NOT NULL;
