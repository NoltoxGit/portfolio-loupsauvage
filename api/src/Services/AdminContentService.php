<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use DateTimeImmutable;
use LoupSauvage\Repositories\AdminContentRepository;
use LoupSauvage\Support\ApiException;
use PDOException;

final class AdminContentService
{
    private const TYPES = ['creation', 'marketplace'];
    private const STATUSES = ['draft', 'published', 'archived'];
    private const SOURCE_CONTEXTS = ['personal', 'private_commission', 'marketplace_product', 'other'];
    private const EXTERNAL_PLATFORMS = ['builtbybit', 'mcmodels', 'sketchfab', 'other'];

    public function __construct(private readonly AdminContentRepository $contents)
    {
    }

    /**
     * @param array<string, mixed> $query
     * @return array<int, array<string, mixed>>
     */
    public function list(array $query): array
    {
        $filters = [];
        $fields = [];

        if (isset($query['type']) && $query['type'] !== '') {
            $type = (string) $query['type'];

            if (!in_array($type, self::TYPES, true)) {
                $fields['type'] = 'Type must be creation or marketplace.';
            } else {
                $filters['type'] = $type;
            }
        }

        if (isset($query['status']) && $query['status'] !== '') {
            $status = (string) $query['status'];

            if (!in_array($status, self::STATUSES, true)) {
                $fields['status'] = 'Status must be draft, published, or archived.';
            } else {
                $filters['status'] = $status;
            }
        }

        if ($fields !== []) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid content filters.', 422, $fields);
        }

