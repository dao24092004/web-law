-- Seed a minimal PUBLIC_SITE namespace when application seeding has not run yet.
INSERT INTO system_settings (id, namespace, value_json)
VALUES (
    gen_random_uuid(),
    'PUBLIC_SITE',
    '{
      "vi": {
        "contact": {},
        "offices": [],
        "heroStats": {"successfulCases": 200, "successRate": 98, "yearsExperience": 10, "clients": 200},
        "processSteps": [],
        "faqs": []
      },
      "en": {
        "contact": {},
        "offices": [],
        "heroStats": {"successfulCases": 200, "successRate": 98, "yearsExperience": 10, "clients": 200},
        "processSteps": [],
        "faqs": []
      }
    }'::jsonb
)
ON CONFLICT (namespace) DO NOTHING;
