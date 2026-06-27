<?php

declare(strict_types=1);

namespace LoupSauvage\Repositories;

use PDO;

final class AdminPricingRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(): array
    {
        $statement = $this->db->prepare('
            SELECT id, slug, title, subtitle, price_label, description, features_json, sort_order, is_active, created_at, updated_at
            FROM pricing_plans
            ORDER BY sort_order ASC, id ASC
        ');
        $statement->execute();

        return array_map($this->mapPlan(...), $statement->fetchAll());
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $statement = $this->db->prepare('
            SELECT id, slug, title, subtitle, price_label, description, features_json, sort_order, is_active, created_at, updated_at
            FROM pricing_plans
            WHERE id = :id
            LIMIT 1
        ');
        $statement->execute(['id' => $id]);

        $plan = $statement->fetch();

        return is_array($plan) ? $this->mapPlan($plan) : null;
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function create(array $data): array
    {
        $statement = $this->db->prepare('
            INSERT INTO pricing_plans (
                slug,
                title,
                subtitle,
                price_label,
                description,
                features_json,
                sort_order,
                is_active
            ) VALUES (
                :slug,
                :title,
                :subtitle,
                :price_label,
                :description,
                :features_json,
                :sort_order,
                :is_active
            )
        ');
        $statement->execute($this->params($data));

        return $this->findById((int) $this->db->lastInsertId()) ?? [];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function update(int $id, array $data): ?array
    {
        $params = $this->params($data);
        $params['id'] = $id;

        $statement = $this->db->prepare('
            UPDATE pricing_plans
            SET
                slug = :slug,
                title = :title,
                subtitle = :subtitle,
                price_label = :price_label,
                description = :description,
                features_json = :features_json,
                sort_order = :sort_order,
                is_active = :is_active
            WHERE id = :id
        ');
        $statement->execute($params);

        return $this->findById($id);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function setActive(int $id, bool $isActive): ?array
    {
        $statement = $this->db->prepare('
            UPDATE pricing_plans
            SET is_active = :is_active
            WHERE id = :id
        ');
        $statement->execute([
            'id' => $id,
            'is_active' => $isActive ? 1 : 0,
        ]);

        return $this->findById($id);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function params(array $data): array
    {
        return [
            'slug' => $data['slug'],
            'title' => $data['title'],
            'subtitle' => $data['subtitle'],
            'price_label' => $data['price_label'],
            'description' => $data['description'],
            'features_json' => json_encode($data['features'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'sort_order' => $data['sort_order'],
            'is_active' => $data['is_active'] ? 1 : 0,
        ];
    }

    /**
     * @param array<string, mixed> $plan
     * @return array<string, mixed>
     */
    private function mapPlan(array $plan): array
    {
        $features = json_decode((string) ($plan['features_json'] ?? '[]'), true);

        return [
            'id' => (int) $plan['id'],
            'slug' => (string) $plan['slug'],
            'title' => (string) $plan['title'],
            'subtitle' => $plan['subtitle'],
            'priceLabel' => (string) $plan['price_label'],
            'description' => $plan['description'],
            'features' => is_array($features) ? array_values($features) : [],
            'sortOrder' => (int) $plan['sort_order'],
            'isActive' => (bool) $plan['is_active'],
            'createdAt' => $plan['created_at'],
            'updatedAt' => $plan['updated_at'],
        ];
    }
}
