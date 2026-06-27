<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use LoupSauvage\Repositories\AdminMediaRepository;
use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Config;
use Throwable;

final class AdminMediaService
{
    private const KINDS = ['cover', 'gallery', 'render', 'thumbnail'];

    private const MIME_EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    public function __construct(
        private readonly AdminMediaRepository $media,
        private readonly Config $config,
    ) {
    }

    /**
     * @param array<string, mixed> $query
     * @return array<int, array<string, mixed>>
     */
    public function list(array $query): array
    {
        $contentItemId = $this->positiveInt($query, 'contentId');
        $this->ensureContentExists($contentItemId);

        return $this->media->listByContentItemId($contentItemId);
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, mixed> $files
     * @return array<string, mixed>
     */
    public function upload(array $payload, array $files): array
    {
        $contentItemId = $this->positiveInt($payload, 'contentItemId');
        $this->ensureContentExists($contentItemId);

        $kind = $this->requiredKind($payload);
        $alt = $this->optionalString($payload, 'alt', null, 255);
        $sortOrder = $this->intValue($payload, 'sortOrder', 0);
        $file = $this->uploadedFile($files);

        $mime = $this->validatedMime((string) $file['tmp_name']);
        $extension = self::MIME_EXTENSIONS[$mime];
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $relativeDirectory = 'content-' . $contentItemId;
        $targetDirectory = $this->uploadsRoot() . DIRECTORY_SEPARATOR . $relativeDirectory;

        if (!is_dir($targetDirectory) && !mkdir($targetDirectory, 0755, true) && !is_dir($targetDirectory)) {
            throw new ApiException('UPLOAD_ERROR', 'Unable to create upload directory.', 422, [
                'file' => 'Upload directory cannot be created.',
            ]);
        }

        if (!is_writable($targetDirectory)) {
            throw new ApiException('UPLOAD_ERROR', 'Upload directory is not writable.', 422, [
                'file' => 'Upload directory is not writable.',
            ]);
        }

        $targetPath = $targetDirectory . DIRECTORY_SEPARATOR . $filename;
        $publicPath = $this->publicUploadsPath() . '/' . $relativeDirectory . '/' . $filename;

        if (!move_uploaded_file((string) $file['tmp_name'], $targetPath)) {
            throw new ApiException('UPLOAD_ERROR', 'Unable to store uploaded file.', 422, [
                'file' => 'Uploaded file could not be stored.',
            ]);
        }

        try {
            return $this->media->create($contentItemId, $kind, $publicPath, $alt, $sortOrder);
        } catch (Throwable $error) {
            $this->deletePhysicalFile($publicPath);
            throw $error;
        }
    }

    /**
     * @param array<string, mixed> $query
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function update(array $query, array $payload): array
    {
        $id = $this->positiveInt($query, 'id');
        $existing = $this->findExisting($id);

        $updated = $this->media->update(
            $id,
            $this->requiredKind($payload),
            $this->optionalString($payload, 'alt', $existing['alt'], 255),
            $this->intValue($payload, 'sortOrder', (int) $existing['sortOrder']),
        );

        if ($updated === null) {
            throw new ApiException('NOT_FOUND', 'Media not found.', 404);
        }

        return $updated;
    }

    /**
     * @param array<string, mixed> $query
     * @return array<string, mixed>
     */
    public function delete(array $query): array
    {
        $id = $this->positiveInt($query, 'id');
        $existing = $this->findExisting($id);

        $this->media->delete($id);

        return [
            'id' => $id,
            'deleted' => true,
            'fileDeleted' => $this->deletePhysicalFile((string) $existing['path']),
        ];
    }

    private function ensureContentExists(int $contentItemId): void
    {
        if (!$this->media->contentExists($contentItemId)) {
            throw new ApiException('NOT_FOUND', 'Content item not found.', 404);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function findExisting(int $id): array
    {
        $existing = $this->media->findById($id);

        if ($existing === null) {
            throw new ApiException('NOT_FOUND', 'Media not found.', 404);
        }

        return $existing;
    }

    /**
     * @param array<string, mixed> $source
     */
    private function positiveInt(array $source, string $key): int
    {
        $value = $source[$key] ?? null;

        if (!is_scalar($value) || preg_match('/^\d+$/', trim((string) $value)) !== 1 || (int) $value <= 0) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid numeric field.', 422, [
                $key => 'A valid positive integer is required.',
            ]);
        }

        return (int) $value;
    }

