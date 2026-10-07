-- Ensure both locales have a complete heroStats object without overwriting existing values.
UPDATE system_settings
SET value_json = value_json || jsonb_build_object(
    'vi', COALESCE(value_json->'vi', '{}'::jsonb) || jsonb_build_object(
        'heroStats', COALESCE(
            value_json #> '{vi,heroStats}',
            '{"successfulCases":200,"successRate":98,"yearsExperience":10,"clients":200}'::jsonb
        )
    ),
    'en', COALESCE(value_json->'en', '{}'::jsonb) || jsonb_build_object(
        'heroStats', COALESCE(
            value_json #> '{en,heroStats}',
            '{"successfulCases":200,"successRate":98,"yearsExperience":10,"clients":200}'::jsonb
        )
    )
)
WHERE namespace = 'PUBLIC_SITE'
  AND value_json IS NOT NULL;
