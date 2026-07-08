<?php

declare(strict_types=1);

namespace LoupSauvage\Repositories;

use PDO;

final class CreationBundleRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listAll(): array
    {
        $statement = $this->db->query('
            SELECT
                creation_bundles.id,
                creation_bundles.name,
                creation_bundles.slug,
                creation_bundles.visibility,
                creation_bundles.created_by_user_id,
                creation_bundles.updated_by_user_id,
                creation_bundles.created_at,
                creation_bundles.updated_at,
                (
                    SELECT COUNT(*)
                    FROM creation_bundle_items
                    WHERE creation_bundle_items.bundle_id = creation_bundles.id
                ) AS item_count
            FROM creation_bundles
            ORDER BY creation_bundles.name ASC, creation_bundles.id ASC
        ');

        return array_map(fn (array $bundle): array => $this->mapBundle($bundle), $statement->fetchAll());
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $statement = $this->db->prepare('
            SELECT
                creation_bundles.id,
                creation_bundles.name,
                creation_bundles.slug,
                creation_bundles.visibility,
                creation_bundles.created_by_user_id,
                creation_bundles.updated_by_user_id,
                creation_bundles.created_at,
                creation_bundles.updated_at,
                (
                    SELECT COUNT(*)
                    FROM creation_bundle_items
                    WHERE creation_bundle_items.bundle_id = creation_bundles.id
                ) AS item_count
            FROM creation_bundles
            WHERE creation_bundles.id = :id
            LIMIT 1
        ');
        $statement->execute(['id' => $id]);
        $bundle = $statement->fetch();

        return is_array($bundle) ? $this->mapBundle($bundle) : null;
    }

    public function slugExists(string $slug, ?int $exceptId = null): bool
    {
        $sql = 'SELECT 1 FROM creation_bundles WHERE slug = :slug';
        $params = ['slug' => $slug];

        if ($exceptId !== null) {
            $sql .= ' AND id <> :id';
            $params['id'] = $exceptId;
        }

        $sql .= ' LIMIT 1';
        $statement = $this->db->prepare($sql);
        $statement->execute($params);

        return $statement->fetchColumn() !== false;
    }

    public function create(string $name, string $slug, string $visibility, ?int $ownerId): int
    {
        $statement = $this->db->prepare('
            INSERT INTO creation_bundles (name, slug, visibility, created_by_user_id, updated_by_user_id)
            VALUES (:name, :slug, :visibility, :created_by_user_id, :updated_by_user_id)
        ');
        $statement->execute([
            'name' => $name,
            'slug' => $slug,
            'visibility' => $visibility,
            'created_by_user_id' => $ownerId,
            'updated_by_user_id' => $ownerId,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, string $name, string $slug, string $visibility, ?int $ownerId): bool
    {
        $statement = $this->db->prepare('
            UPDATE creation_bundles
            SET
                name = :name,
                slug = :slug,
                visibility = :visibility,
                updated_by_user_id = :updated_by_user_id
            WHERE id = :id
        ');
        $statement->execute([
            'id' => $id,
            'name' => $name,
            'slug' => $slug,
            'visibility' => $visibility,
            'updated_by_user_id' => $ownerId,
        ]);

        return $statement->rowCount() > 0;
    }

    public function delete(int $id): bool
    {
        $statement = $this->db->prepare('DELETE FROM creation_bundles WHERE id = :id');
        $statement->execute(['id' => $id]);

        return $statement->rowCount() > 0;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listForContent(int $contentItemId): array
    {
        $statement = $this->db->prepare('
            SELECT
                creation_bundles.id,
                creation_bundles.name,
                creation_bundles.slug,
                creation_bundles.visibility,
                creation_bundles.created_by_user_id,
                creation_bundles.updated_by_user_id,
                creation_bundles.created_at,
                creation_bundles.updated_at,
                0 AS item_count
            FROM creation_bundles
            INNER JOIN creation_bundle_items
                ON creation_bundle_items.bundle_id = creation_bundles.id
            WHERE creation_bundle_items.content_item_id = :content_item_id
            ORDER BY creation_bundles.name ASC, creation_bundles.id ASC
        ');
        $statement->execute(['content_item_id' => $contentItemId]);

        return array_map(fn (array $bundle): array => $this->mapBundle($bundle), $statement->fetchAll());
    }

    /**
     * @param array<int, int> $contentItemIds
     * @return array<int, array<int, array<string, mixed>>>
     */
    public function listForContents(array $contentItemIds): array
    {
        if ($contentItemIds === []) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($contentItemIds), '?'));
        $statement = $this->db->prepare("
            SELECT
                creation_bundle_items.content_item_id,
                creation_bundles.id,
                creation_bundles.name,
                creation_bundles.slug,
                creation_bundles.visibility,
                creation_bundles.created_by_user_id,
                creation_bundles.updated_by_user_id,
                creation_bundles.created_at,
                creation_bundles.updated_at,
                0 AS item_count
            FROM creation_bundle_items
            INNER JOIN creation_bundles
                ON creation_bundles.id = creation_bundle_items.bundle_id
            WHERE creation_bundle_items.content_item_id IN ($placeholders)
            ORDER BY creation_bundles.name ASC, creation_bundles.id ASC
        ");
        $statement->execute($contentItemIds);

        $byContent = [];
        foreach ($statement->fetchAll() as $bundle) {
            $contentItemId = (int) $bundle['content_item_id'];
            $byContent[$contentItemId][] = $this->mapBundle($bundle);
        }

        return $byContent;
    }

    /**
     * @param array<int, int> $bundleIds
     */
    public function syncContentBundles(int $contentItemId, array $bundleIds): void
    {
        $this->db->beginTransaction();

        try {
            $delete = $this->db->prepare('
                DELETE FROM creation_bundle_items
                WHERE content_item_id = :content_item_id
            ');
            $delete->execute(['content_item_id' => $contentItemId]);

            $insert = $this->db->prepare('
                INSERT INTO creation_bundle_items (bundle_id, content_item_id)
                VALUES (:bundle_id, :content_item_id)
            ');

            foreach ($bundleIds as $bundleId) {
                $insert->execute([
                    'bundle_id' => $bundleId,
                    'content_item_id' => $contentItemId,
                ]);
            }

            $this->db->commit();
        } catch (\Throwable $error) {
            $this->db->rollBack();
            throw $error;
        }
    }

    /**
     * @param array<string, mixed> $bundle
     * @return array<string, mixed>
     */
    private function mapBundle(array $bundle): array
    {
        return [
            'id' => (int) $bundle['id'],
            'name' => (string) $bundle['name'],
            'slug' => (string) $bundle['slug'],
            'visibility' => (string) $bundle['visibility'],
            'itemCount' => (int) ($bundle['item_count'] ?? 0),
            'createdByUserId' => isset($bundle['created_by_user_id']) && is_numeric($bundle['created_by_user_id'])
                ? (int) $bundle['created_by_user_id']
                : null,
            'updatedByUserId' => isset($bundle['updated_by_user_id']) && is_numeric($bundle['updated_by_user_id'])
                ? (int) $bundle['updated_by_user_id']
                : null,
            'createdAt' => (string) $bundle['created_at'],
            'updatedAt' => (string) $bundle['updated_at'],
        ];
    }
}
