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
 * Production values must use debug=false and session_secure=true.
 * Create config.production.php directly on WebStrator via SFTP.
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
        'session_remember_lifetime' => 2592000,
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
        'model_max_size_bytes' => 50 * 1024 * 1024,
        'model_preview_max_size_bytes' => 5 * 1024 * 1024,
        'allowed_mime_types' => [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
        ],
    ],

    'builtbybit' => [
        'api_base_url' => 'https://api.builtbybit.com',
        'api_token' => '',
    ],
];
