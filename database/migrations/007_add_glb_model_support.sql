ALTER TABLE content_items
    ADD COLUMN IF NOT EXISTS model_glb_path VARCHAR(500) NULL AFTER price_label,
    ADD COLUMN IF NOT EXISTS model_preview_image_path VARCHAR(500) NULL AFTER model_glb_path,
    ADD COLUMN IF NOT EXISTS model_watermark_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER model_preview_image_path;

