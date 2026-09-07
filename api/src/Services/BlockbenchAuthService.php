<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use LoupSauvage\Repositories\BlockbenchApiTokenRepository;
use LoupSauvage\Support\ApiException;

final class BlockbenchAuthService
{
    private const TOKEN_PREFIX_LENGTH = 12;

    public function __construct(private readonly BlockbenchApiTokenRepository $tokens)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function authorizeFromServer(): array
    {
        $authorization = $this->authorizationHeader();

        $token = $this->tokenFromAuthorization($authorization);

        if (!str_starts_with($token, 'lsbb_') || strlen($token) <= self::TOKEN_PREFIX_LENGTH) {
            throw new ApiException('UNAUTHENTICATED', 'Invalid integration token.', 401);
        }

        $tokenRow = $this->tokens->findUsableByPrefix(substr($token, 0, self::TOKEN_PREFIX_LENGTH));
        $tokenHash = hash('sha256', $token);

        if ($tokenRow === null || !hash_equals((string) $tokenRow['token_hash'], $tokenHash)) {
            throw new ApiException('UNAUTHENTICATED', 'Invalid integration token.', 401);
        }

        $this->tokens->markUsed((int) $tokenRow['id']);

        return [
            'id' => (int) $tokenRow['id'],
            'name' => (string) $tokenRow['name'],
            'createdByUserId' => isset($tokenRow['created_by_user_id']) && is_numeric($tokenRow['created_by_user_id'])
                ? (int) $tokenRow['created_by_user_id']
                : null,
        ];
    }

    private function tokenFromAuthorization(string $authorization): string
    {
        if (preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            return trim($matches[1]);
        }

        $fallback = $_SERVER['HTTP_X_BLOCKBENCH_TOKEN'] ?? '';

        return is_string($fallback) ? trim($fallback) : '';
    }

    private function authorizationHeader(): string
    {
        foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $key) {
            $value = $_SERVER[$key] ?? null;

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();

            foreach ($headers as $name => $value) {
                if (strtolower((string) $name) === 'authorization' && is_string($value)) {
                    return trim($value);
                }
            }
        }

        return '';
    }
}
