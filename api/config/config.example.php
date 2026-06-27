<?php

declare(strict_types=1);

/**
 * LoupSauvage Portfolio - Configuration example
 *
 * Copy this file to:
 * - api/config/config.local.php for local development
 * - api/config/config.production.php for WebStrator production
 *
 * Never commit real credentials.
 */

return [
    'app' => [
        'env' => 'local',
        'debug' => true,
        'url' => 'http://localhost:5173',
        'session_name' => 'loupsauvage_session',
        'session_secure' => false,
        'session_same_site' => 'Lax',
        'session_lifetime' => 0,
    ],

    'database' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'loupsauvage_portfolio',
        'user' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
    ],

    'uploads' => [
        'public_path' => '/uploads',
        'filesystem_path' => __DIR__ . '/../../uploads',
        'max_size_bytes' => 10 * 1024 * 1024,
        'allowed_mime_types' => [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
        ],
    ],
];
