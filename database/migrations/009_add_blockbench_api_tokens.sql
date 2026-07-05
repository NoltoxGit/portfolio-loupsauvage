CREATE TABLE IF NOT EXISTS blockbench_api_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    token_prefix VARCHAR(12) NOT NULL UNIQUE,
    token_hash CHAR(64) NOT NULL,
    last_used_at DATETIME NULL,
    revoked_at DATETIME NULL,
    created_by_user_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_blockbench_tokens_prefix (token_prefix),
    INDEX idx_blockbench_tokens_revoked (revoked_at),
    INDEX idx_blockbench_tokens_created_by_user (created_by_user_id),
    CONSTRAINT fk_blockbench_tokens_created_by_user
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
