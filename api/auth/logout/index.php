<?php

declare(strict_types=1);

use LoupSauvage\Auth\Csrf;
use LoupSauvage\Auth\SessionManager;
use LoupSauvage\Http\Request;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../config/bootstrap.php';

try {
    $request = new Request();

    if ($request->method() !== 'POST') {
        Response::error('METHOD_NOT_ALLOWED', 'Method not allowed.', 405);
        return;
    }

    $session = new SessionManager($config);

    if ($session->isOwner() && !(new Csrf($session))->isValid()) {
        Response::error('CSRF_INVALID', 'Invalid CSRF token.', 403);
        return;
    }

    $session->logout();
    Response::success(['loggedOut' => true]);
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to logout.', 500);
}
