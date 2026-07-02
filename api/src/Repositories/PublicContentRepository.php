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

    private function baseSelect(): string
    {
        return '
            SELECT
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
                content_items.published_at,
                content_items.display_date
            FROM content_items';
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
                'shortDescription' => (string) $item['type'] === 'creation' ? null : $item['short_description'],
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
