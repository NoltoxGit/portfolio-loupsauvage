-- Phase 10C-fix: database cleanup and audit foreign keys.
-- users(id) is the existing owner table/key. This migration does not alter the users table.
-- content_items.sort_order is removed because content ordering is display_date ASC, id ASC.

ALTER TABLE content_items
    DROP INDEX IF EXISTS idx_content_sort_order,
    DROP COLUMN IF EXISTS sort_order;

UPDATE content_items
LEFT JOIN users created_user ON created_user.id = content_items.created_by_user_id
LEFT JOIN users updated_user ON updated_user.id = content_items.updated_by_user_id
LEFT JOIN users published_user ON published_user.id = content_items.published_by_user_id
SET
    content_items.created_by_user_id = CASE WHEN created_user.id IS NULL THEN NULL ELSE content_items.created_by_user_id END,
    content_items.updated_by_user_id = CASE WHEN updated_user.id IS NULL THEN NULL ELSE content_items.updated_by_user_id END,
    content_items.published_by_user_id = CASE WHEN published_user.id IS NULL THEN NULL ELSE content_items.published_by_user_id END;

UPDATE content_media
LEFT JOIN users uploaded_user ON uploaded_user.id = content_media.uploaded_by_user_id
LEFT JOIN users updated_user ON updated_user.id = content_media.updated_by_user_id
SET
    content_media.uploaded_by_user_id = CASE WHEN uploaded_user.id IS NULL THEN NULL ELSE content_media.uploaded_by_user_id END,
    content_media.updated_by_user_id = CASE WHEN updated_user.id IS NULL THEN NULL ELSE content_media.updated_by_user_id END;

UPDATE pricing_plans
LEFT JOIN users created_user ON created_user.id = pricing_plans.created_by_user_id
LEFT JOIN users updated_user ON updated_user.id = pricing_plans.updated_by_user_id
LEFT JOIN users published_user ON published_user.id = pricing_plans.published_by_user_id
SET
    pricing_plans.created_by_user_id = CASE WHEN created_user.id IS NULL THEN NULL ELSE pricing_plans.created_by_user_id END,
    pricing_plans.updated_by_user_id = CASE WHEN updated_user.id IS NULL THEN NULL ELSE pricing_plans.updated_by_user_id END,
    pricing_plans.published_by_user_id = CASE WHEN published_user.id IS NULL THEN NULL ELSE pricing_plans.published_by_user_id END;

ALTER TABLE content_items
    ADD INDEX IF NOT EXISTS idx_content_created_by_user (created_by_user_id),
    ADD INDEX IF NOT EXISTS idx_content_updated_by_user (updated_by_user_id),
    ADD INDEX IF NOT EXISTS idx_content_published_by_user (published_by_user_id);

ALTER TABLE content_media
    ADD INDEX IF NOT EXISTS idx_media_uploaded_by_user (uploaded_by_user_id),
    ADD INDEX IF NOT EXISTS idx_media_updated_by_user (updated_by_user_id);

ALTER TABLE pricing_plans
    ADD INDEX IF NOT EXISTS idx_pricing_created_by_user (created_by_user_id),
    ADD INDEX IF NOT EXISTS idx_pricing_updated_by_user (updated_by_user_id),
    ADD INDEX IF NOT EXISTS idx_pricing_published_by_user (published_by_user_id);

SET @sql := IF(
    EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'content_items' AND CONSTRAINT_NAME = 'fk_content_items_created_by_user'),
    'SELECT 1',
    'ALTER TABLE content_items ADD CONSTRAINT fk_content_items_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'content_items' AND CONSTRAINT_NAME = 'fk_content_items_updated_by_user'),
    'SELECT 1',
    'ALTER TABLE content_items ADD CONSTRAINT fk_content_items_updated_by_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'content_items' AND CONSTRAINT_NAME = 'fk_content_items_published_by_user'),
    'SELECT 1',
    'ALTER TABLE content_items ADD CONSTRAINT fk_content_items_published_by_user FOREIGN KEY (published_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'content_media' AND CONSTRAINT_NAME = 'fk_content_media_uploaded_by_user'),
    'SELECT 1',
    'ALTER TABLE content_media ADD CONSTRAINT fk_content_media_uploaded_by_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'content_media' AND CONSTRAINT_NAME = 'fk_content_media_updated_by_user'),
    'SELECT 1',
    'ALTER TABLE content_media ADD CONSTRAINT fk_content_media_updated_by_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'pricing_plans' AND CONSTRAINT_NAME = 'fk_pricing_created_by_user'),
    'SELECT 1',
    'ALTER TABLE pricing_plans ADD CONSTRAINT fk_pricing_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'pricing_plans' AND CONSTRAINT_NAME = 'fk_pricing_updated_by_user'),
    'SELECT 1',
    'ALTER TABLE pricing_plans ADD CONSTRAINT fk_pricing_updated_by_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'pricing_plans' AND CONSTRAINT_NAME = 'fk_pricing_published_by_user'),
    'SELECT 1',
    'ALTER TABLE pricing_plans ADD CONSTRAINT fk_pricing_published_by_user FOREIGN KEY (published_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
