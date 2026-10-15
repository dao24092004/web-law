-- ============================================================
-- V33__remove_lawyer_le_van_dat.sql
-- Remove lawyer profile "Lê Văn Đạt" (slug: luat-su-le-van-d)
-- from the database along with all dependent rows.
--
-- Order matters:
--   1. Snapshot the target lawyer id.
--   2. Break FK references that do NOT have ON DELETE CASCADE/SET NULL:
--        - reviews.lawyer_id  -> set to NULL (keep review history)
--        - appointments.lawyer_id -> reassign to a fallback lawyer
--          (any other active lawyer). The migration will FAIL loudly if
--          no fallback exists, so business-critical appointment data is
--          never silently dropped.
--   3. DELETE the lawyer_profiles row; CASCADE cleans up the rest
--      (lawyer_availability, service_lawyers, availability_slots,
--      post_lawyers, lawyer_schedules, lawyer_schedule_overrides,
--      slot_reservations, lead_activities that reference it, etc.).
--      leads.preferred_lawyer_id is ON DELETE SET NULL, so nothing to
--      do there.
-- ============================================================

DO $$
DECLARE
    target_lawyer_id UUID;
    fallback_lawyer_id UUID;
    reassigned_count INT := 0;
    review_count INT := 0;
BEGIN
    -- 1. Locate the lawyer by slug.
    SELECT id
      INTO target_lawyer_id
      FROM lawyer_profiles
     WHERE slug = 'luat-su-le-van-d';

    IF target_lawyer_id IS NULL THEN
        RAISE NOTICE 'Lawyer with slug "luat-su-le-van-d" not found. V33 is a no-op.';
        RETURN;
    END IF;

    RAISE NOTICE 'Removing lawyer Lê Văn Đạt (id=%)', target_lawyer_id;

    -- 2a. Detach reviews (keep the review content, drop the FK link).
    UPDATE reviews
       SET lawyer_id = NULL
     WHERE lawyer_id = target_lawyer_id;
    GET DIAGNOSTICS review_count = ROW_COUNT;
    RAISE NOTICE 'Detached % review(s) from the lawyer.', review_count;

    -- 2b. Reassign appointments to another lawyer.
    --     Note: lawyer_profiles has no is_active/deleted_at columns,
    --     so any other lawyer is a valid fallback. The migration will
    --     FAIL loudly if no fallback exists, so business-critical
    --     appointment data is never silently dropped.
    SELECT id
      INTO fallback_lawyer_id
      FROM lawyer_profiles
     WHERE id <> target_lawyer_id
     ORDER BY created_at ASC NULLS LAST
     LIMIT 1;

    IF fallback_lawyer_id IS NULL THEN
        RAISE EXCEPTION
            'Cannot remove lawyer %: no other lawyer exists to reassign appointments.',
            target_lawyer_id;
    END IF;

    UPDATE appointments
       SET lawyer_id = fallback_lawyer_id
     WHERE lawyer_id = target_lawyer_id;
    GET DIAGNOSTICS reassigned_count = ROW_COUNT;
    RAISE NOTICE 'Reassigned % appointment(s) to fallback lawyer %.',
                 reassigned_count, fallback_lawyer_id;

    -- 3. Delete the lawyer profile. CASCADE handles the rest.
    DELETE FROM lawyer_profiles
     WHERE id = target_lawyer_id;

    RAISE NOTICE 'Deleted lawyer_profiles row for "luat-su-le-van-d".';
END
$$;
