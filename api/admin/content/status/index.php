<?php

declare(strict_types=1);

use LoupSauvage\Auth\SessionManager;
use LoupSauvage\Database\Connection;
use LoupSauvage\Http\Request;
use LoupSauvage\Middleware\RequireOwner;
use LoupSauvage\Repositories\AdminContentRepository;
use LoupSauvage\Repositories\UserRepository;
use LoupSauvage\Services\AdminContentService;
use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../../config/bootstrap.php';

try {
    $request = new Request();

    if ($request->method() !== 'PATCH') {
        throw new ApiException('METHOD_NOT_ALLOWED', 'Method not allowed.', 405);
    }

    $db = (new Connection($config))->pdo();
    $auth = (new RequireOwner(new SessionManager($config), new UserRepository($db)))->authorize(true);
    $ownerId = ownerIdFromAuth($auth);

    $service = new AdminContentService(new AdminContentRepository($db));

    Response::success($service->updateStatus(queryId($request->query()), $request->json(), $ownerId));
} catch (ApiException $error) {
    Response::error($error->apiCode(), $error->getMessage(), $error->status(), $error->fields());
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to update content status.', 500);
}

/**
 * @param array<string, mixed> $query
 */
function queryId(array $query): int
{
    $id = $query['id'] ?? null;

    if (!is_numeric($id) || (int) $id <= 0) {
        throw new ApiException('VALIDATION_ERROR', 'Invalid id.', 422, [
            'id' => 'A valid numeric id is required.',
        ]);
    }

    return (int) $id;
}

/**
 * @param array<string, mixed> $auth
 */
function ownerIdFromAuth(array $auth): ?int
{
    $owner = $auth['owner'] ?? null;

    return is_array($owner) && isset($owner['id']) && is_numeric($owner['id']) ? (int) $owner['id'] : null;
}
