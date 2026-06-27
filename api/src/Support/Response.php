<?php

declare(strict_types=1);

namespace LoupSauvage\Support;

final class Response
{
    /**
     * @param array<string, mixed> $headers
     */
    public static function json(array $payload, int $status = 200, array $headers = []): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        foreach ($headers as $name => $value) {
            header($name . ': ' . $value);
        }

        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param mixed $data
     */
    public static function success(mixed $data = null, int $status = 200): void
    {
        self::json([
            'success' => true,
            'data' => $data,
        ], $status);
    }

    /**
     * @param array<string, string> $fields
     */
    public static function error(
        string $code,
        string $message,
        int $status = 400,
        array $fields = [],
    ): void {
        self::json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'fields' => $fields,
            ],
        ], $status);
    }
}
