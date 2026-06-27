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

    if ($request->method() !== 'POST') {
        Response::error('METHOD_NOT_ALLOWED', 'Method not allowed.', 405);
        return;
    }

    $payload = $request->json();
    $email = trim((string) ($payload['email'] ?? ''));
    $password = (string) ($payload['password'] ?? '');

    if ($email === '' || $password === '') {
        Response::error('VALIDATION_ERROR', 'Email and password are required.', 422, [
            'email' => $email === '' ? 'Email is required.' : '',
            'password' => $password === '' ? 'Password is required.' : '',
        ]);
        return;
    }

    $db = (new Connection($config))->pdo();
    $auth = new AuthService(new UserRepository($db), new SessionManager($config));
    $session = $auth->login($email, $password);

    if ($session === null) {
        Response::error('INVALID_CREDENTIALS', 'Invalid credentials.', 401);
        return;
    }

    Response::success($session);
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to login.', 500);
}
