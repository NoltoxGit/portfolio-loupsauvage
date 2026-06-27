<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

try {
    migrate();
    require_admin();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
    }

    if (empty($_FILES['image']) || !is_array($_FILES['image'])) {
        json_response(['ok' => false, 'error' => 'NO_FILE'], 400);
    }

    $file = $_FILES['image'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        json_response(['ok' => false, 'error' => 'UPLOAD_FAILED'], 400);
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > UPLOAD_MAX_BYTES) {
        json_response(['ok' => false, 'error' => 'IMAGE_TOO_LARGE'], 400);
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    if (!is_uploaded_file($tmpName)) {
        json_response(['ok' => false, 'error' => 'UPLOAD_FAILED'], 400);
    }

    $mime = '';
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = (string) $finfo->file($tmpName);
    }
    if ($mime === '') {
        $mime = (string) ($file['type'] ?? '');
    }

    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'image/avif' => 'avif',
    ];

    if (!isset($extensions[$mime])) {
        json_response(['ok' => false, 'error' => 'IMAGE_TYPE'], 400);
    }

    $uploadRoot = dirname(__DIR__) . DIRECTORY_SEPARATOR . UPLOAD_PUBLIC_DIR;
    if (!is_dir($uploadRoot) && !mkdir($uploadRoot, 0755, true)) {
        json_response(['ok' => false, 'error' => 'UPLOAD_DIR_FAILED'], 500);
    }

    if (!is_writable($uploadRoot)) {
        json_response(['ok' => false, 'error' => 'UPLOAD_DIR_NOT_WRITABLE'], 500);
    }

    $guardFile = $uploadRoot . DIRECTORY_SEPARATOR . '.htaccess';
    if (!is_file($guardFile)) {
        @file_put_contents(
            $guardFile,
            "Options -Indexes\n\n<FilesMatch \"\\.(php|phtml|phar|cgi|pl|asp|aspx|jsp|sh)$\">\n  Require all denied\n</FilesMatch>\n"
        );
    }

    $indexFile = $uploadRoot . DIRECTORY_SEPARATOR . 'index.html';
    if (!is_file($indexFile)) {
        @file_put_contents($indexFile, "<!doctype html>\n<meta charset=\"utf-8\">\n<title>Uploads</title>\n");
    }

    $subDir = date('Y') . DIRECTORY_SEPARATOR . date('m');
    $targetDir = $uploadRoot . DIRECTORY_SEPARATOR . $subDir;

    if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
        json_response(['ok' => false, 'error' => 'UPLOAD_DIR_FAILED'], 500);
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
    $targetPath = $targetDir . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($tmpName, $targetPath)) {
        json_response(['ok' => false, 'error' => 'MOVE_FAILED'], 500);
    }

    @chmod($targetPath, 0644);

    $publicPath = UPLOAD_PUBLIC_DIR . '/' . str_replace(DIRECTORY_SEPARATOR, '/', $subDir) . '/' . $filename;

    json_response([
        'ok' => true,
        'image' => $publicPath,
    ]);
} catch (Throwable $error) {
    json_response(['ok' => false, 'error' => 'SERVER_ERROR'], 500);
}
