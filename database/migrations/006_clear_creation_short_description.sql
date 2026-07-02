-- Creations no longer use a public text field. Marketplace keeps short_description as product copy.

UPDATE content_items
SET short_description = NULL
WHERE type = 'creation';
