<?php

declare(strict_types=1);

namespace LoupSauvage\Repositories;

use PDO;

final class AdminContentRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    /**
     * @param array{type?: string, status?: string} $filters
     * @return array<int, array<string, mixed>>
     */
    public function list(array $filters = []): array
    {
        $where = [];
        $params = [];

        if (isset($filters['type'])) {
            $where[] = 'content_items.type = :type';
            $params['type'] = $filters['type'];
        }

        if (isset($filters['status'])) {
            $where[] = 'content_items.status = :status';
            $params['status'] = $filters['status'];
        }

        $sql = $this->baseSelect();

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= '
            ORDER BY content_items.display_date ASC,
                     content_items.id ASC';

        $statement = $this->db->prepare($sql);
        $statement->execute($params);

        return $this->attachMedia($statement->fetchAll());
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $statement = $this->db->prepare($this->baseSelect() . '
            WHERE content_items.id = :id
            LIMIT 1
        ');
        $statement->execute(['id' => $id]);

        $item = $statement->fetch();

        if (!is_array($item)) {
            return null;
        }

        $items = $this->attachMedia([$item]);

        return $items[0] ?? null;
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function create(array $data): array
    {
        $publishedAtSql = $data['status'] === 'published' && $data['published_at'] === null
            ? 'CURRENT_TIMESTAMP'
            : ':published_at';

        $sql = "
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
                builtbybit_resource_id,
                builtbybit_sync_json,
                published_at,
                display_date
            ) VALUES (
                :type,
                :title,
                :slug,
                :short_description,
                :status,
                :source_context,
                :source_label,
                :client_permission,
                :sketchfab_url,
                :external_url,
                :external_platform,
                :platform_label,
                :price_label,
                :builtbybit_resource_id,
                :builtbybit_sync_json,
                $publishedAtSql,
                :display_date
            )
        ";

        $params = $this->params($data);

        if ($publishedAtSql === 'CURRENT_TIMESTAMP') {
            unset($params['published_at']);
        }

        $statement = $this->db->prepare($sql);
        $statement->execute($params);

        return $this->findById((int) $this->db->lastInsertId()) ?? [];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function update(int $id, array $data): ?array
    {
        $publishedAtSql = $data['status'] === 'published' && $data['published_at'] === null
            ? 'COALESCE(published_at, CURRENT_TIMESTAMP)'
            : ':published_at';

        $sql = "
            UPDATE content_items
            SET
                type = :type,
                title = :title,
                slug = :slug,
                short_description = :short_description,
                status = :status,
                source_context = :source_context,
                source_label = :source_label,
                client_permission = :client_permission,
                sketchfab_url = :sketchfab_url,
                external_url = :external_url,
                external_platform = :external_platform,
                platform_label = :platform_label,
                price_label = :price_label,
                builtbybit_resource_id = :builtbybit_resource_id,
                builtbybit_sync_json = :builtbybit_sync_json,
                published_at = $publishedAtSql,
                display_date = :display_date
            WHERE id = :id
        ";

        $params = $this->params($data);
        $params['id'] = $id;

        if ($publishedAtSql !== ':published_at') {
            unset($params['published_at']);
        }

        $statement = $this->db->prepare($sql);
        $statement->execute($params);

        return $this->findById($id);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function updateStatus(int $id, string $status): ?array
    {
        $statement = $this->db->prepare("
            UPDATE content_items
            SET
                status = :status,
                published_at = CASE
                    WHEN :status_for_publish = 'published' AND published_at IS NULL
                        THEN CURRENT_TIMESTAMP
                    ELSE published_at
                END
            WHERE id = :id
        ");
        $statement->execute([
            'id' => $id,
            'status' => $status,
            'status_for_publish' => $status,
        ]);

        return $this->findById($id);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function archive(int $id): ?array
    {
        return $this->updateStatus($id, 'archived');
    }

    public function mediaCount(int $contentItemId): int
    {
        $statement = $this->db->prepare('
            SELECT COUNT(*)
            FROM content_media
            WHERE content_item_id = :content_item_id
        ');
        $statement->execute(['content_item_id' => $contentItemId]);

        return (int) $statement->fetchColumn();
    }

    public function slugExists(string $slug): bool
    {
        $statement = $this->db->prepare('
            SELECT 1
            FROM content_items
            WHERE slug = :slug
            LIMIT 1
        ');
        $statement->execute(['slug' => $slug]);

        return $statement->fetchColumn() !== false;
    }

    public function deleteById(int $id): void
    {
        $statement = $this->db->prepare('DELETE FROM content_items WHERE id = :id');
        $statement->execute(['id' => $id]);
    }

    private function baseSelect(): string
    {
        return '
            SELECT
                content_items.id,
                content_items.type,
                content_items.title,
                content_items.slug,
                content_items.short_description,
                content_items.status,
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
                content_items.display_date,
                content_items.created_at,
                content_items.updated_at
            FROM content_items';
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function params(array $data): array
    {
        return [
            'type' => $data['type'],
            'title' => $data['title'],
            'slug' => $data['slug'],
            'short_description' => $data['short_description'],
            'status' => $data['status'],
            'source_context' => $data['source_context'],
            'source_label' => $data['source_label'],
            'client_permission' => $data['client_permission'] ? 1 : 0,
            'sketchfab_url' => $data['sketchfab_url'],
            'external_url' => $data['external_url'],
            'external_platform' => $data['external_platform'],
            'platform_label' => $data['platform_label'],
            'price_label' => $data['price_label'],
            'builtbybit_resource_id' => $data['builtbybit_resource_id'],
            'builtbybit_sync_json' => $data['builtbybit_sync_json'],
            'published_at' => $data['published_at'],
            'display_date' => $data['display_date'],
        ];
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
                'status' => (string) $item['status'],
                'sourceContext' => (string) $item['source_context'],
                'sourceLabel' => $item['source_label'],
                'clientPermission' => (bool) $item['client_permission'],
                'sketchfabUrl' => $item['sketchfab_url'],
                'externalUrl' => $item['external_url'],
                'externalPlatform' => $item['external_platform'],
                'platformLabel' => $item['platform_label'],
                'priceLabel' => $item['price_label'],
                'builtbybitResourceId' => $item['builtbybit_resource_id'],
                'builtbybitSyncJson' => $this->decodeJson($item['builtbybit_sync_json'] ?? null),
                'modelGlbPath' => $item['model_glb_path'],
                'modelPreviewImagePath' => $item['model_preview_image_path'],
                'modelWatermarkEnabled' => (bool) $item['model_watermark_enabled'],
                'modelViewerYawDegrees' => (int) ($item['model_viewer_yaw_degrees'] ?? 180),
                'publishedAt' => $item['published_at'],
                'displayDate' => $item['display_date'],
                'createdAt' => $item['created_at'],
                'updatedAt' => $item['updated_at'],
                'media' => $mediaByItem[$id] ?? [],
            ];
        }, $items);
    }
}
