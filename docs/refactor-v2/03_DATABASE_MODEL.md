# 03 - Modèle de base de données

## Objectif

Avoir un modèle simple, propre et suffisant pour gérer :

- les utilisateurs owner ;
- les créations ;
- les ressources marketplace ;
- les images/renders ;
- les offres de tarification.

## Tables principales

### `users`

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner') NOT NULL DEFAULT 'owner',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Le rôle `viewer` ne doit pas être stocké en base. Un visiteur non connecté est implicitement viewer.

### `content_items`

Table commune pour créations et ressources marketplace.

```sql
CREATE TABLE content_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type ENUM('creation', 'marketplace') NOT NULL,
    title VARCHAR(190) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    short_description TEXT NULL,
    description MEDIUMTEXT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    source_context ENUM('personal', 'private_commission', 'marketplace_product', 'other') NOT NULL DEFAULT 'personal',
    client_permission TINYINT(1) NOT NULL DEFAULT 0,
    sketchfab_url VARCHAR(500) NULL,
    external_url VARCHAR(500) NULL,
    external_platform ENUM('builtbybit', 'mcmodels', 'sketchfab', 'other') NULL,
    price_label VARCHAR(120) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_content_type_status (type, status),
    INDEX idx_content_published_at (published_at),
    INDEX idx_content_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### `content_media`

```sql
CREATE TABLE content_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    content_item_id BIGINT UNSIGNED NOT NULL,
    kind ENUM('cover', 'gallery', 'render', 'thumbnail') NOT NULL DEFAULT 'gallery',
    path VARCHAR(500) NOT NULL,
    alt VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_content_media_item
        FOREIGN KEY (content_item_id)
        REFERENCES content_items(id)
        ON DELETE CASCADE,
    INDEX idx_media_item (content_item_id),
    INDEX idx_media_kind (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### `pricing_plans`

```sql
CREATE TABLE pricing_plans (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(190) NOT NULL,
    subtitle VARCHAR(190) NULL,
    price_label VARCHAR(120) NOT NULL,
    description TEXT NULL,
    features_json JSON NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pricing_active_order (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Statuts

### `draft`

Visible uniquement dans l'administration.

### `published`

Visible sur le site public.

### `archived`

Masqué du public, conservé en base.

## Règles métier

- Une création privée ne peut être publiée que si `client_permission = 1`.
- Une ressource marketplace doit idéalement avoir `external_url` et `external_platform`.
- Un item public doit avoir un `slug` unique.
- Une image uploadée doit être liée à un item via `content_media`.
- La suppression définitive doit être évitée au début ; préférer `archived`.

## Migration initiale

Créer un fichier :

```txt
database/migrations/001_initial_schema.sql
```

Il devra contenir les tables ci-dessus, éventuellement ajustées pendant l'implémentation.
