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
            ORDER BY content_items.sort_order ASC,
                     content_items.published_at DESC,
                     content_items.id DESC';

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
            ) VALUES (
                :type,
                :title,
                :slug,
                :short_description,
                :description,
                :status,
                :source_context,
                :client_permission,
                :sketchfab_url,
                :external_url,
                :external_platform,
                :price_label,
                :sort_order,
                $publishedAtSql
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
                description = :description,
                status = :status,
                source_context = :source_context,
                client_permission = :client_permission,
                sketchfab_url = :sketchfab_url,
                external_url = :external_url,
                external_platform = :external_platform,
                price_label = :price_label,
                sort_order = :sort_order,
                published_at = $publishedAtSql
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

    private function baseSelect(): string
    {
        return '
            SELECT
                content_items.id,
                content_items.type,
                content_items.title,
                content_items.slug,
                content_items.short_description,
                content_items.description,
                content_items.status,
                content_items.source_context,
                content_items.client_permission,
                content_items.sketchfab_url,
                content_items.external_url,
                content_items.external_platform,
                content_items.price_label,
                content_items.sort_order,
                content_items.published_at,
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
            'description' => $data['description'],
            'status' => $data['status'],
            'source_context' => $data['source_context'],
            'client_permission' => $data['client_permission'] ? 1 : 0,
            'sketchfab_url' => $data['sketchfab_url'],
            'external_url' => $data['external_url'],
            'external_platform' => $data['external_platform'],
            'price_label' => $data['price_label'],
            'sort_order' => $data['sort_order'],
            'published_at' => $data['published_at'],
        ];
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
                'description' => $item['description'],
                'status' => (string) $item['status'],
                'sourceContext' => (string) $item['source_context'],
                'clientPermission' => (bool) $item['client_permission'],
                'sketchfabUrl' => $item['sketchfab_url'],
                'externalUrl' => $item['external_url'],
                'externalPlatform' => $item['external_platform'],
                'priceLabel' => $item['price_label'],
                'sortOrder' => (int) $item['sort_order'],
                'publishedAt' => $item['published_at'],
                'createdAt' => $item['created_at'],
                'updatedAt' => $item['updated_at'],
                'media' => $mediaByItem[$id] ?? [],
            ];
        }, $items);
    }
}
