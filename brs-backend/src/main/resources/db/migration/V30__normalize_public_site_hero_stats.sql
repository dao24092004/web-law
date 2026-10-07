-- Keep hero stats JSON objects stable for existing and newly initialized databases.
UPDATE system_settings
SET value_json = jsonb_set(
    jsonb_set(
        value_json,
        '{vi,heroStats}',
        COALESCE(value_json #> '{vi,heroStats}', '{}'::jsonb),
        true
    ),
    '{en,heroStats}',
    COALESCE(value_json #> '{en,heroStats}', '{}'::jsonb),
    true
)
WHERE namespace = 'PUBLIC_SITE'
  AND value_json IS NOT NULL;
