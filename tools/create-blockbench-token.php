<?php

declare(strict_types=1);

use LoupSauvage\Database\Connection;
use LoupSauvage\Repositories\BlockbenchApiTokenRepository;

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

$repository = new BlockbenchApiTokenRepository((new Connection($config))->pdo());

for ($attempt = 0; $attempt < 5; ++$attempt) {
    $token = 'lsbb_' . bin2hex(random_bytes(32));
    $prefix = substr($token, 0, 12);

    try {
        $id = $repository->create($name, $prefix, hash('sha256', $token));
        fwrite(STDOUT, "Blockbench token created with id {$id}.\n");
        fwrite(STDOUT, "Copiez ce token maintenant, il ne sera plus affiché.\n");
        fwrite(STDOUT, $token . "\n");
        exit(0);
    } catch (PDOException $error) {
        if ($error->getCode() !== '23000') {
            throw $error;
        }
    }
}

fwrite(STDERR, "Unable to create a unique Blockbench token. Please retry.\n");
exit(1);