        return $this->contents->list($filters);
    }

    /**
     * @return array<string, mixed>
     */
    public function find(int $id): array
    {
        $content = $this->contents->findById($id);

        if ($content === null) {
            throw new ApiException('NOT_FOUND', 'Content item not found.', 404);
        }

        return $content;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function create(array $payload): array
    {
        $data = $this->validatePayload($payload, null);

        try {
            return $this->contents->create($data);
        } catch (PDOException $error) {
            $this->throwDuplicateSlugIfNeeded($error);
            throw $error;
        }
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function update(int $id, array $payload): array
    {
        $existing = $this->contents->findById($id);

        if ($existing === null) {
            throw new ApiException('NOT_FOUND', 'Content item not found.', 404);
        }

        $data = $this->validatePayload($payload, $existing);

        try {
            $updated = $this->contents->update($id, $data);
        } catch (PDOException $error) {
            $this->throwDuplicateSlugIfNeeded($error);
            throw $error;
        }

        if ($updated === null) {
            throw new ApiException('NOT_FOUND', 'Content item not found.', 404);
        }

        return $updated;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function updateStatus(int $id, array $payload): array
    {
        $status = isset($payload['status']) ? trim((string) $payload['status']) : '';

        if (!in_array($status, self::STATUSES, true)) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid content status.', 422, [
                'status' => 'Status must be draft, published, or archived.',
            ]);
        }

        $existing = $this->contents->findById($id);

        if ($existing === null) {
            throw new ApiException('NOT_FOUND', 'Content item not found.', 404);
        }

        if ($this->violatesPrivateCommissionRule($existing, $status)) {
            throw new ApiException('VALIDATION_ERROR', 'Private commission cannot be published without client permission.', 422, [
                'clientPermission' => 'Client permission is required before publishing this creation.',
            ]);
        }

        $updated = $this->contents->updateStatus($id, $status);

        if ($updated === null) {
            throw new ApiException('NOT_FOUND', 'Content item not found.', 404);
        }

        return $updated;
    }

    /**
     * @return array<string, mixed>
     */
    public function archive(int $id): array
    {
        $existing = $this->contents->findById($id);

        if ($existing === null) {
            throw new ApiException('NOT_FOUND', 'Content item not found.', 404);
        }

        $archived = $this->contents->archive($id);

        if ($archived === null) {
            throw new ApiException('NOT_FOUND', 'Content item not found.', 404);
        }

        return $archived;
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, mixed>|null $existing
     * @return array<string, mixed>
     */
    private function validatePayload(array $payload, ?array $existing): array
    {
        $fields = [];

        $type = $this->requiredString($payload, 'type', $existing['type'] ?? null, 190, $fields);
        $status = $this->stringValue($payload, 'status', $existing['status'] ?? 'draft', 20, $fields);
        $defaultSourceContext = $existing['sourceContext'] ?? ($type === 'marketplace' ? 'marketplace_product' : 'personal');
        $sourceContext = $this->stringValue($payload, 'sourceContext', $defaultSourceContext, 40, $fields);
        $externalPlatform = $this->nullableString($payload, 'externalPlatform', $existing['externalPlatform'] ?? null, 40, $fields);

        if (!in_array($type, self::TYPES, true)) {
            $fields['type'] = 'Type must be creation or marketplace.';
        }

        if (!in_array($status, self::STATUSES, true)) {
            $fields['status'] = 'Status must be draft, published, or archived.';
        }

        if (!in_array($sourceContext, self::SOURCE_CONTEXTS, true)) {
            $fields['sourceContext'] = 'Source context is invalid.';
        }

        if ($externalPlatform !== null && !in_array($externalPlatform, self::EXTERNAL_PLATFORMS, true)) {
            $fields['externalPlatform'] = 'External platform is invalid.';
        }

        $data = [
            'type' => $type,
            'title' => $this->requiredString($payload, 'title', $existing['title'] ?? null, 190, $fields),
            'slug' => $this->requiredSlug($payload, 'slug', $existing['slug'] ?? null, 220, $fields),
            'short_description' => $this->nullableString($payload, 'shortDescription', $existing['shortDescription'] ?? null, 65535, $fields),
            'description' => $this->nullableString($payload, 'description', $existing['description'] ?? null, 16777215, $fields),
            'status' => $status,
            'source_context' => $sourceContext,
            'client_permission' => $this->boolValue($payload, 'clientPermission', (bool) ($existing['clientPermission'] ?? false), $fields),
            'sketchfab_url' => $this->nullableString($payload, 'sketchfabUrl', $existing['sketchfabUrl'] ?? null, 500, $fields),
            'external_url' => $this->nullableString($payload, 'externalUrl', $existing['externalUrl'] ?? null, 500, $fields),
            'external_platform' => $externalPlatform,
            'price_label' => $this->nullableString($payload, 'priceLabel', $existing['priceLabel'] ?? null, 120, $fields),
            'sort_order' => $this->intValue($payload, 'sortOrder', (int) ($existing['sortOrder'] ?? 0), $fields),
            'published_at' => $this->nullableDateTime($payload, 'publishedAt', $existing['publishedAt'] ?? null, $fields),
        ];

        if ($this->violatesPrivateCommissionRule([
            'type' => $data['type'],
            'sourceContext' => $data['source_context'],
            'clientPermission' => $data['client_permission'],
        ], $data['status'])) {
            $fields['clientPermission'] = 'Client permission is required before publishing this creation.';
        }

        if ($fields !== []) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid content payload.', 422, $fields);
        }

        return $data;
    }

    /**
     * @param array<string, mixed> $content
     */
    private function violatesPrivateCommissionRule(array $content, string $targetStatus): bool
    {
        return $targetStatus === 'published'
            && ($content['type'] ?? null) === 'creation'
            && ($content['sourceContext'] ?? null) === 'private_commission'
            && (bool) ($content['clientPermission'] ?? false) === false;
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
    private function stringValue(array $payload, string $key, mixed $fallback, int $maxLength, array &$fields): string
    {
        $value = array_key_exists($key, $payload) ? $payload[$key] : $fallback;

        if (!is_scalar($value)) {
            $fields[$key] = 'This field is invalid.';
            return '';
        }

        $value = trim((string) $value);

        if (strlen($value) > $maxLength) {
            $fields[$key] = 'This field is too long.';
        }

        return $value;
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

    /**
     * @param array<string, mixed> $payload
     * @param array<string, string> $fields
     */
    private function nullableDateTime(array $payload, string $key, mixed $fallback, array &$fields): ?string
    {
        $value = array_key_exists($key, $payload) ? $payload[$key] : $fallback;

        if ($value === null || $value === '') {
            return null;
        }

        if (!is_scalar($value)) {
            $fields[$key] = 'This field is invalid.';
            return null;
        }

        try {
            return (new DateTimeImmutable((string) $value))->format('Y-m-d H:i:s');
        } catch (\Throwable) {
            $fields[$key] = 'This field must be a valid date time.';
            return null;
        }
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
