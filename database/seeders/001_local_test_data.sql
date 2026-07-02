SET @seed_owner_id := (
    SELECT CASE WHEN COUNT(*) = 1 THEN MIN(id) ELSE NULL END
    FROM users
);

INSERT INTO content_items (
    type,
    title,
    slug,
    short_description,
    status,
    source_context,
    source_label,
    client_permission,
    sketchfab_url,
    external_url,
    external_platform,
    platform_label,
    price_label,
    published_at,
    display_date,
    created_by_user_id,
    updated_by_user_id,
    published_by_user_id
) VALUES
(
    'creation',
    'Forest Spirit',
    'forest-spirit',
    'Creature forestiere blocky pour serveur Minecraft.',
    'published',
    'personal',
    NULL,
    0,
    'https://sketchfab.com/3d-models/forest-spirit-placeholder',
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-01 10:00:00',
    '2026-06-01',
    @seed_owner_id,
    @seed_owner_id,
    @seed_owner_id
),
(
    'creation',
    'Crystal Golem',
    'crystal-golem',
    'Golem magique avec cristaux et details fantasy.',
    'published',
    'private_commission',
    NULL,
    1,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-02 10:00:00',
    '2026-06-02',
    @seed_owner_id,
    @seed_owner_id,
    @seed_owner_id
),
(
    'marketplace',
    'Nature Props Pack',
    'nature-props-pack',
    'Pack de decorations naturelles pour maps Minecraft.',
    'published',
    'marketplace_product',
    NULL,
    0,
    NULL,
    'https://builtbybit.com/resources/nature-props-pack',
    'builtbybit',
    NULL,
    'From 12 EUR',
    '2026-06-03 10:00:00',
    '2026-06-03',
    @seed_owner_id,
    @seed_owner_id,
    @seed_owner_id
),
(
    'marketplace',
    'Medieval Items Set',
    'medieval-items-set',
    'Set medieval pour boutiques, lobbies et maps.',
    'published',
    'marketplace_product',
    NULL,
    0,
    NULL,
    'https://mcmodels.net/model/medieval-items-set',
    'mcmodels',
    NULL,
    'From 18 EUR',
    '2026-06-04 10:00:00',
    '2026-06-04',
    @seed_owner_id,
    @seed_owner_id,
    @seed_owner_id
),
(
    'creation',
    'Private Dragon Draft',
    'private-dragon-draft',
    'Brouillon prive non visible publiquement.',
    'draft',
    'private_commission',
    'Dragon prive',
    0,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-05',
    @seed_owner_id,
    @seed_owner_id,
    NULL
)
ON DUPLICATE KEY UPDATE
    type = VALUES(type),
    title = VALUES(title),
    short_description = VALUES(short_description),
    status = VALUES(status),
    source_context = VALUES(source_context),
    source_label = VALUES(source_label),
    client_permission = VALUES(client_permission),
    sketchfab_url = VALUES(sketchfab_url),
    external_url = VALUES(external_url),
    external_platform = VALUES(external_platform),
    platform_label = VALUES(platform_label),
    price_label = VALUES(price_label),
    published_at = VALUES(published_at),
    display_date = VALUES(display_date),
    created_by_user_id = VALUES(created_by_user_id),
    updated_by_user_id = VALUES(updated_by_user_id),
    published_by_user_id = VALUES(published_by_user_id);

DELETE content_media
FROM content_media
INNER JOIN content_items ON content_items.id = content_media.content_item_id
WHERE content_items.slug IN (
    'forest-spirit',
    'crystal-golem',
    'nature-props-pack',
    'medieval-items-set',
    'private-dragon-draft'
);

INSERT INTO content_media (
    content_item_id,
    kind,
    path,
    alt,
    sort_order,
    uploaded_by_user_id,
    updated_by_user_id
)
SELECT id, 'cover', '/assets/hero-zordix.webp', 'Apercu Forest Spirit', 10, @seed_owner_id, @seed_owner_id
FROM content_items
WHERE slug = 'forest-spirit'
UNION ALL
SELECT id, 'gallery', '/uploads/placeholders/forest-spirit-render.webp', 'Render placeholder Forest Spirit', 20, @seed_owner_id, @seed_owner_id
FROM content_items
WHERE slug = 'forest-spirit'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/crystal-golem-cover.webp', 'Apercu Crystal Golem', 10, @seed_owner_id, @seed_owner_id
FROM content_items
WHERE slug = 'crystal-golem'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/nature-props-pack-cover.webp', 'Apercu Nature Props Pack', 10, @seed_owner_id, @seed_owner_id
FROM content_items
WHERE slug = 'nature-props-pack'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/medieval-items-set-cover.webp', 'Apercu Medieval Items Set', 10, @seed_owner_id, @seed_owner_id
FROM content_items
WHERE slug = 'medieval-items-set'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/private-dragon-draft-cover.webp', 'Apercu brouillon Private Dragon Draft', 10, @seed_owner_id, @seed_owner_id
FROM content_items
WHERE slug = 'private-dragon-draft';

INSERT INTO pricing_plans (
    slug,
    title,
    subtitle,
    price_label,
    description,
    features_json,
    sort_order,
    is_active,
    created_by_user_id,
    updated_by_user_id,
    published_by_user_id
) VALUES
(
    'simple-model',
    'Modele simple',
    'Starter',
    'A partir de 15 EUR',
    'Modele leger pour item, prop ou petite creature.',
    '["Item ou petit prop", "Texture simple incluse", "Ideal pour tester une idee"]',
    10,
    1,
    @seed_owner_id,
    @seed_owner_id,
    @seed_owner_id
),
(
    'detailed-model',
    'Modele detaille',
    'Le plus demande',
    'A partir de 35 EUR',
    'Creation plus complete avec silhouette travaillee et rendu propre.',
    '["Details et silhouette soignes", "Texture prete a utiliser", "Render de presentation"]',
    20,
    1,
    @seed_owner_id,
    @seed_owner_id,
    @seed_owner_id
),
(
    'inactive-test-plan',
    'Offre inactive de test',
    'Masquee',
    'Non affiche',
    'Cette offre doit rester invisible dans les endpoints publics.',
    '["Invisible cote public"]',
    90,
    0,
    @seed_owner_id,
    @seed_owner_id,
    NULL
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    subtitle = VALUES(subtitle),
    price_label = VALUES(price_label),
    description = VALUES(description),
    features_json = VALUES(features_json),
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active),
    created_by_user_id = VALUES(created_by_user_id),
    updated_by_user_id = VALUES(updated_by_user_id),
    published_by_user_id = VALUES(published_by_user_id);
