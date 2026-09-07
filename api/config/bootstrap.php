<?php

declare(strict_types=1);

use LoupSauvage\Support\Config;

spl_autoload_register(static function (string $class): void {
    $prefix = 'LoupSauvage\\';

    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $path = __DIR__ . '/../src/' . str_replace('\\', '/', $relativeClass) . '.php';

    if (is_file($path)) {
        require $path;
    }
});

$environmentValue = getenv('APP_ENV');
$environment = is_string($environmentValue) ? strtolower(trim($environmentValue)) : '';

if ($environment === 'production') {
    $configFile = __DIR__ . '/config.production.php';

    if (!is_file($configFile)) {
        throw new RuntimeException(
            'Production configuration is missing. Create api/config/config.production.php on the server via SFTP.'
        );
    }
} elseif ($environment !== '') {
    $configFile = __DIR__ . '/config.' . $environment . '.php';

    if (!is_file($configFile)) {
        $configFile = __DIR__ . '/config.example.php';
    }
} else {
    $configCandidates = [
        __DIR__ . '/config.local.php',
        __DIR__ . '/config.production.php',
        __DIR__ . '/config.example.php',
    ];

    $configFile = null;

    foreach ($configCandidates as $candidate) {
        if (is_file($candidate)) {
            $configFile = $candidate;
            break;
        }
    }

    if ($configFile === null) {
        throw new RuntimeException('No API configuration file is available.');
    }
}

$config = require $configFile;

if (!is_array($config)) {
    throw new RuntimeException('API configuration must return an array.');
}

return new Config($config);
