<?php

declare(strict_types=1);

namespace LoupSauvage\Repositories;

use PDO;

final class PublicPricingRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listActive(): array
    {
        $statement = $this->db->prepare('
            SELECT id, slug, title, subtitle, price_label, description, features_json, sort_order
            FROM pricing_plans
            WHERE is_active = :is_active
            ORDER BY sort_order ASC, id ASC
        ');

        $statement->execute(['is_active' => 1]);

        return array_map(static function (array $plan): array {
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
            ];
        }, $statement->fetchAll());
    }
}
