ALTER TABLE content_items
    ADD COLUMN IF NOT EXISTS builtbybit_resource_id VARCHAR(80) NULL AFTER price_label,
    ADD COLUMN IF NOT EXISTS builtbybit_sync_json JSON NULL AFTER builtbybit_resource_id;

ALTER TABLE content_items
    ADD INDEX IF NOT EXISTS idx_content_builtbybit_resource_id (builtbybit_resource_id);
