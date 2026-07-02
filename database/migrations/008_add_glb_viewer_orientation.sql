ALTER TABLE content_items
    ADD COLUMN IF NOT EXISTS model_viewer_yaw_degrees SMALLINT NOT NULL DEFAULT 180 AFTER model_watermark_enabled;
