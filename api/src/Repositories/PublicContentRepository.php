<?php

declare(strict_types=1);

namespace LoupSauvage\Repositories;

use PDO;

final class PublicContentRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listPublishedByType(string $type, ?int $limit = null): array
    {
        $sql = $this->baseSelect() . '
            WHERE content_items.type = :type
              AND content_items.status = :status
            ORDER BY content_items.display_date ASC, content_items.id ASC';

        if ($limit !== null) {
            $sql .= ' LIMIT ' . max(1, $limit);
        }

        $statement = $this->db->prepare($sql);
        $statement->execute([
            'type' => $type,
            'status' => 'published',
        ]);

        return $this->attachMedia($statement->fetchAll());
    }

    /**
     * @return array{bundles: array<int, array<string, mixed>>, creations: array<int, array<string, mixed>>}
     */
    public function creationsArchive(): array
    {
        return [
            'bundles' => $this->listPublicBundles(),
            'creations' => $this->listPublishedCreationsOutsidePublicBundles(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findPublishedCreationBySlug(string $slug): ?array
    {
        $statement = $this->db->prepare($this->baseSelect() . '
            WHERE content_items.type = :type
              AND content_items.status = :status
              AND content_items.slug = :slug
            LIMIT 1');

        $statement->execute([
            'type' => 'creation',
            'status' => 'published',
            'slug' => $slug,
        ]);

        $item = $statement->fetch();

        if (!is_array($item)) {
            return null;
        }

        $items = $this->attachMedia([$item]);

        return $items[0] ?? null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findVisibleBundleBySlug(string $slug): ?array
    {
        $statement = $this->db->prepare('
            SELECT id, name, slug, visibility, created_at, updated_at
            FROM creation_bundles
            WHERE slug = :slug
              AND visibility IN ("public", "unlisted")
            LIMIT 1
        ');
        $statement->execute(['slug' => $slug]);
        $bundle = $statement->fetch();

        if (!is_array($bundle)) {
            return null;
        }

        return $this->bundleWithItems($bundle);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listPublicBundles(): array
    {
        $statement = $this->db->query('
            SELECT id, name, slug, visibility, created_at, updated_at
            FROM creation_bundles
            WHERE visibility = "public"
            ORDER BY name ASC, id ASC
        ');

        return array_map(fn (array $bundle): array => $this->bundleWithItems($bundle), $statement->fetchAll());
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listPublishedCreationsOutsidePublicBundles(): array
    {
        $statement = $this->db->prepare($this->baseSelect() . '
            WHERE content_items.type = :type
              AND content_items.status = :status
              AND NOT EXISTS (
                  SELECT 1
                  FROM creation_bundle_items
                  INNER JOIN creation_bundles
                    ON creation_bundles.id = creation_bundle_items.bundle_id
                  WHERE creation_bundle_items.content_item_id = content_items.id
                    AND creation_bundles.visibility = "public"
              )
            ORDER BY content_items.display_date ASC, content_items.id ASC
        ');
        $statement->execute([
            'type' => 'creation',
            'status' => 'published',
        ]);

        return $this->attachMedia($statement->fetchAll());
    }

    /**
     * @param array<string, mixed> $bundle
     * @return array<string, mixed>
     */
    private function bundleWithItems(array $bundle): array
    {
        $statement = $this->db->prepare('
            SELECT
                creation_bundle_items.sort_order AS bundle_sort_order,
                ' . $this->contentColumns() . '
            FROM creation_bundle_items
            INNER JOIN content_items
                ON content_items.id = creation_bundle_items.content_item_id
            WHERE creation_bundle_items.bundle_id = :bundle_id
              AND content_items.type = :type
              AND content_items.status = :status
            ORDER BY creation_bundle_items.sort_order ASC, creation_bundle_items.id ASC
        ');
        $statement->execute([
            'bundle_id' => (int) $bundle['id'],
            'type' => 'creation',
            'status' => 'published',
        ]);

        $items = $this->attachMedia($statement->fetchAll());

        return [
            'id' => (int) $bundle['id'],
            'name' => (string) $bundle['name'],
            'slug' => (string) $bundle['slug'],
            'visibility' => (string) $bundle['visibility'],
            'itemCount' => count($items),
            'previewItem' => $items[0] ?? null,
            'items' => $items,
            'createdAt' => (string) $bundle['created_at'],
            'updatedAt' => (string) $bundle['updated_at'],
        ];
    }

    private function baseSelect(): string
    {
        return '
            SELECT
                ' . $this->contentColumns() . '
            FROM content_items';
    }

    private function contentColumns(): string
    {
        return '
                content_items.id,
                content_items.type,
                content_items.title,
                content_items.slug,
                content_items.short_description,
                content_items.source_context,
                content_items.source_label,
                content_items.client_permission,
                content_items.sketchfab_url,
                content_items.external_url,
                content_items.external_platform,
                content_items.platform_label,
                content_items.price_label,
                content_items.builtbybit_resource_id,
                content_items.builtbybit_sync_json,
                content_items.model_glb_path,
                content_items.model_preview_image_path,
                content_items.model_watermark_enabled,
                content_items.model_viewer_yaw_degrees,
                content_items.published_at,
                content_items.display_date';
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array<string, mixed>>
     */
    private function attachMedia(array $items): array
    {
        if ($items === []) {
            return [];
        }

        $ids = array_map(static fn (array $item): int => (int) $item['id'], $items);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        $statement = $this->db->prepare("
            SELECT id, content_item_id, kind, path, alt, sort_order
            FROM content_media
            WHERE content_item_id IN ($placeholders)
            ORDER BY sort_order ASC, id ASC
        ");
        $statement->execute($ids);

        $mediaByItem = [];
        foreach ($statement->fetchAll() as $media) {
            $itemId = (int) $media['content_item_id'];
            $mediaByItem[$itemId][] = [
                'id' => (int) $media['id'],
                'kind' => (string) $media['kind'],
                'path' => (string) $media['path'],
                'alt' => $media['alt'],
                'sortOrder' => (int) $media['sort_order'],
            ];
        }

        return array_map(function (array $item) use ($mediaByItem): array {
            $id = (int) $item['id'];

            return [
                'id' => $id,
                'type' => (string) $item['type'],
                'title' => (string) $item['title'],
                'slug' => (string) $item['slug'],
                'shortDescription' => $item['short_description'],
                'sourceContext' => (string) $item['source_context'],
                'sourceLabel' => $item['source_label'],
                'clientPermission' => (bool) $item['client_permission'],
                'sketchfabUrl' => $item['sketchfab_url'],
                'externalUrl' => $item['external_url'],
                'externalPlatform' => $item['external_platform'],
                'platformLabel' => $item['platform_label'],
                'priceLabel' => $item['price_label'],
                'builtbybitResourceId' => $item['builtbybit_resource_id'] ?? null,
                'builtbybitSyncJson' => $this->publicSyncJson($item['builtbybit_sync_json'] ?? null),
                'modelGlbPath' => $item['model_glb_path'] ?? null,
                'modelPreviewImagePath' => $item['model_preview_image_path'] ?? null,
                'modelWatermarkEnabled' => (bool) ($item['model_watermark_enabled'] ?? true),
                'modelViewerYawDegrees' => (int) ($item['model_viewer_yaw_degrees'] ?? 180),
                'publishedAt' => $item['published_at'],
                'displayDate' => $item['display_date'],
                'media' => $mediaByItem[$id] ?? [],
            ];
        }, $items);
    }

    private function decodeJson(mixed $value): mixed
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $decoded = json_decode($value, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function publicSyncJson(mixed $value): ?array
    {
        $decoded = $this->decodeJson($value);

        if (!is_array($decoded)) {
            return null;
        }

        return [
            'resourceId' => $decoded['resourceId'] ?? null,
            'coverImageUrl' => $decoded['coverImageUrl'] ?? null,
            'carouselImageUrls' => isset($decoded['carouselImageUrls']) && is_array($decoded['carouselImageUrls'])
                ? $decoded['carouselImageUrls']
                : [],
        ];
    }
}
