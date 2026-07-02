-- Phase 10C: simplify portfolio content and add nullable user audit columns.
-- The existing users table is intentionally not modified here.
-- users(id BIGINT UNSIGNED) is confirmed in 001_initial_schema.sql.
-- Foreign keys are added in 005 after invalid audit values are cleaned.

ALTER TABLE content_items
    DROP COLUMN IF EXISTS description,
    ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT UNSIGNED NULL AFTER published_at,
    ADD COLUMN IF NOT EXISTS updated_by_user_id BIGINT UNSIGNED NULL AFTER created_by_user_id,
    ADD COLUMN IF NOT EXISTS published_by_user_id BIGINT UNSIGNED NULL AFTER updated_by_user_id,
    ADD INDEX IF NOT EXISTS idx_content_created_by_user (created_by_user_id),
    ADD INDEX IF NOT EXISTS idx_content_updated_by_user (updated_by_user_id),
    ADD INDEX IF NOT EXISTS idx_content_published_by_user (published_by_user_id);

ALTER TABLE content_media
    ADD COLUMN IF NOT EXISTS uploaded_by_user_id BIGINT UNSIGNED NULL AFTER sort_order,
    ADD COLUMN IF NOT EXISTS updated_by_user_id BIGINT UNSIGNED NULL AFTER uploaded_by_user_id,
    ADD INDEX IF NOT EXISTS idx_media_uploaded_by_user (uploaded_by_user_id),
    ADD INDEX IF NOT EXISTS idx_media_updated_by_user (updated_by_user_id);

ALTER TABLE pricing_plans
    ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT UNSIGNED NULL AFTER is_active,
    ADD COLUMN IF NOT EXISTS updated_by_user_id BIGINT UNSIGNED NULL AFTER created_by_user_id,
    ADD COLUMN IF NOT EXISTS published_by_user_id BIGINT UNSIGNED NULL AFTER updated_by_user_id,
    ADD INDEX IF NOT EXISTS idx_pricing_created_by_user (created_by_user_id),
    ADD INDEX IF NOT EXISTS idx_pricing_updated_by_user (updated_by_user_id),
    ADD INDEX IF NOT EXISTS idx_pricing_published_by_user (published_by_user_id);

SET @phase_10c_owner_id := (
    SELECT CASE WHEN COUNT(*) = 1 THEN MIN(id) ELSE NULL END
    FROM users
);

UPDATE content_items
SET
    created_by_user_id = COALESCE(created_by_user_id, @phase_10c_owner_id),
    updated_by_user_id = COALESCE(updated_by_user_id, @phase_10c_owner_id),
    published_by_user_id = CASE
        WHEN status = 'published' THEN COALESCE(published_by_user_id, @phase_10c_owner_id)
        ELSE published_by_user_id
    END
WHERE @phase_10c_owner_id IS NOT NULL;

UPDATE content_media
SET
    uploaded_by_user_id = COALESCE(uploaded_by_user_id, @phase_10c_owner_id),
    updated_by_user_id = COALESCE(updated_by_user_id, @phase_10c_owner_id)
WHERE @phase_10c_owner_id IS NOT NULL;

UPDATE pricing_plans
SET
    created_by_user_id = COALESCE(created_by_user_id, @phase_10c_owner_id),
    updated_by_user_id = COALESCE(updated_by_user_id, @phase_10c_owner_id),
    published_by_user_id = CASE
        WHEN is_active = 1 THEN COALESCE(published_by_user_id, @phase_10c_owner_id)
        ELSE published_by_user_id
    END
WHERE @phase_10c_owner_id IS NOT NULL;
