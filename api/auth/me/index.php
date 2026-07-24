<?php

declare(strict_types=1);

use LoupSauvage\Auth\SessionManager;
use LoupSauvage\Database\Connection;
use LoupSauvage\Http\Request;
use LoupSauvage\Repositories\UserRepository;
use LoupSauvage\Services\AuthService;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../config/bootstrap.php';

try {
    $request = new Request();

    if ($request->method() !== 'GET') {
        Response::error('METHOD_NOT_ALLOWED', 'Method not allowed.', 405);
        return;
    }

    $sessionManager = new SessionManager($config);
    if ($sessionManager->ownerId() === null) {
        Response::error('UNAUTHENTICATED', 'Authentication required.', 401);
        return;
    }

    $db = (new Connection($config))->pdo();
    $auth = new AuthService(new UserRepository($db), $sessionManager);
    $session = $auth->currentSession();

    if ($session === null) {
        Response::error('UNAUTHENTICATED', 'Authentication required.', 401);
        return;
    }

    Response::success($session);
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to load session.', 500);
}
