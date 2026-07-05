<?php

declare(strict_types=1);

use LoupSauvage\Database\Connection;
use LoupSauvage\Repositories\BlockbenchApiTokenRepository;
use LoupSauvage\Services\BlockbenchApiTokenService;

$config = require __DIR__ . '/../api/config/bootstrap.php';

$name = trim((string) ($argv[1] ?? ''));

if ($name === '') {
    fwrite(STDERR, "Usage: php tools/create-blockbench-token.php \"Token name\"\n");
    exit(1);
}

if (strlen($name) > 120) {
    fwrite(STDERR, "Token name must contain 120 characters or fewer.\n");
    exit(1);
}

$service = new BlockbenchApiTokenService(new BlockbenchApiTokenRepository((new Connection($config))->pdo()));
$created = $service->create($name);
$item = is_array($created['item'] ?? null) ? $created['item'] : [];

fwrite(STDOUT, "Blockbench token created with id {$item['id']}.\n");
fwrite(STDOUT, "Copiez ce token maintenant, il ne sera plus affiché.\n");
fwrite(STDOUT, $created['token'] . "\n");
