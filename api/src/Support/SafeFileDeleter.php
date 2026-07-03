<?php

declare(strict_types=1);

namespace LoupSauvage\Support;

final class SafeFileDeleter
{
    public static function deletePublicUpload(string $publicPath, string $uploadsRoot, string $publicUploadsPath = '/uploads'): bool
    {
        $publicPath = trim($publicPath);

        if ($publicPath === '' || str_contains($publicPath, "\0")) {
            return false;
        }

        $publicUploadsPath = '/' . trim(str_replace('\\', '/', $publicUploadsPath), '/');

        if ($publicUploadsPath === '/') {
            $publicUploadsPath = '/uploads';
        }

        $prefix = $publicUploadsPath . '/';

        if (!str_starts_with($publicPath, $prefix)) {
            return false;
        }

        return self::deleteRelativeFile($uploadsRoot, substr($publicPath, strlen($prefix)));
    }

    private static function deleteRelativeFile(string $baseDirectory, string $relativePath): bool
    {
        $baseDirectory = rtrim($baseDirectory, '/\\');
        $relativePath = trim($relativePath);

        if (
            $baseDirectory === ''
            || $relativePath === ''
            || str_contains($baseDirectory, "\0")
            || str_contains($relativePath, "\0")
            || self::isAbsolutePath($relativePath)
            || is_link($baseDirectory)
            || !is_dir($baseDirectory)
        ) {
            return false;
        }

        $segments = preg_split('/[\/\\\\]+/', $relativePath, -1, PREG_SPLIT_NO_EMPTY);

        if ($segments === false || $segments === []) {
            return false;
        }

        foreach ($segments as $segment) {
            if ($segment === '.' || $segment === '..') {
                return false;
            }
        }

        $realBaseDirectory = realpath($baseDirectory);

        if ($realBaseDirectory === false) {
            return false;
        }

        $candidate = $baseDirectory . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $segments);
        $partial = $baseDirectory;

        foreach ($segments as $segment) {
            $partial .= DIRECTORY_SEPARATOR . $segment;

            if (is_link($partial)) {
                return false;
            }
        }

        if (!is_file($candidate)) {
            return false;
        }

        $realCandidate = realpath($candidate);
        $realBaseDirectory = rtrim($realBaseDirectory, DIRECTORY_SEPARATOR);

        if (
            $realCandidate === false
            || !str_starts_with($realCandidate, $realBaseDirectory . DIRECTORY_SEPARATOR)
            || !is_file($realCandidate)
        ) {
            return false;
        }

        // Safe deletion invariant: the request is non-empty, relative, traversal-free, contains no
        // null bytes, every path component under uploadsRoot rejects symlinks, and realpath()
        // confirms the final file remains inside the configured uploads directory.
        return unlink($realCandidate); // nosemgrep: php.lang.security.unlink-use.unlink-use
    }

    private static function isAbsolutePath(string $path): bool
    {
        return str_starts_with($path, '/')
            || str_starts_with($path, '\\')
            || preg_match('/^[A-Za-z]:[\/\\\\]/', $path) === 1;
    }
}
