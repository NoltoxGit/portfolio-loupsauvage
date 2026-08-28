<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use LoupSauvage\Repositories\PublicContentRepository;
use LoupSauvage\Repositories\PublicPricingRepository;

final class PublicSiteService
{
    public function __construct(
        private readonly PublicContentRepository $content,
        private readonly PublicPricingRepository $pricing,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function site(): array
    {
        return [
            'latestCreations' => $this->content->listPublishedByType('creation', 6),
            'marketplace' => $this->content->listPublishedByType('marketplace', 6),
            'pricing' => $this->pricing->listActive(),
        ];
    }
}
