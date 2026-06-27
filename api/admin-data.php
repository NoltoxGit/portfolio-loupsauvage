<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

try {
    migrate();
    require_admin();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        json_response(['ok' => true, 'data' => get_site_data()]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $payload = read_json_body();
        $data = $payload['data'] ?? $payload;
        $previousData = get_site_data();
        $nextData = normalize_site_payload(is_array($data) ? $data : []);
        save_site_data($nextData);
        delete_unused_uploads($previousData, $nextData);
        json_response(['ok' => true, 'data' => get_site_data()]);
    }

    json_response(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
} catch (Throwable $error) {
    json_response(['ok' => false, 'error' => 'SERVER_ERROR'], 500);
}
