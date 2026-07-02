<?php

declare(strict_types=1);

use LoupSauvage\Auth\SessionManager;
use LoupSauvage\Database\Connection;
use LoupSauvage\Http\Request;
use LoupSauvage\Middleware\RequireOwner;
use LoupSauvage\Repositories\AdminModelRepository;
use LoupSauvage\Repositories\UserRepository;
use LoupSauvage\Services\AdminModelService;
use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../config/bootstrap.php';

try {
    $request = new Request();
    $method = $request->method();

    if (!in_array($method, ['POST', 'DELETE'], true)) {
        throw new ApiException('METHOD_NOT_ALLOWED', 'Method not allowed.', 405);
    }

    $db = (new Connection($config))->pdo();
    (new RequireOwner(new SessionManager($config), new UserRepository($db)))->authorize(true);

    $service = new AdminModelService(new AdminModelRepository($db), $config);

    if ($method === 'POST') {
        Response::success($service->upload($_POST, $_FILES), 201);
        return;
    }

    Response::success($service->delete($request->query()));
} catch (ApiException $error) {
    Response::error($error->apiCode(), $error->getMessage(), $error->status(), $error->fields());
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to handle admin model request.', 500);
}

