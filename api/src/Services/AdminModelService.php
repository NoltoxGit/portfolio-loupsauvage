<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use LoupSauvage\Repositories\AdminModelRepository;
use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Config;
use LoupSauvage\Support\SafeFileDeleter;
use Throwable;

final class AdminModelService
{
    private const PREVIEW_MIME_EXTENSIONS = [
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function __construct(
        private readonly AdminModelRepository $models,
        private readonly Config $config,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, mixed> $files
     * @return array<string, mixed>
     */
    public function upload(array $payload, array $files): array
    {
        $contentItemId = $this->positiveInt($payload, 'contentItemId');
        $existing = $this->findExisting($contentItemId);
        $file = $this->uploadedGlbFile($files);
        $filename = bin2hex(random_bytes(16)) . '.glb';
        $relativeDirectory = 'models/content-' . $contentItemId;
        $targetDirectory = $this->uploadsRoot() . DIRECTORY_SEPARATOR . $relativeDirectory;
        $this->ensureWritableDirectory($targetDirectory);

        $targetPath = $targetDirectory . DIRECTORY_SEPARATOR . $filename;
        $publicPath = $this->publicUploadsPath() . '/' . $relativeDirectory . '/' . $filename;

        if (!move_uploaded_file((string) $file['tmp_name'], $targetPath)) {
            throw new ApiException('UPLOAD_ERROR', 'Unable to store uploaded GLB model.', 422, [
                'file' => 'Le modèle GLB n’a pas pu être enregistré.',
            ]);
        }

        try {
            $updated = $this->models->saveModel($contentItemId, $publicPath);
        } catch (Throwable $error) {
            $this->deletePhysicalFile($publicPath);
            throw $error;
        }

        $this->deletePhysicalFile((string) ($existing['modelGlbPath'] ?? ''));
        $this->deletePhysicalFile((string) ($existing['modelPreviewImagePath'] ?? ''));

        return $updated ?? $this->findExisting($contentItemId);
    }

    /**
     * @param array<string, mixed> $files
     */
    public function assertValidGlbUpload(array $files): void
    {
        $this->uploadedGlbFile($files);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function savePreview(array $payload): array
    {
        $contentItemId = $this->positiveInt($payload, 'contentItemId');
        $existing = $this->findExisting($contentItemId);

        if (($existing['modelGlbPath'] ?? null) === null) {
            throw new ApiException('VALIDATION_ERROR', 'A GLB model is required before saving a preview.', 422, [
                'contentItemId' => 'Ajoutez d’abord un modèle GLB.',
            ]);
        }

        $image = $this->previewImage($payload);
        $filename = 'preview-' . bin2hex(random_bytes(16)) . '.' . $image['extension'];
        $relativeDirectory = 'models/content-' . $contentItemId;
        $targetDirectory = $this->uploadsRoot() . DIRECTORY_SEPARATOR . $relativeDirectory;
        $this->ensureWritableDirectory($targetDirectory);

        $targetPath = $targetDirectory . DIRECTORY_SEPARATOR . $filename;
        $publicPath = $this->publicUploadsPath() . '/' . $relativeDirectory . '/' . $filename;

        if (file_put_contents($targetPath, $image['bytes']) === false) {
            throw new ApiException('UPLOAD_ERROR', 'Unable to store GLB preview image.', 422, [
                'imageData' => 'La preview du modèle n’a pas pu être enregistrée.',
            ]);
        }

        try {
            $updated = $this->models->savePreview($contentItemId, $publicPath);
        } catch (Throwable $error) {
            $this->deletePhysicalFile($publicPath);
            throw $error;
        }

        $this->deletePhysicalFile((string) ($existing['modelPreviewImagePath'] ?? ''));

        return $updated ?? $this->findExisting($contentItemId);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function updateSettings(array $payload): array
    {
        $contentItemId = $this->positiveInt($payload, 'contentItemId');
        $existing = $this->findExisting($contentItemId);
        $yawDegrees = $this->yawDegrees($payload);
        $updated = $this->models->saveViewerSettings($contentItemId, $yawDegrees);

        if ($updated !== null) {
            $this->deletePhysicalFile((string) ($existing['modelPreviewImagePath'] ?? ''));
        }

        return $updated ?? $this->findExisting($contentItemId);
    }

    /**
     * @param array<string, mixed> $query
     * @return array<string, mixed>
     */
    public function delete(array $query): array
    {
        $contentItemId = $this->positiveInt($query, 'contentId');
        $existing = $this->findExisting($contentItemId);
        $updated = $this->models->clearModel($contentItemId);

        return [
            'contentItemId' => $contentItemId,
            'deleted' => true,
            'fileDeleted' => $this->deletePhysicalFile((string) ($existing['modelGlbPath'] ?? '')),
            'previewDeleted' => $this->deletePhysicalFile((string) ($existing['modelPreviewImagePath'] ?? '')),
            'item' => $updated ?? $this->findExisting($contentItemId),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function findExisting(int $contentItemId): array
    {
        $existing = $this->models->findByContentId($contentItemId);

        if ($existing === null) {
            throw new ApiException('NOT_FOUND', 'Content item not found.', 404);
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
                $key => 'Un entier positif est requis.',
            ]);
        }

        return (int) $value;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function yawDegrees(array $payload): int
    {
        $value = $payload['modelViewerYawDegrees'] ?? null;

        if (!is_scalar($value) || preg_match('/^-?\d+$/', trim((string) $value)) !== 1) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid model viewer orientation.', 422, [
                'modelViewerYawDegrees' => 'Une orientation en degrés est requise.',
            ]);
        }

        $degrees = (int) $value;
        $normalized = $degrees % 360;

        return $normalized < 0 ? $normalized + 360 : $normalized;
    }

    /**
     * @param array<string, mixed> $files
     * @return array<string, mixed>
     */
    private function uploadedGlbFile(array $files): array
    {
        if (!isset($files['file']) || !is_array($files['file'])) {
            throw new ApiException('VALIDATION_ERROR', 'GLB file is required.', 422, [
                'file' => 'Ajoutez un fichier .glb.',
            ]);
        }

        $file = $files['file'];

        if (isset($file['error']) && is_array($file['error'])) {
            throw new ApiException('VALIDATION_ERROR', 'Multiple GLB uploads are not supported.', 422, [
                'file' => 'Un seul modèle GLB peut être envoyé.',
            ]);
        }

        $error = isset($file['error']) && is_numeric($file['error']) ? (int) $file['error'] : UPLOAD_ERR_NO_FILE;

        if ($error === UPLOAD_ERR_NO_FILE) {
            throw new ApiException('VALIDATION_ERROR', 'GLB file is required.', 422, [
                'file' => 'Ajoutez un fichier .glb.',
            ]);
        }

        if ($error !== UPLOAD_ERR_OK) {
            throw new ApiException('UPLOAD_ERROR', 'GLB upload failed.', 422, [
                'file' => 'L’envoi du modèle a échoué avec le code ' . $error . '.',
            ]);
        }

        $tmpName = isset($file['tmp_name']) && is_scalar($file['tmp_name']) ? (string) $file['tmp_name'] : '';
        $name = isset($file['name']) && is_scalar($file['name']) ? strtolower((string) $file['name']) : '';
        $size = isset($file['size']) && is_numeric($file['size']) ? (int) $file['size'] : -1;

        if ($tmpName === '' || $size <= 0 || !is_uploaded_file($tmpName)) {
            throw new ApiException('UPLOAD_ERROR', 'Invalid GLB upload.', 422, [
                'file' => 'Le fichier GLB envoyé est invalide.',
            ]);
        }

        if (!str_ends_with($name, '.glb')) {
            throw new ApiException('VALIDATION_ERROR', 'Only .glb models are supported.', 422, [
                'file' => 'Le format V1 accepte uniquement les fichiers .glb.',
            ]);
        }

        $maxSize = $this->config->int('uploads.model_max_size_bytes', 50 * 1024 * 1024);
        $actualSize = filesize($tmpName);

        if ($size > $maxSize || $actualSize === false || $actualSize > $maxSize) {
            throw new ApiException('UPLOAD_ERROR', 'GLB model is too large.', 422, [
                'file' => 'Le modèle dépasse la taille maximale configurée.',
            ]);
        }

        $signature = file_get_contents($tmpName, false, null, 0, 4);

        if ($signature !== 'glTF') {
            throw new ApiException('UPLOAD_ERROR', 'Invalid GLB binary signature.', 422, [
                'file' => 'Le fichier ne semble pas être un GLB valide.',
            ]);
        }

        return $file;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{extension: string, bytes: string}
     */
    private function previewImage(array $payload): array
    {
        $imageData = isset($payload['imageData']) && is_scalar($payload['imageData'])
            ? trim((string) $payload['imageData'])
            : '';

        if ($imageData === '') {
            throw new ApiException('VALIDATION_ERROR', 'Preview image is required.', 422, [
                'imageData' => 'La capture de preview est requise.',
            ]);
        }

        if (preg_match('/^data:(image\/(?:png|webp));base64,([A-Za-z0-9+\/=]+)$/', $imageData, $matches) !== 1) {
            throw new ApiException('VALIDATION_ERROR', 'Preview image format is invalid.', 422, [
                'imageData' => 'La preview doit être une image PNG ou WebP en base64.',
            ]);
        }

        $bytes = base64_decode($matches[2], true);

        if ($bytes === false || $bytes === '') {
            throw new ApiException('UPLOAD_ERROR', 'Preview image cannot be decoded.', 422, [
                'imageData' => 'La preview n’a pas pu être décodée.',
            ]);
        }

        $maxSize = $this->config->int('uploads.model_preview_max_size_bytes', 5 * 1024 * 1024);

        if (strlen($bytes) > $maxSize) {
            throw new ApiException('UPLOAD_ERROR', 'Preview image is too large.', 422, [
                'imageData' => 'La preview dépasse la taille maximale configurée.',
            ]);
        }

        return [
            'extension' => self::PREVIEW_MIME_EXTENSIONS[$matches[1]],
            'bytes' => $bytes,
        ];
    }

    private function ensureWritableDirectory(string $targetDirectory): void
    {
        if (!is_dir($targetDirectory) && !mkdir($targetDirectory, 0755, true) && !is_dir($targetDirectory)) {
            throw new ApiException('UPLOAD_ERROR', 'Unable to create model directory.', 422, [
                'file' => 'Le dossier du modèle ne peut pas être créé.',
            ]);
        }

        if (!is_writable($targetDirectory)) {
            throw new ApiException('UPLOAD_ERROR', 'Model directory is not writable.', 422, [
                'file' => 'Le dossier du modèle n’est pas accessible en écriture.',
            ]);
        }
    }

    private function uploadsRoot(): string
    {
        $root = rtrim($this->config->string('uploads.filesystem_path', __DIR__ . '/../../uploads'), '/\\');

        if ($root === '' || !is_dir($root)) {
            throw new ApiException('UPLOAD_ERROR', 'Upload directory is not available.', 422, [
                'file' => 'Le dossier uploads n’est pas disponible.',
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
        return SafeFileDeleter::deletePublicUpload(
            $publicPath,
            $this->config->string('uploads.filesystem_path', ''),
            $this->publicUploadsPath()
        );
    }
}

