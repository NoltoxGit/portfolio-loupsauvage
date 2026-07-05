<?php

declare(strict_types=1);

use LoupSauvage\Database\Connection;
use LoupSauvage\Http\Request;
use LoupSauvage\Repositories\AdminContentRepository;
use LoupSauvage\Repositories\AdminModelRepository;
use LoupSauvage\Repositories\BlockbenchApiTokenRepository;
use LoupSauvage\Services\AdminContentService;
use LoupSauvage\Services\AdminModelService;
use LoupSauvage\Services\BlockbenchAuthService;
use LoupSauvage\Services\BlockbenchCreationService;
use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../../config/bootstrap.php';

try {
    $request = new Request();

    if ($request->method() !== 'POST') {
        throw new ApiException('METHOD_NOT_ALLOWED', 'Method not allowed.', 405);
    }

    $db = (new Connection($config))->pdo();
    $contentRepository = new AdminContentRepository($db);
    $modelRepository = new AdminModelRepository($db);

    (new BlockbenchAuthService(new BlockbenchApiTokenRepository($db)))->authorizeFromServer();

    $service = new BlockbenchCreationService(
        new AdminContentService($contentRepository),
        $contentRepository,
        new AdminModelService($modelRepository, $config),
        $config
    );

    Response::success($service->createDraftFromUpload($_POST, $_FILES), 201);
} catch (ApiException $error) {
    Response::error($error->apiCode(), $error->getMessage(), $error->status(), $error->fields());
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to handle Blockbench creation import.', 500);
}
