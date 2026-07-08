CREATE TABLE IF NOT EXISTS creation_bundles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    visibility ENUM('public', 'unlisted') NOT NULL DEFAULT 'public',
    created_by_user_id BIGINT UNSIGNED NULL,
    updated_by_user_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_creation_bundles_slug (slug),
    INDEX idx_creation_bundles_visibility (visibility),
    INDEX idx_creation_bundles_created_by_user (created_by_user_id),
    INDEX idx_creation_bundles_updated_by_user (updated_by_user_id),
    CONSTRAINT fk_creation_bundles_created_by_user
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_creation_bundles_updated_by_user
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS creation_bundle_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bundle_id BIGINT UNSIGNED NOT NULL,
    content_item_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_creation_bundle_item (bundle_id, content_item_id),
    INDEX idx_creation_bundle_items_bundle (bundle_id, id),
    INDEX idx_creation_bundle_items_content (content_item_id),
    CONSTRAINT fk_creation_bundle_items_bundle
        FOREIGN KEY (bundle_id)
        REFERENCES creation_bundles(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_creation_bundle_items_content
        FOREIGN KEY (content_item_id)
        REFERENCES content_items(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
