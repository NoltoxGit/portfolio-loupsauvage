INSERT INTO content_items (
    type,
    title,
    slug,
    short_description,
    description,
    status,
    source_context,
    client_permission,
    sketchfab_url,
    external_url,
    external_platform,
    price_label,
    sort_order,
    published_at
) VALUES
(
    'creation',
    'Forest Spirit',
    'forest-spirit',
    'Creature forestiere blocky pour serveur Minecraft.',
    'Modele de creature forestiere avec silhouette lisible, textures naturelles et rendu adapte a un portfolio Minecraft.',
    'published',
    'personal',
    0,
    'https://sketchfab.com/3d-models/forest-spirit-placeholder',
    NULL,
    NULL,
    NULL,
    10,
    '2026-06-01 10:00:00'
),
(
    'creation',
    'Crystal Golem',
    'crystal-golem',
    'Golem magique avec cristaux et details fantasy.',
    'Creation fantasy destinee aux lobbies, maps aventure et presentations de commandes Minecraft.',
    'published',
    'private_commission',
    1,
    NULL,
    NULL,
    NULL,
    NULL,
    20,
    '2026-06-02 10:00:00'
),
(
    'marketplace',
    'Nature Props Pack',
    'nature-props-pack',
    'Pack de decorations naturelles pour maps Minecraft.',
    'Ressource marketplace avec rochers, buissons, branches et petits elements organiques.',
    'published',
    'marketplace_product',
    0,
    NULL,
    'https://builtbybit.com/resources/nature-props-pack',
    'builtbybit',
    'From 12 EUR',
    30,
    '2026-06-03 10:00:00'
),
(
    'marketplace',
    'Medieval Items Set',
    'medieval-items-set',
    'Set medieval pour boutiques, lobbies et maps.',
    'Ressource marketplace avec objets, panneaux et accessoires medieval-fantasy.',
    'published',
    'marketplace_product',
    0,
    NULL,
    'https://mcmodels.net/model/medieval-items-set',
    'mcmodels',
    'From 18 EUR',
    40,
    '2026-06-04 10:00:00'
),
(
    'creation',
    'Private Dragon Draft',
    'private-dragon-draft',
    'Brouillon prive non visible publiquement.',
    'Ce contenu de test doit rester invisible dans les endpoints publics.',
    'draft',
    'private_commission',
    0,
    NULL,
    NULL,
    NULL,
    NULL,
    90,
    NULL
)
ON DUPLICATE KEY UPDATE
    type = VALUES(type),
    title = VALUES(title),
    short_description = VALUES(short_description),
    description = VALUES(description),
    status = VALUES(status),
    source_context = VALUES(source_context),
    client_permission = VALUES(client_permission),
    sketchfab_url = VALUES(sketchfab_url),
    external_url = VALUES(external_url),
    external_platform = VALUES(external_platform),
    price_label = VALUES(price_label),
    sort_order = VALUES(sort_order),
    published_at = VALUES(published_at);

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
SELECT id, 'cover', '/assets/hero-zordix.webp', 'Apercu Forest Spirit', 10
FROM content_items
WHERE slug = 'forest-spirit'
UNION ALL
SELECT id, 'gallery', '/uploads/placeholders/forest-spirit-render.webp', 'Render placeholder Forest Spirit', 20
FROM content_items
WHERE slug = 'forest-spirit'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/crystal-golem-cover.webp', 'Apercu Crystal Golem', 10
FROM content_items
WHERE slug = 'crystal-golem'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/nature-props-pack-cover.webp', 'Apercu Nature Props Pack', 10
FROM content_items
WHERE slug = 'nature-props-pack'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/medieval-items-set-cover.webp', 'Apercu Medieval Items Set', 10
FROM content_items
WHERE slug = 'medieval-items-set'
UNION ALL
SELECT id, 'cover', '/uploads/placeholders/private-dragon-draft-cover.webp', 'Apercu brouillon Private Dragon Draft', 10
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
    'Modele simple',
    'Starter',
    'A partir de 15 EUR',
    'Modele leger pour item, prop ou petite creature.',
    '["Item ou petit prop", "Texture simple incluse", "Ideal pour tester une idee"]',
    10,
    1
),
(
    'detailed-model',
    'Modele detaille',
    'Le plus demande',
    'A partir de 35 EUR',
    'Creation plus complete avec silhouette travaillee et rendu propre.',
    '["Details et silhouette soignes", "Texture prete a utiliser", "Render de presentation"]',
    20,
    1
),
(
    'inactive-test-plan',
    'Offre inactive de test',
    'Masquee',
    'Non affiche',
    'Cette offre doit rester invisible dans les endpoints publics.',
    '["Invisible cote public"]',
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
