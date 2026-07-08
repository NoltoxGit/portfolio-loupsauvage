<?php

declare(strict_types=1);

use LoupSauvage\Database\Connection;
use LoupSauvage\Repositories\PublicContentRepository;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../config/bootstrap.php';

try {
    $repository = new PublicContentRepository((new Connection($config))->pdo());
    $slug = isset($_GET['slug']) ? trim((string) $_GET['slug']) : slugFromPath();

    if ($slug === '') {
        Response::error('VALIDATION_ERROR', 'Bundle slug is required.', 422);
        return;
    }

    $bundle = $repository->findVisibleBundleBySlug($slug);

    if ($bundle === null) {
        Response::error('NOT_FOUND', 'Bundle not found.', 404);
        return;
    }

    Response::success($bundle);
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to load public bundle.', 500);
}

function slugFromPath(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);

    if (!is_string($path)) {
        return '';
    }

    if (preg_match('~/api/public/creation-bundles/([^/]+)/?$~', $path, $matches) === 1) {
        return rawurldecode($matches[1]);
    }

    return '';
}
