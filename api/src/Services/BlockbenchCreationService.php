<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use DateTimeImmutable;
use LoupSauvage\Repositories\AdminContentRepository;
use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Config;
use LoupSauvage\Support\Slugifier;
use Throwable;

final class BlockbenchCreationService
{
    private const SOURCE_CONTEXTS = ['personal', 'private_commission', 'marketplace_product', 'other'];

    public function __construct(
        private readonly AdminContentService $contents,
        private readonly AdminContentRepository $contentRepository,
        private readonly AdminModelService $models,
        private readonly Config $config,
        private readonly ?CreationBundleService $bundles = null,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, mixed> $files
     * @return array<string, mixed>
     */
    public function createDraftFromUpload(array $payload, array $files): array
    {
        $this->models->assertValidGlbUpload($files);

        $title = $this->requiredString($payload, 'title', 190);
        $shortDescription = $this->requiredString($payload, 'shortDescription', 65535);
        $sourceContext = $this->sourceContext($payload);
        $sourceLabel = $this->nullableString($payload, 'sourceLabel', 120);
        $yawDegrees = $this->yawDegrees($payload);
        $slug = $this->uniqueSlug(Slugifier::slugify($title));
        $id = 0;

        try {
            $content = $this->contents->create([
                'type' => 'creation',
                'title' => $title,
                'slug' => $slug,
                'shortDescription' => $shortDescription,
                'status' => 'draft',
                'sourceContext' => $sourceContext,
                'sourceLabel' => $sourceLabel,
                'clientPermission' => false,
                'sketchfabUrl' => null,
                'externalUrl' => null,
                'externalPlatform' => null,
                'platformLabel' => null,
                'priceLabel' => null,
                'builtbybitResourceId' => null,
                'builtbybitSyncJson' => null,
                'publishedAt' => null,
                'displayDate' => (new DateTimeImmutable())->format('Y-m-d'),
            ]);

            $id = (int) ($content['id'] ?? 0);

            if ($id <= 0) {
                throw new ApiException('SERVER_ERROR', 'Unable to create Blockbench draft.', 500);
            }

            $this->models->upload(['contentItemId' => $id], $files);
            $this->models->updateSettings([
                'contentItemId' => $id,
                'modelViewerYawDegrees' => $yawDegrees,
            ]);

            if ($this->bundles !== null) {
                $this->bundles->syncContentBundles($id, [
                    'bundleIds' => $this->bundles->bundleIds($payload['bundleIds'] ?? []),
                ]);
            }
        } catch (Throwable $error) {
            $this->cleanupFailedDraft($id);
            throw $error;
        }

        $created = $this->contents->find($id);

        return [
            'id' => $id,
            'title' => $created['title'] ?? $title,
            'slug' => $created['slug'] ?? $slug,
            'status' => $created['status'] ?? 'draft',
            'adminEditUrl' => $this->absoluteUrl('/admin/creations/' . $id),
            'adminPreviewUrl' => $this->absoluteUrl('/admin/creations/' . $id . '/preview'),
            'publicUrl' => $this->absoluteUrl('/creations/' . rawurlencode((string) ($created['slug'] ?? $slug))),
        ];
    }

    private function sourceContext(array $payload): string
    {
        $value = $this->requiredString($payload, 'sourceContext', 40);

        if (!in_array($value, self::SOURCE_CONTEXTS, true) || $value === 'marketplace_product') {
            throw new ApiException('VALIDATION_ERROR', 'Invalid source context.', 422, [
                'sourceContext' => 'Le contexte doit concerner une création, pas une ressource marketplace.',
            ]);
        }

        return $value;
    }

    private function uniqueSlug(string $slug): string
    {
        $baseSlug = $slug === '' ? 'creation-blockbench' : $slug;
        $candidate = $baseSlug;
        $suffix = 2;

        while ($this->contentRepository->slugExists($candidate)) {
            $candidate = $baseSlug . '-' . $suffix;
            ++$suffix;
        }

        return $candidate;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function requiredString(array $payload, string $key, int $maxLength): string
    {
        $value = isset($payload[$key]) && is_scalar($payload[$key]) ? trim((string) $payload[$key]) : '';

        if ($value === '') {
            throw new ApiException('VALIDATION_ERROR', 'Missing required Blockbench field.', 422, [
                $key => 'Ce champ est requis.',
            ]);
        }

        if (strlen($value) > $maxLength) {
            throw new ApiException('VALIDATION_ERROR', 'Blockbench field is too long.', 422, [
                $key => 'Ce champ est trop long.',
            ]);
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function nullableString(array $payload, string $key, int $maxLength): ?string
    {
        $value = isset($payload[$key]) && is_scalar($payload[$key]) ? trim((string) $payload[$key]) : '';

        if ($value === '') {
            return null;
        }

        if (strlen($value) > $maxLength) {
            throw new ApiException('VALIDATION_ERROR', 'Blockbench field is too long.', 422, [
                $key => 'Ce champ est trop long.',
            ]);
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function yawDegrees(array $payload): int
    {
        $value = $payload['modelViewerYawDegrees'] ?? 180;

        if (!is_scalar($value) || preg_match('/^-?\d+$/', trim((string) $value)) !== 1) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid model orientation.', 422, [
                'modelViewerYawDegrees' => 'Une orientation en degrés est requise.',
            ]);
        }

        $degrees = (int) $value;
        $normalized = $degrees % 360;

        return $normalized < 0 ? $normalized + 360 : $normalized;
    }

    private function absoluteUrl(string $path): string
    {
        $baseUrl = rtrim($this->config->string('app.url', ''), '/');

        return $baseUrl === '' ? $path : $baseUrl . $path;
    }

    private function cleanupFailedDraft(int $id): void
    {
        if ($id <= 0) {
            return;
        }

        try {
            $this->models->delete(['contentId' => $id]);
        } catch (Throwable) {
        }

        try {
            $this->contentRepository->deleteById($id);
        } catch (Throwable) {
        }
    }
}
