<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use LoupSauvage\Repositories\AdminPricingRepository;
use LoupSauvage\Support\ApiException;
use PDOException;

final class AdminPricingService
{
    public function __construct(private readonly AdminPricingRepository $pricing)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(): array
    {
        return $this->pricing->list();
    }

    /**
     * @return array<string, mixed>
     */
    public function find(int $id): array
    {
        $plan = $this->pricing->findById($id);

        if ($plan === null) {
            throw new ApiException('NOT_FOUND', 'Pricing plan not found.', 404);
        }

        return $plan;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function create(array $payload, ?int $ownerId = null): array
    {
        $data = $this->validatePayload($payload, null);
        $data['created_by_user_id'] = $ownerId;
        $data['updated_by_user_id'] = $ownerId;
        $data['published_by_user_id'] = $data['is_active'] ? $ownerId : null;

        try {
            return $this->pricing->create($data);
        } catch (PDOException $error) {
            $this->throwDuplicateSlugIfNeeded($error);
            throw $error;
        }
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function update(int $id, array $payload, ?int $ownerId = null): array
    {
        $existing = $this->pricing->findById($id);

        if ($existing === null) {
            throw new ApiException('NOT_FOUND', 'Pricing plan not found.', 404);
        }

        $data = $this->validatePayload($payload, $existing);
        $data['updated_by_user_id'] = $ownerId;
        $data['published_by_user_id'] = $this->publishedByUserId($data['is_active'], $existing, $ownerId);

        try {
            $updated = $this->pricing->update($id, $data);
        } catch (PDOException $error) {
            $this->throwDuplicateSlugIfNeeded($error);
            throw $error;
        }

        if ($updated === null) {
            throw new ApiException('NOT_FOUND', 'Pricing plan not found.', 404);
        }

        return $updated;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function setActive(int $id, array $payload, ?int $ownerId = null): array
    {
        if (!array_key_exists('isActive', $payload)) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid pricing active payload.', 422, [
                'isActive' => 'This field is required.',
            ]);
        }

        $fields = [];
        $isActive = $this->boolValue($payload, 'isActive', false, $fields);

        if ($fields !== []) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid pricing active payload.', 422, $fields);
        }

        $updated = $this->pricing->setActive($id, $isActive, $ownerId);

        if ($updated === null) {
            throw new ApiException('NOT_FOUND', 'Pricing plan not found.', 404);
        }

        return $updated;
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, mixed>|null $existing
     * @return array<string, mixed>
     */
    private function validatePayload(array $payload, ?array $existing): array
    {
        $fields = [];

        $data = [
            'slug' => $this->requiredSlug($payload, 'slug', $existing['slug'] ?? null, 160, $fields),
            'title' => $this->requiredString($payload, 'title', $existing['title'] ?? null, 190, $fields),
            'subtitle' => $this->nullableString($payload, 'subtitle', $existing['subtitle'] ?? null, 190, $fields),
            'price_label' => $this->requiredString($payload, 'priceLabel', $existing['priceLabel'] ?? null, 120, $fields),
            'description' => $this->nullableString($payload, 'description', $existing['description'] ?? null, 65535, $fields),
            'features' => $this->features($payload, $existing['features'] ?? [], $fields),
            'sort_order' => $this->intValue($payload, 'sortOrder', (int) ($existing['sortOrder'] ?? 0), $fields),
            'is_active' => $this->boolValue($payload, 'isActive', (bool) ($existing['isActive'] ?? true), $fields),
        ];

        if ($fields !== []) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid pricing payload.', 422, $fields);
        }

        return $data;
    }

    /**
     * @param array<string, mixed> $existing
     */
    private function publishedByUserId(bool $isActive, array $existing, ?int $ownerId): ?int
    {
        if (!$isActive) {
            return isset($existing['publishedByUserId']) && is_numeric($existing['publishedByUserId'])
                ? (int) $existing['publishedByUserId']
                : null;
        }

        if (isset($existing['publishedByUserId']) && is_numeric($existing['publishedByUserId'])) {
            return (int) $existing['publishedByUserId'];
        }

        return $ownerId;
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, string> $fields
     */
    private function requiredString(array $payload, string $key, mixed $fallback, int $maxLength, array &$fields): string
    {
        $value = array_key_exists($key, $payload) ? $payload[$key] : $fallback;

        if (!is_scalar($value)) {
            $fields[$key] = 'This field is required.';
            return '';
        }

        $value = trim((string) $value);

        if ($value === '') {
            $fields[$key] = 'This field is required.';
            return '';
        }

        if (strlen($value) > $maxLength) {
            $fields[$key] = 'This field is too long.';
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, string> $fields
     */
    private function requiredSlug(array $payload, string $key, mixed $fallback, int $maxLength, array &$fields): string
    {
        $slug = $this->requiredString($payload, $key, $fallback, $maxLength, $fields);

        if ($slug !== '' && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) !== 1) {
            $fields[$key] = 'Slug must contain lowercase letters, numbers, and hyphens only.';
        }

        return $slug;
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, string> $fields
     */
    private function nullableString(array $payload, string $key, mixed $fallback, int $maxLength, array &$fields): ?string
    {
        $value = array_key_exists($key, $payload) ? $payload[$key] : $fallback;

        if ($value === null) {
            return null;
        }

        if (!is_scalar($value)) {
            $fields[$key] = 'This field is invalid.';
            return null;
        }

        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        if (strlen($value) > $maxLength) {
            $fields[$key] = 'This field is too long.';
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<int, mixed> $fallback
     * @param array<string, string> $fields
     * @return array<int, string>
     */
    private function features(array $payload, array $fallback, array &$fields): array
    {
        $value = array_key_exists('features', $payload) ? $payload['features'] : $fallback;

        if (!is_array($value)) {
            $fields['features'] = 'Features must be an array.';
            return [];
        }

        $features = [];
        foreach ($value as $feature) {
            if (!is_scalar($feature)) {
                $fields['features'] = 'Features must contain strings only.';
                return [];
            }

            $feature = trim((string) $feature);

            if ($feature !== '') {
                $features[] = $feature;
            }
        }

        return $features;
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, string> $fields
     */
    private function boolValue(array $payload, string $key, bool $fallback, array &$fields): bool
    {
        if (!array_key_exists($key, $payload)) {
            return $fallback;
        }

        $value = $payload[$key];

        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value)) {
            return $value === 1;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));

            if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
                return true;
            }

            if (in_array($normalized, ['0', 'false', 'no', 'off', ''], true)) {
                return false;
            }
        }

        $fields[$key] = 'This field must be boolean.';

        return $fallback;
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, string> $fields
     */
    private function intValue(array $payload, string $key, int $fallback, array &$fields): int
    {
        if (!array_key_exists($key, $payload)) {
            return $fallback;
        }

        $value = $payload[$key];

        if (is_int($value) || (is_string($value) && preg_match('/^-?\d+$/', trim($value)) === 1)) {
            return (int) $value;
        }

        $fields[$key] = 'This field must be an integer.';

        return $fallback;
    }

    private function throwDuplicateSlugIfNeeded(PDOException $error): void
    {
        $message = strtolower((string) ($error->errorInfo[2] ?? $error->getMessage()));

        if ($error->getCode() === '23000' && str_contains($message, 'slug')) {
            throw new ApiException('DUPLICATE_SLUG', 'Slug is already used.', 409, [
                'slug' => 'Slug is already used.',
            ]);
        }
    }
}
