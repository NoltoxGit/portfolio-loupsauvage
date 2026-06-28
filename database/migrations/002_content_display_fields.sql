ALTER TABLE content_items
    ADD COLUMN IF NOT EXISTS display_date DATE NULL AFTER published_at,
    ADD COLUMN IF NOT EXISTS source_label VARCHAR(120) NULL AFTER source_context,
    ADD COLUMN IF NOT EXISTS platform_label VARCHAR(120) NULL AFTER external_platform;

UPDATE content_items
SET display_date = COALESCE(DATE(published_at), DATE(created_at), CURRENT_DATE)
WHERE display_date IS NULL;

ALTER TABLE content_items
    MODIFY display_date DATE NOT NULL;

ALTER TABLE content_items
    ADD INDEX IF NOT EXISTS idx_content_public_display (type, status, display_date, id);
