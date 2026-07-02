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
    display_date
) VALUES
(
    'creation',
    'Forest Spirit',
    'forest-spirit',
    'Créature forestière blocky pour serveur Minecraft.',
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
    '2026-06-01'
),
(
    'creation',
    'Crystal Golem',
    'crystal-golem',
    'Golem magique avec cristaux et détails fantasy.',
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
    '2026-06-02'
),
(
    'marketplace',
    'Nature Props Pack',
    'nature-props-pack',
    'Pack de décorations naturelles pour maps Minecraft.',
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
    '2026-06-03'
),
(
    'marketplace',
    'Medieval Items Set',
    'medieval-items-set',
    'Set médiéval pour boutiques, lobbies et maps.',
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
    '2026-06-04'
),
(
    'creation',
    'Private Dragon Draft',
    'private-dragon-draft',
    'Brouillon privé non visible publiquement.',
    'draft',
    'private_commission',
    'Dragon privé',
    0,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-05'
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
    display_date = VALUES(display_date);

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
    sort_order
)
SELECT id, 'cover', '/assets/hero-zordix.webp', 'Aperçu Forest Spirit', 10
FROM content_items
WHERE slug = 'forest-spirit'
UNION ALL
SELECT id, 'gallery', '/uploads/placeholders/forest-spirit-render.webp', 'Render placeholder Forest Spirit', 20
FROM content_items
WHERE slug = 'forest-spirit'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/crystal-golem-cover.webp', 'Aperçu Crystal Golem', 10
FROM content_items
WHERE slug = 'crystal-golem'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/nature-props-pack-cover.webp', 'Aperçu Nature Props Pack', 10
FROM content_items
WHERE slug = 'nature-props-pack'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/medieval-items-set-cover.webp', 'Aperçu Medieval Items Set', 10
FROM content_items
WHERE slug = 'medieval-items-set'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/private-dragon-draft-cover.webp', 'Aperçu brouillon Private Dragon Draft', 10
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
    is_active
) VALUES
(
    'simple-model',
    'Modèle simple',
    'Starter',
    'À partir de 15 EUR',
    'Modèle léger pour item, prop ou petite créature.',
    '["Item ou petit prop", "Texture simple incluse", "Idéal pour tester une idée"]',
    10,
    1
),
(
    'detailed-model',
    'Modèle détaillé',
    'Le plus demandé',
    'À partir de 35 EUR',
    'Création plus complète avec silhouette travaillée et rendu propre.',
    '["Détails et silhouette soignés", "Texture prête à utiliser", "Render de présentation"]',
    20,
    1
),
(
    'inactive-test-plan',
    'Offre inactive de test',
    'Masquée',
    'Non affiché',
    'Cette offre doit rester invisible dans les endpoints publics.',
    '["Invisible côté public"]',
    90,
    0
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    subtitle = VALUES(subtitle),
    price_label = VALUES(price_label),
    description = VALUES(description),
    features_json = VALUES(features_json),
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active);
