CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type ENUM('creation', 'marketplace') NOT NULL,
    title VARCHAR(190) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    short_description TEXT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    source_context ENUM('personal', 'private_commission', 'marketplace_product', 'other') NOT NULL DEFAULT 'personal',
    source_label VARCHAR(120) NULL,
    client_permission TINYINT(1) NOT NULL DEFAULT 0,
    sketchfab_url VARCHAR(500) NULL,
    external_url VARCHAR(500) NULL,
    external_platform ENUM('builtbybit', 'mcmodels', 'sketchfab', 'other') NULL,
    platform_label VARCHAR(120) NULL,
    price_label VARCHAR(120) NULL,
    builtbybit_resource_id VARCHAR(80) NULL,
    builtbybit_sync_json JSON NULL,
    published_at DATETIME NULL,
    display_date DATE NOT NULL,
    created_by_user_id BIGINT UNSIGNED NULL,
    updated_by_user_id BIGINT UNSIGNED NULL,
    published_by_user_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_content_type_status (type, status),
    INDEX idx_content_published_at (published_at),
    INDEX idx_content_public_display (type, status, display_date, id),
    INDEX idx_content_builtbybit_resource_id (builtbybit_resource_id),
    INDEX idx_content_created_by_user (created_by_user_id),
    INDEX idx_content_updated_by_user (updated_by_user_id),
    INDEX idx_content_published_by_user (published_by_user_id),
    CONSTRAINT fk_content_items_created_by_user
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_content_items_updated_by_user
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_content_items_published_by_user
        FOREIGN KEY (published_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    content_item_id BIGINT UNSIGNED NOT NULL,
    kind ENUM('cover', 'gallery', 'render', 'thumbnail') NOT NULL DEFAULT 'gallery',
    path VARCHAR(500) NOT NULL,
    alt VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    uploaded_by_user_id BIGINT UNSIGNED NULL,
    updated_by_user_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_media_item (content_item_id),
    INDEX idx_media_kind (kind),
    INDEX idx_media_uploaded_by_user (uploaded_by_user_id),
    INDEX idx_media_updated_by_user (updated_by_user_id),
    CONSTRAINT fk_content_media_item
        FOREIGN KEY (content_item_id)
        REFERENCES content_items(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_content_media_uploaded_by_user
        FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_content_media_updated_by_user
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pricing_plans (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(160) NOT NULL UNIQUE,
    title VARCHAR(190) NOT NULL,
    subtitle VARCHAR(190) NULL,
    price_label VARCHAR(120) NOT NULL,
    description TEXT NULL,
    features_json JSON NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by_user_id BIGINT UNSIGNED NULL,
    updated_by_user_id BIGINT UNSIGNED NULL,
    published_by_user_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pricing_active_order (is_active, sort_order),
    INDEX idx_pricing_created_by_user (created_by_user_id),
    INDEX idx_pricing_updated_by_user (updated_by_user_id),
    INDEX idx_pricing_published_by_user (published_by_user_id),
    CONSTRAINT fk_pricing_created_by_user
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_pricing_updated_by_user
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_pricing_published_by_user
        FOREIGN KEY (published_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
