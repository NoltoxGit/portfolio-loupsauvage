<?php

declare(strict_types=1);

use LoupSauvage\Database\Connection;
use LoupSauvage\Repositories\UserRepository;

$config = require __DIR__ . '/../api/config/bootstrap.php';

function prompt_value(string $label): string
{
    if (function_exists('readline')) {
        $value = readline($label);
        return is_string($value) ? trim($value) : '';
    }

    fwrite(STDOUT, $label);
    $value = fgets(STDIN);

    return is_string($value) ? trim($value) : '';
}

$username = trim((string) ($argv[1] ?? ''));
$email = trim((string) ($argv[2] ?? ''));

if ($username === '' || $email === '') {
    fwrite(STDERR, "Usage: php tools/create-owner.php <username> <email>\n");
    exit(1);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Invalid email.\n");
    exit(1);
}

$password = prompt_value('Owner password: ');

if (strlen($password) < 8) {
    fwrite(STDERR, "Password must contain at least 8 characters.\n");
    exit(1);
}

$repository = new UserRepository((new Connection($config))->pdo());
$repository->upsertOwner($username, $email, password_hash($password, PASSWORD_DEFAULT));

fwrite(STDOUT, "Owner user created or updated for {$email}.\n");
