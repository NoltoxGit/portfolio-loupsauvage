<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use LoupSauvage\Repositories\AdminContentRepository;
use LoupSauvage\Repositories\CreationBundleRepository;
use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Slugifier;
use PDOException;

final class CreationBundleService
{
    private const VISIBILITIES = ['public', 'unlisted'];

    public function __construct(
        private readonly CreationBundleRepository $bundles,
        private readonly AdminContentRepository $contents,
    ) {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(): array
    {
        return $this->bundles->listAll();
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function create(array $payload, ?int $ownerId = null): array
    {
        $fields = [];
        $name = $this->requiredString($payload, 'name', null, 190, $fields);
        $visibility = $this->visibility($payload, null, $fields);
        $slug = $this->uniqueSlug(Slugifier::slugify($name));

        if ($fields !== []) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid bundle payload.', 422, $fields);
        }

        try {
            $id = $this->bundles->create($name, $slug, $visibility, $ownerId);
        } catch (PDOException $error) {
            $this->throwDuplicateSlugIfNeeded($error);
            throw $error;
        }

        return $this->find($id);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function update(int $id, array $payload, ?int $ownerId = null): array
    {
        $existing = $this->bundles->findById($id);

        if ($existing === null) {
            throw new ApiException('NOT_FOUND', 'Bundle not found.', 404);
        }

        $fields = [];
        $name = $this->requiredString($payload, 'name', $existing['name'] ?? null, 190, $fields);
        $visibility = $this->visibility($payload, (string) ($existing['visibility'] ?? 'public'), $fields);
        $slug = $this->uniqueSlug(Slugifier::slugify($name), $id);

        if ($fields !== []) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid bundle payload.', 422, $fields);
        }

        try {
            $this->bundles->update($id, $name, $slug, $visibility, $ownerId);
        } catch (PDOException $error) {
            $this->throwDuplicateSlugIfNeeded($error);
            throw $error;
        }

        return $this->find($id);
    }

    /**
     * @return array<string, mixed>
     */
    public function find(int $id): array
    {
        $bundle = $this->bundles->findById($id);

        if ($bundle === null) {
            throw new ApiException('NOT_FOUND', 'Bundle not found.', 404);
        }

        return $bundle;
    }

    /**
     * @return array<string, bool>
     */
    public function delete(int $id): array
    {
        if (!$this->bundles->delete($id)) {
            throw new ApiException('NOT_FOUND', 'Bundle not found.', 404);
        }

        return ['deleted' => true];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function syncContentBundles(int $contentItemId, array $payload): array
    {
        $content = $this->contents->findById($contentItemId);

        if ($content === null || ($content['type'] ?? null) !== 'creation') {
            throw new ApiException('NOT_FOUND', 'Creation not found.', 404);
        }

        $bundleIds = $this->bundleIds($payload['bundleIds'] ?? []);

        foreach ($bundleIds as $bundleId) {
            if ($this->bundles->findById($bundleId) === null) {
                throw new ApiException('VALIDATION_ERROR', 'Invalid bundle ids.', 422, [
                    'bundleIds' => 'Un ou plusieurs bundles sont invalides.',
                ]);
            }
        }

        $this->bundles->syncContentBundles($contentItemId, $bundleIds);

        return [
            'contentItemId' => $contentItemId,
            'bundles' => $this->bundles->listForContent($contentItemId),
        ];
    }

    /**
     * @param mixed $value
     * @return array<int, int>
     */
    public function bundleIds(mixed $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        $values = is_array($value) ? $value : [$value];
        $ids = [];

        foreach ($values as $item) {
            if (is_array($item)) {
                foreach ($item as $nested) {
                    if (is_numeric($nested) && (int) $nested > 0) {
                        $ids[] = (int) $nested;
                    }
                }
                continue;
            }

            if (is_numeric($item) && (int) $item > 0) {
                $ids[] = (int) $item;
            }
        }

        return array_values(array_unique($ids));
    }

    /**
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
     * @param array<string, string> $fields
     */
    private function visibility(array $payload, ?string $fallback, array &$fields): string
    {
        $value = array_key_exists('visibility', $payload) ? $payload['visibility'] : ($fallback ?? 'public');

        if (!is_scalar($value)) {
            $fields['visibility'] = 'Visibility is invalid.';
            return 'public';
        }

        $visibility = trim((string) $value);

        if (!in_array($visibility, self::VISIBILITIES, true)) {
            $fields['visibility'] = 'Visibility must be public or unlisted.';
            return 'public';
        }

        return $visibility;
    }

    private function uniqueSlug(string $slug, ?int $exceptId = null): string
    {
        $baseSlug = $slug === '' ? 'bundle' : $slug;
        $candidate = $baseSlug;
        $suffix = 2;

        while ($this->bundles->slugExists($candidate, $exceptId)) {
            $candidate = $baseSlug . '-' . $suffix;
            ++$suffix;
        }

        return $candidate;
    }

    private function throwDuplicateSlugIfNeeded(PDOException $error): void
    {
        $message = strtolower((string) ($error->errorInfo[2] ?? $error->getMessage()));

        if ($error->getCode() === '23000' && str_contains($message, 'slug')) {
            throw new ApiException('DUPLICATE_SLUG', 'Bundle slug is already used.', 409, [
                'name' => 'Un bundle avec un nom trop proche existe déjà.',
            ]);
        }
    }
}
