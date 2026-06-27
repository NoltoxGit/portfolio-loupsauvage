<?php

declare(strict_types=1);

namespace LoupSauvage\Database;

use LoupSauvage\Support\Config;
use PDO;

final class Connection
{
    private ?PDO $pdo = null;

    public function __construct(private readonly Config $config)
    {
    }

    public function pdo(): PDO
    {
        if ($this->pdo instanceof PDO) {
            return $this->pdo;
        }

        $charset = $this->config->string('database.charset', 'utf8mb4');
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $this->config->string('database.host', '127.0.0.1'),
            $this->config->int('database.port', 3306),
            $this->config->string('database.name', 'loupsauvage_portfolio'),
            $charset
        );

        $this->pdo = new PDO(
            $dsn,
            $this->config->string('database.user', 'root'),
            $this->config->string('database.password', ''),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );

        return $this->pdo;
    }
}
