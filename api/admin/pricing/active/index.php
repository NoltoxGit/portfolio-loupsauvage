<?php

declare(strict_types=1);

use LoupSauvage\Auth\SessionManager;
use LoupSauvage\Database\Connection;
use LoupSauvage\Http\Request;
use LoupSauvage\Middleware\RequireOwner;
use LoupSauvage\Repositories\AdminPricingRepository;
use LoupSauvage\Repositories\UserRepository;
use LoupSauvage\Services\AdminPricingService;
use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Response;

$config = require __DIR__ . '/../../../config/bootstrap.php';

try {
    $request = new Request();

    if ($request->method() !== 'PATCH') {
        throw new ApiException('METHOD_NOT_ALLOWED', 'Method not allowed.', 405);
    }

    $db = (new Connection($config))->pdo();
    (new RequireOwner(new SessionManager($config), new UserRepository($db)))->authorize(true);

    $service = new AdminPricingService(new AdminPricingRepository($db));

    Response::success($service->setActive(queryId($request->query()), $request->json()));
} catch (ApiException $error) {
    Response::error($error->apiCode(), $error->getMessage(), $error->status(), $error->fields());
} catch (Throwable $error) {
    Response::error('SERVER_ERROR', 'Unable to update pricing active state.', 500);
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
