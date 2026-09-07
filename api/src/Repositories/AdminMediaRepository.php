<?php

declare(strict_types=1);

namespace LoupSauvage\Repositories;

use PDO;

final class AdminMediaRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    public function contentExists(int $contentItemId): bool
    {
        $statement = $this->db->prepare('
            SELECT 1
            FROM content_items
            WHERE id = :id
            LIMIT 1
        ');
        $statement->execute(['id' => $contentItemId]);

        return $statement->fetchColumn() !== false;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listByContentItemId(int $contentItemId): array
    {
        $statement = $this->db->prepare($this->selectSql() . '
            WHERE content_item_id = :content_item_id
            ORDER BY sort_order ASC, id ASC
        ');
        $statement->execute(['content_item_id' => $contentItemId]);

        return array_map(
            fn (array $row): array => $this->map($row),
            $statement->fetchAll()
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $statement = $this->db->prepare($this->selectSql() . '
            WHERE id = :id
            LIMIT 1
        ');
        $statement->execute(['id' => $id]);

        $row = $statement->fetch();

        return is_array($row) ? $this->map($row) : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function create(
        int $contentItemId,
        string $kind,
        string $path,
        ?string $alt,
        int $sortOrder,
        ?int $ownerId = null,
    ): array {
        $statement = $this->db->prepare('
            INSERT INTO content_media (
                content_item_id,
                kind,
                path,
                alt,
                sort_order,
                uploaded_by_user_id,
                updated_by_user_id
            ) VALUES (
                :content_item_id,
                :kind,
                :path,
                :alt,
                :sort_order,
                :uploaded_by_user_id,
                :updated_by_user_id
            )
        ');
        $statement->execute([
            'content_item_id' => $contentItemId,
            'kind' => $kind,
            'path' => $path,
            'alt' => $alt,
            'sort_order' => $sortOrder,
            'uploaded_by_user_id' => $ownerId,
            'updated_by_user_id' => $ownerId,
        ]);

        return $this->findById((int) $this->db->lastInsertId()) ?? [];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function update(int $id, string $kind, ?string $alt, int $sortOrder, ?int $ownerId = null): ?array
    {
        $statement = $this->db->prepare('
            UPDATE content_media
            SET
                kind = :kind,
                alt = :alt,
                sort_order = :sort_order,
                updated_by_user_id = :updated_by_user_id
            WHERE id = :id
        ');
        $statement->execute([
            'id' => $id,
            'kind' => $kind,
            'alt' => $alt,
            'sort_order' => $sortOrder,
            'updated_by_user_id' => $ownerId,
        ]);

        return $this->findById($id);
    }

    public function delete(int $id): void
    {
        $statement = $this->db->prepare('
            DELETE FROM content_media
            WHERE id = :id
        ');
        $statement->execute(['id' => $id]);
    }

    private function selectSql(): string
    {
        return '
            SELECT
                id,
                content_item_id,
                kind,
                path,
                alt,
                sort_order,
                uploaded_by_user_id,
                updated_by_user_id,
                created_at
            FROM content_media';
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function map(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'contentItemId' => (int) $row['content_item_id'],
            'kind' => (string) $row['kind'],
            'path' => (string) $row['path'],
            'alt' => $row['alt'],
            'sortOrder' => (int) $row['sort_order'],
            'uploadedByUserId' => isset($row['uploaded_by_user_id']) ? (int) $row['uploaded_by_user_id'] : null,
            'updatedByUserId' => isset($row['updated_by_user_id']) ? (int) $row['updated_by_user_id'] : null,
            'createdAt' => $row['created_at'],
        ];
    }
}
