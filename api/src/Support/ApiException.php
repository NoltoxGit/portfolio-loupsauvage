<?php

declare(strict_types=1);

namespace LoupSauvage\Support;

use RuntimeException;

final class ApiException extends RuntimeException
{
    /**
     * @param array<string, string> $fields
     */
    public function __construct(
        private readonly string $apiCode,
        string $message,
        private readonly int $status = 400,
        private readonly array $fields = [],
    ) {
        parent::__construct($message);
    }

    public function apiCode(): string
    {
        return $this->apiCode;
    }

    public function status(): int
    {
        return $this->status;
    }

    /**
     * @return array<string, string>
     */
    public function fields(): array
    {
        return $this->fields;
    }
}
