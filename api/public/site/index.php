<?php

declare(strict_types=1);

use LoupSauvage\Database\Connection;
use LoupSauvage\Repositories\PublicContentRepository;
use LoupSauvage\Repositories\PublicPricingRepository;
use LoupSauvage\Services\PublicSiteService;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../config/bootstrap.php';

try {
    $db = (new Connection($config))->pdo();
    $service = new PublicSiteService(
        new PublicContentRepository($db),
        new PublicPricingRepository($db)
    );

    Response::success($service->site());
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to load public site data.', 500);
}
