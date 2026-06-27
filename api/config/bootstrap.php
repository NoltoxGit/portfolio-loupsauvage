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

$environment = getenv('APP_ENV') ?: 'local';
$configFile = __DIR__ . '/config.' . $environment . '.php';

if (!is_file($configFile)) {
    $configFile = __DIR__ . '/config.example.php';
}

$config = require $configFile;

if (!is_array($config)) {
    throw new RuntimeException('API configuration must return an array.');
}

return new Config($config);
