<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

try {
    migrate();

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        json_response(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
    }

    json_response(['ok' => true, 'data' => get_site_data()]);
} catch (Throwable $error) {
    json_response(['ok' => false, 'error' => 'SERVER_ERROR'], 500);
}
