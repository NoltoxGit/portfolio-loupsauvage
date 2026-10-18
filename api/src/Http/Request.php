<?php

declare(strict_types=1);

namespace LoupSauvage\Http;

final class Request
{
    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH);

        return is_string($path) ? $path : '/';
    }

    /**
     * @return array<string, mixed>
     */
    public function query(): array
    {
        return $_GET;
    }

    /**
     * @return array<string, mixed>
     */
    public function json(): array
    {
        $rawBody = file_get_contents('php://input');

        if ($rawBody === false || trim($rawBody) === '') {
            return [];
        }

        $payload = json_decode($rawBody, true);

        return is_array($payload) ? $payload : [];
    }
}
