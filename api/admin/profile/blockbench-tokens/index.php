<?php

declare(strict_types=1);

use LoupSauvage\Auth\SessionManager;
use LoupSauvage\Database\Connection;
use LoupSauvage\Http\Request;
use LoupSauvage\Middleware\RequireOwner;
use LoupSauvage\Repositories\BlockbenchApiTokenRepository;
use LoupSauvage\Repositories\UserRepository;
use LoupSauvage\Services\AdminProfileService;
use LoupSauvage\Services\BlockbenchApiTokenService;
use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../../config/bootstrap.php';

try {
    $request = new Request();

    if ($request->method() !== 'POST') {
        throw new ApiException('METHOD_NOT_ALLOWED', 'Method not allowed.', 405);
    }

    $db = (new Connection($config))->pdo();
    $auth = (new RequireOwner(new SessionManager($config), new UserRepository($db)))->authorize(true);
    $owner = $auth['owner'] ?? null;

    if (!is_array($owner) || !isset($owner['id']) || !is_numeric($owner['id'])) {
        throw new ApiException('UNAUTHENTICATED', 'Authentication required.', 401);
    }

    $service = new AdminProfileService(
        new UserRepository($db),
        new BlockbenchApiTokenService(new BlockbenchApiTokenRepository($db)),
    );

    Response::success($service->createBlockbenchToken((int) $owner['id'], $request->json()), 201);
} catch (ApiException $error) {
    Response::error($error->apiCode(), $error->getMessage(), $error->status(), $error->fields());
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to create Blockbench token.', 500);
}
