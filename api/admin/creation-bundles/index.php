<?php

declare(strict_types=1);

use LoupSauvage\Auth\SessionManager;
use LoupSauvage\Database\Connection;
use LoupSauvage\Http\Request;
use LoupSauvage\Middleware\RequireOwner;
use LoupSauvage\Repositories\AdminContentRepository;
use LoupSauvage\Repositories\CreationBundleRepository;
use LoupSauvage\Repositories\UserRepository;
use LoupSauvage\Services\CreationBundleService;
use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../config/bootstrap.php';

try {
    $request = new Request();
    $method = $request->method();

    if (!in_array($method, ['GET', 'POST', 'PATCH', 'DELETE'], true)) {
        throw new ApiException('METHOD_NOT_ALLOWED', 'Method not allowed.', 405);
    }

    $db = (new Connection($config))->pdo();
    $auth = (new RequireOwner(new SessionManager($config), new UserRepository($db)))->authorize($method !== 'GET');
    $ownerId = ownerIdFromAuth($auth);
    $service = new CreationBundleService(
        new CreationBundleRepository($db),
        new AdminContentRepository($db),
    );

    if ($method === 'GET') {
        $query = $request->query();

        if (array_key_exists('id', $query)) {
            Response::success($service->find(queryId($query)));
            return;
        }

        Response::success($service->list());
        return;
    }

    if ($method === 'POST') {
        Response::success($service->create($request->json(), $ownerId), 201);
        return;
    }

    if ($method === 'PATCH') {
        Response::success($service->update(queryId($request->query()), $request->json(), $ownerId));
        return;
    }

    Response::success($service->delete(queryId($request->query())));
} catch (ApiException $error) {
    Response::error($error->apiCode(), $error->getMessage(), $error->status(), $error->fields());
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to handle creation bundle request.', 500);
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
