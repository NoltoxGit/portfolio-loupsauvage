<?php

declare(strict_types=1);

use LoupSauvage\Database\Connection;
use LoupSauvage\Repositories\PublicContentRepository;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../config/bootstrap.php';

try {
    $repository = new PublicContentRepository((new Connection($config))->pdo());

    Response::success($repository->listPublishedByType('marketplace'));
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to load public marketplace.', 500);
}