    /**
     * @param array<string, mixed> $source
     */
    private function intValue(array $source, string $key, int $default): int
    {
        if (!array_key_exists($key, $source) || $source[$key] === '') {
            return $default;
        }

        $value = $source[$key];

        if (!is_scalar($value) || preg_match('/^-?\d+$/', trim((string) $value)) !== 1) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid numeric field.', 422, [
                $key => 'A valid integer is required.',
            ]);
        }

        return (int) $value;
    }

    /**
     * @param array<string, mixed> $source
     */
    private function requiredKind(array $source): string
    {
        $kind = isset($source['kind']) && is_scalar($source['kind'])
            ? trim((string) $source['kind'])
            : '';

        if (!in_array($kind, self::KINDS, true)) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid media kind.', 422, [
                'kind' => 'Kind must be cover, gallery, render, or thumbnail.',
            ]);
        }

        return $kind;
    }

    /**
     * @param array<string, mixed> $source
     */
    private function optionalString(array $source, string $key, mixed $fallback, int $maxLength): ?string
    {
        $value = array_key_exists($key, $source) ? $source[$key] : $fallback;

        if ($value === null || $value === '') {
            return null;
        }

        if (!is_scalar($value)) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid text field.', 422, [
                $key => 'This field must be a string.',
            ]);
        }

        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        if (strlen($value) > $maxLength) {
            throw new ApiException('VALIDATION_ERROR', 'Text field is too long.', 422, [
                $key => 'This field is too long.',
            ]);
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $files
     * @return array<string, mixed>
     */
    private function uploadedFile(array $files): array
    {
        if (!isset($files['file']) || !is_array($files['file'])) {
            throw new ApiException('VALIDATION_ERROR', 'Uploaded file is required.', 422, [
                'file' => 'File is required.',
            ]);
        }

        $file = $files['file'];

        if (isset($file['error']) && is_array($file['error'])) {
            throw new ApiException('VALIDATION_ERROR', 'Multiple uploads are not supported.', 422, [
                'file' => 'Only one file can be uploaded.',
            ]);
        }

        $error = isset($file['error']) && is_numeric($file['error']) ? (int) $file['error'] : UPLOAD_ERR_NO_FILE;

        if ($error === UPLOAD_ERR_NO_FILE) {
            throw new ApiException('VALIDATION_ERROR', 'Uploaded file is required.', 422, [
                'file' => 'File is required.',
            ]);
        }

        if ($error !== UPLOAD_ERR_OK) {
            throw new ApiException('UPLOAD_ERROR', 'Upload failed.', 422, [
                'file' => 'Upload failed with error code ' . $error . '.',
            ]);
        }

        $tmpName = isset($file['tmp_name']) && is_scalar($file['tmp_name']) ? (string) $file['tmp_name'] : '';
        $size = isset($file['size']) && is_numeric($file['size']) ? (int) $file['size'] : -1;

        if ($tmpName === '' || $size <= 0 || !is_uploaded_file($tmpName)) {
            throw new ApiException('UPLOAD_ERROR', 'Invalid uploaded file.', 422, [
                'file' => 'Uploaded file is invalid.',
            ]);
        }

        $maxSize = $this->config->int('uploads.max_size_bytes', 10 * 1024 * 1024);
        $actualSize = filesize($tmpName);

        if ($size > $maxSize || $actualSize === false || $actualSize > $maxSize) {
            throw new ApiException('UPLOAD_ERROR', 'Uploaded file is too large.', 422, [
                'file' => 'Uploaded file exceeds the configured maximum size.',
            ]);
        }

        return $file;
    }

    private function validatedMime(string $tmpName): string
    {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);

        if ($finfo === false) {
            throw new ApiException('UPLOAD_ERROR', 'Unable to inspect uploaded file.', 422, [
                'file' => 'File type cannot be inspected.',
            ]);
        }

        $mime = finfo_file($finfo, $tmpName);

        $allowedMimeTypes = $this->allowedMimeTypes();

        if (!is_string($mime) || !array_key_exists($mime, self::MIME_EXTENSIONS) || !in_array($mime, $allowedMimeTypes, true)) {
            throw new ApiException('UPLOAD_ERROR', 'Uploaded file type is not allowed.', 422, [
                'file' => 'File type is not allowed.',
            ]);
        }

        return $mime;
    }

    /**
     * @return array<int, string>
     */
    private function allowedMimeTypes(): array
    {
        $configured = $this->config->get('uploads.allowed_mime_types', array_keys(self::MIME_EXTENSIONS));

        if (!is_array($configured)) {
            return array_keys(self::MIME_EXTENSIONS);
        }

        return array_values(array_filter($configured, static fn (mixed $mime): bool => is_string($mime)));
    }

    private function uploadsRoot(): string
    {
        $root = rtrim($this->config->string('uploads.filesystem_path', __DIR__ . '/../../uploads'), '/\\');

        if ($root === '' || !is_dir($root)) {
            throw new ApiException('UPLOAD_ERROR', 'Upload directory is not available.', 422, [
                'file' => 'Upload directory is not available.',
            ]);
        }

        return $root;
    }

    private function publicUploadsPath(): string
    {
        $path = rtrim($this->config->string('uploads.public_path', '/uploads'), '/');

        return $path === '' ? '/uploads' : $path;
    }

    private function deletePhysicalFile(string $publicPath): bool
    {
        if (!str_starts_with($publicPath, '/uploads/')) {
            return false;
        }

        $uploadsRoot = rtrim($this->config->string('uploads.filesystem_path', ''), '/\\');

        if ($uploadsRoot === '' || !is_dir($uploadsRoot)) {
            return false;
        }

        $realUploadsRoot = realpath($uploadsRoot);

        if ($realUploadsRoot === false) {
            return false;
        }

        $relativePath = ltrim(substr($publicPath, strlen('/uploads/')), '/\\');
        $candidate = $uploadsRoot . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relativePath);

        if (!is_file($candidate)) {
            return false;
        }

        $realCandidate = realpath($candidate);

        if ($realCandidate === false || !str_starts_with($realCandidate, $realUploadsRoot . DIRECTORY_SEPARATOR)) {
            return false;
        }

        return unlink($realCandidate);
    }
}
