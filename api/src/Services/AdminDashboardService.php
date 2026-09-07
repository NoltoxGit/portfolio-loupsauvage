<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use PDO;

final class AdminDashboardService
{
    public function __construct(private readonly PDO $db)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        $contentByStatus = $this->countsBy('content_items', 'status');
        $contentByType = $this->countsBy('content_items', 'type');
        $pricingByActive = $this->pricingCounts();

        return [
            'content' => [
                'total' => array_sum($contentByStatus),
                'draft' => $contentByStatus['draft'] ?? 0,
                'published' => $contentByStatus['published'] ?? 0,
                'archived' => $contentByStatus['archived'] ?? 0,
                'creations' => $contentByType['creation'] ?? 0,
                'marketplace' => $contentByType['marketplace'] ?? 0,
            ],
            'pricing' => [
                'total' => array_sum($pricingByActive),
                'active' => $pricingByActive['active'] ?? 0,
                'inactive' => $pricingByActive['inactive'] ?? 0,
            ],
        ];
    }

    /**
     * @return array<string, int>
     */
    private function countsBy(string $table, string $column): array
    {
        $statement = $this->db->prepare("SELECT $column AS group_name, COUNT(*) AS total FROM $table GROUP BY $column");
        $statement->execute();

        $counts = [];
        foreach ($statement->fetchAll() as $row) {
            $counts[(string) $row['group_name']] = (int) $row['total'];
        }

        return $counts;
    }

    /**
     * @return array<string, int>
     */
    private function pricingCounts(): array
    {
        $statement = $this->db->prepare('
            SELECT is_active, COUNT(*) AS total
            FROM pricing_plans
            GROUP BY is_active
        ');
        $statement->execute();

        $counts = [];
        foreach ($statement->fetchAll() as $row) {
            $counts[(int) $row['is_active'] === 1 ? 'active' : 'inactive'] = (int) $row['total'];
        }

        return $counts;
    }
}
