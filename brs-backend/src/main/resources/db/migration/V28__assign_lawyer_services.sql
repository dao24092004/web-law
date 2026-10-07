-- Restore service_lawyers assignments from lawyer_profiles.service_ids when available.
-- Keep this migration idempotent so existing development databases remain safe.
INSERT INTO service_lawyers (service_id, lawyer_id, is_primary)
SELECT DISTINCT s.id, lp.id, FALSE
FROM lawyer_profiles lp
CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE
        WHEN jsonb_typeof(COALESCE(lp.service_ids, '[]'::jsonb)) = 'array'
            THEN COALESCE(lp.service_ids, '[]'::jsonb)
        ELSE '[]'::jsonb
    END
) AS service_ref(service_id_text)
JOIN services s
    ON s.id::text = service_ref.service_id_text
WHERE service_ref.service_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
ON CONFLICT (service_id, lawyer_id) DO NOTHING;

-- Keep the denormalized JSONB list aligned with the join table.
UPDATE lawyer_profiles lp
SET service_ids = COALESCE(
    (
        SELECT jsonb_agg(to_jsonb(sl.service_id) ORDER BY sl.service_id)
        FROM service_lawyers sl
        WHERE sl.lawyer_id = lp.id
    ),
    '[]'::jsonb
)
WHERE EXISTS (
    SELECT 1
    FROM service_lawyers sl
    WHERE sl.lawyer_id = lp.id
);
