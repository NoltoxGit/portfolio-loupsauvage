<?php

declare(strict_types=1);

use LoupSauvage\Database\Connection;
use LoupSauvage\Repositories\PublicPricingRepository;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../config/bootstrap.php';

try {
    $repository = new PublicPricingRepository((new Connection($config))->pdo());

    Response::success($repository->listActive());
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to load public pricing.', 500);
}
