<?php

declare(strict_types=1);

use LoupSauvage\Database\Connection;
use LoupSauvage\Repositories\PublicContentRepository;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../config/bootstrap.php';

try {
    $repository = new PublicContentRepository((new Connection($config))->pdo());
    $slug = isset($_GET['slug']) ? trim((string) $_GET['slug']) : '';

    if ($slug !== '') {
        $creation = $repository->findPublishedCreationBySlug($slug);

        if ($creation === null) {
            Response::error('NOT_FOUND', 'Creation not found.', 404);
            return;
        }

        Response::success($creation);
        return;
    }

    Response::success($repository->creationsArchive());
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to load public creations.', 500);
}
