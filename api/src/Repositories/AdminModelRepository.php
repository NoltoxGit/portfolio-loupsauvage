<?php

declare(strict_types=1);

namespace LoupSauvage\Repositories;

use PDO;

final class AdminModelRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByContentId(int $contentItemId): ?array
    {
        $statement = $this->db->prepare('
            SELECT
                id,
                type,
                title,
                model_glb_path,
                model_preview_image_path,
                model_watermark_enabled
            FROM content_items
            WHERE id = :id
            LIMIT 1
        ');
        $statement->execute(['id' => $contentItemId]);

        $item = $statement->fetch();

        return is_array($item) ? $this->map($item) : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function saveModel(int $contentItemId, string $modelPath): ?array
    {
        $statement = $this->db->prepare('
            UPDATE content_items
            SET
                model_glb_path = :model_glb_path,
                model_preview_image_path = NULL,
                model_watermark_enabled = 1
            WHERE id = :id
        ');
        $statement->execute([
            'id' => $contentItemId,
            'model_glb_path' => $modelPath,
        ]);

        return $this->findByContentId($contentItemId);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function savePreview(int $contentItemId, string $previewPath): ?array
    {
        $statement = $this->db->prepare('
            UPDATE content_items
            SET model_preview_image_path = :model_preview_image_path
            WHERE id = :id
        ');
        $statement->execute([
            'id' => $contentItemId,
            'model_preview_image_path' => $previewPath,
        ]);

        return $this->findByContentId($contentItemId);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function clearModel(int $contentItemId): ?array
    {
        $statement = $this->db->prepare('
            UPDATE content_items
            SET
                model_glb_path = NULL,
                model_preview_image_path = NULL,
                model_watermark_enabled = 1
            WHERE id = :id
        ');
        $statement->execute(['id' => $contentItemId]);

        return $this->findByContentId($contentItemId);
    }

    /**
     * @param array<string, mixed> $item
     * @return array<string, mixed>
     */
    private function map(array $item): array
    {
        return [
            'contentItemId' => (int) $item['id'],
            'type' => (string) $item['type'],
            'title' => (string) $item['title'],
            'modelGlbPath' => $item['model_glb_path'],
            'modelPreviewImagePath' => $item['model_preview_image_path'],
            'modelWatermarkEnabled' => (bool) $item['model_watermark_enabled'],
        ];
    }
}

