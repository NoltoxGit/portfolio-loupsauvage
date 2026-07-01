<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use LoupSauvage\Support\ApiException;
use LoupSauvage\Support\Config;

final class BuiltByBitPreviewService
{
    public function __construct(private readonly Config $config)
    {
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function preview(array $payload): array
    {
        $resourceId = $this->resourceId($payload);
        $token = trim($this->config->string('builtbybit.api_token', ''));

        if ($token === '') {
            throw new ApiException('BUILTBYBIT_TOKEN_MISSING', 'BuiltByBit API token is not configured.', 422, [
                'apiToken' => 'Configure builtbybit.api_token on the server.',
            ]);
        }

        $resource = $this->requestResource($resourceId, $token);
        $description = $this->objectValue($resource, 'Description') ?: $this->objectValue($resource, 'description');

        $title = $this->firstString($resource, ['Title', 'title', 'Name', 'name']);
        $summary = $this->firstString($resource, ['TagLine', 'tagLine', 'Summary', 'summary', 'ShortDescription', 'shortDescription']);
        $descriptionBbcode = $this->firstString($description, ['bbcode', 'BBCode', 'raw', 'Raw']);
        $descriptionHtml = $this->firstString($description, ['html', 'Html', 'HTML']);
        $externalUrl = $this->resourceUrl($resourceId, $resource);
        $coverImageUrl = $this->coverImageUrl($resource);
        $carouselImageUrls = $this->carouselImageUrls($resource);

        if ($summary === '' && $descriptionBbcode !== '') {
            $summary = substr(trim((string) preg_replace('/\[[^\]]+\]/', '', $descriptionBbcode)), 0, 240);
        }

        if ($title === '') {
            throw new ApiException('BUILTBYBIT_RESPONSE_INCOMPLETE', 'BuiltByBit response is missing a resource title.', 502, [
                'title' => 'Resource title was not present in the BuiltByBit response.',
                'availableKeys' => implode(', ', array_slice(array_keys($resource), 0, 30)),
            ]);
        }

        return [
            'resourceId' => $resourceId,
            'title' => $title,
            'summary' => $summary,
            'descriptionBbcode' => $descriptionBbcode,
            'descriptionHtmlPreview' => $descriptionHtml,
            'externalUrl' => $externalUrl,
            'coverImageUrl' => $coverImageUrl,
            'carouselImageUrls' => $carouselImageUrls,
            'priceLabel' => $this->priceLabel($resource),
            'categoryLabel' => $this->categoryLabel($resource),
            'rawSyncJson' => [
                'resourceId' => $resourceId,
                'title' => $title,
                'summary' => $summary,
                'descriptionBbcode' => $descriptionBbcode,
                'externalUrl' => $externalUrl,
                'coverImageUrl' => $coverImageUrl,
                'carouselImageUrls' => $carouselImageUrls,
                'priceLabel' => $this->priceLabel($resource),
                'categoryLabel' => $this->categoryLabel($resource),
                'rawResource' => $resource,
            ],
        ];
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function resourceId(array $payload): string
    {
        $input = isset($payload['input']) && is_scalar($payload['input']) ? trim((string) $payload['input']) : '';

        if ($input === '') {
            throw new ApiException('VALIDATION_ERROR', 'BuiltByBit URL or resource id is required.', 422, [
                'input' => 'Enter a BuiltByBit resource URL or id.',
            ]);
        }

        if (preg_match('/^\d+$/', $input) === 1) {
            return $input;
        }

        $parts = parse_url($input);
        $host = is_array($parts) ? strtolower((string) ($parts['host'] ?? '')) : '';
        $path = is_array($parts) ? (string) ($parts['path'] ?? '') : '';

        if ($host === '' || ($host !== 'builtbybit.com' && !str_ends_with($host, '.builtbybit.com'))) {
            throw new ApiException('VALIDATION_ERROR', 'BuiltByBit URL is invalid.', 422, [
                'input' => 'Enter a valid builtbybit.com resource URL or numeric id.',
            ]);
        }

        if (preg_match('~/resources/(?:[^./]+\\.)?(\d+)~i', $path, $matches) === 1) {
            return $matches[1];
        }

        throw new ApiException('VALIDATION_ERROR', 'Unable to extract BuiltByBit resource id.', 422, [
            'input' => 'Enter a URL containing /resources/...123 or a numeric id.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function requestResource(string $resourceId, string $token): array
    {
        $baseUrl = rtrim($this->config->string('builtbybit.api_base_url', 'https://api.builtbybit.com'), '/');
        $url = $baseUrl . '/v2/resources/discover/resources?resource_ids=' . rawurlencode($resourceId) . '&with=Description,Creator';
        $response = $this->getJson($url, $token);

        if (isset($response['result']) && $response['result'] === 'error') {
            throw new ApiException('BUILTBYBIT_ERROR', $this->firstString($response, ['message', 'error']) ?: 'BuiltByBit returned an error.', 502);
        }

        $resource = $this->findResource($response, $resourceId);

        if ($resource === null) {
            throw new ApiException('BUILTBYBIT_NOT_FOUND', 'BuiltByBit resource was not found.', 404, [
                'input' => 'No resource was returned for this id.',
            ]);
        }

        return $resource;
    }

    /**
     * @return array<string, mixed>
     */
    private function getJson(string $url, string $token): array
    {
        $headers = [
            'Accept: application/json',
            'Authorization: Token ' . $token,
            'User-Agent: LoupSauvagePortfolio/1.0',
        ];

        $status = 0;
        $responseHeaders = [];
        $body = false;
        $curlErrno = 0;
        $curlError = '';

        if (function_exists('curl_init')) {
            $curl = curl_init($url);

            if ($curl === false) {
                throw new ApiException('BUILTBYBIT_REQUEST_FAILED', 'Unable to initialize BuiltByBit request.', 502);
            }

            curl_setopt_array($curl, [
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HEADERFUNCTION => static function ($curl, string $header) use (&$responseHeaders): int {
                    $responseHeaders[] = trim($header);
                    return strlen($header);
                },
                CURLOPT_TIMEOUT => 12,
            ]);

            $body = curl_exec($curl);
            $curlErrno = curl_errno($curl);
            $curlError = curl_error($curl);
            $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
            unset($curl);
        } else {
            if (!in_array('https', stream_get_wrappers(), true)) {
                throw new ApiException(
                    'BUILTBYBIT_HTTPS_UNAVAILABLE',
                    'PHP cannot perform HTTPS requests. Enable the curl or openssl extension.',
                    502
                );
            }

            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => implode("\r\n", $headers),
                    'ignore_errors' => true,
                    'timeout' => 12,
                ],
            ]);
            $body = @file_get_contents($url, false, $context);
            $responseHeaders = $http_response_header ?? [];
            $status = $this->statusFromHeaders($responseHeaders);
        }

        if ($body === false || $curlErrno > 0) {
            throw new ApiException('BUILTBYBIT_CURL_FAILED', 'BuiltByBit request failed before a response was received.', 502, [
                'curlErrno' => (string) $curlErrno,
                'curlError' => $curlError,
                'status' => (string) $status,
            ]);
        }

        $bodyText = (string) $body;

        if ($status < 200 || $status >= 300) {
            $decodedError = json_decode($bodyText, true);
            $errorDetails = is_array($decodedError) ? $this->builtByBitErrorDetails($decodedError) : [
                'code' => '',
                'message' => '',
            ];
            $fields = [
                'status' => (string) $status,
                'builtByBitCode' => $errorDetails['code'],
                'builtByBitMessage' => $errorDetails['message'],
            ];
            $retryAfter = $this->headerValue($responseHeaders, 'Retry-After');

            if ($retryAfter !== '') {
                $fields['retryAfter'] = $retryAfter;
            }

            throw new ApiException(
                $this->errorCodeForStatus($status),
                $this->errorMessageForStatus($status, $errorDetails['message']),
                $this->internalStatusForBuiltByBitStatus($status),
                $fields
            );
        }

        $decoded = json_decode($bodyText, true);

        if (!is_array($decoded)) {
            throw new ApiException('BUILTBYBIT_INVALID_RESPONSE', 'BuiltByBit returned invalid JSON.', 502, [
                'status' => (string) $status,
                'bodyExcerpt' => $this->bodyExcerpt($bodyText),
            ]);
        }

        return $decoded;
    }

    /**
     * @param array<int, string> $headers
     */
    private function statusFromHeaders(array $headers): int
    {
        foreach ($headers as $header) {
            if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $matches) === 1) {
                return (int) $matches[1];
            }
        }

        return 0;
    }

    /**
     * @param array<int, string> $headers
     */
    private function headerValue(array $headers, string $name): string
    {
        foreach ($headers as $header) {
            if (stripos($header, $name . ':') === 0) {
                return trim(substr($header, strlen($name) + 1));
            }
        }

        return '';
    }

    private function errorCodeForStatus(int $status): string
    {
        return match ($status) {
            401, 403 => 'BUILTBYBIT_AUTH_FAILED',
            404 => 'BUILTBYBIT_NOT_FOUND',
            429 => 'BUILTBYBIT_RATE_LIMITED',
            default => 'BUILTBYBIT_REQUEST_FAILED',
        };
    }

    private function errorMessageForStatus(int $status, string $builtByBitMessage): string
    {
        if ($builtByBitMessage !== '') {
            return $builtByBitMessage;
        }

        return match ($status) {
            401, 403 => 'BuiltByBit authentication failed.',
            404 => 'BuiltByBit resource was not found.',
            429 => 'BuiltByBit rate limit reached.',
            default => 'BuiltByBit request failed.',
        };
    }

    private function internalStatusForBuiltByBitStatus(int $status): int
    {
        return match ($status) {
            404 => 404,
            429 => 429,
            default => 502,
        };
    }

    /**
     * @param array<string, mixed> $decoded
     * @return array{code: string, message: string}
     */
    private function builtByBitErrorDetails(array $decoded): array
    {
        $error = isset($decoded['error']) && is_array($decoded['error']) ? $decoded['error'] : null;

        return [
            'code' => $this->firstString($error, ['code', 'Code']) ?: $this->firstString($decoded, ['code', 'Code']),
            'message' => $this->firstString($error, ['message', 'Message']) ?: $this->firstString($decoded, ['message', 'Message', 'error']),
        ];
    }

    private function bodyExcerpt(string $body): string
    {
        $body = trim($body);

        if (strlen($body) <= 1000) {
            return $body;
        }

        return substr($body, 0, 1000);
    }

    /**
     * @param array<string, mixed> $response
     * @return array<string, mixed>|null
     */
    private function findResource(array $response, string $resourceId): ?array
    {
        if (isset($response['data']) && is_array($response['data'])) {
            foreach (['resources', 'Resources'] as $resourceKey) {
                if (!isset($response['data'][$resourceKey])) {
                    continue;
                }

                $resource = $this->resourceFromValue($response['data'][$resourceKey], $resourceId);

                if ($resource !== null) {
                    return $resource;
                }
            }
        }

        foreach (['resources', 'Resources', 'data', 'Data'] as $key) {
            if (!isset($response[$key])) {
                continue;
            }

            $resource = $this->resourceFromValue($response[$key], $resourceId);

            if ($resource !== null) {
                return $resource;
            }
        }

        return $this->resourceFromValue($response, $resourceId);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resourceFromValue(mixed $value, string $resourceId): ?array
    {
        if (!is_array($value)) {
            return null;
        }

        if ($this->firstString($value, ['id', 'resource_id', 'ResourceId', 'resourceId']) === $resourceId) {
            return $value;
        }

        if (isset($value[$resourceId]) && is_array($value[$resourceId])) {
            return $value[$resourceId];
        }

        foreach ($value as $item) {
            if (is_array($item)) {
                $resource = $this->resourceFromValue($item, $resourceId);

                if ($resource !== null) {
                    return $resource;
                }
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed>|null $source
     * @param array<int, string> $keys
     */
    private function firstString(?array $source, array $keys): string
    {
        if ($source === null) {
            return '';
        }

        foreach ($keys as $key) {
            if (isset($source[$key]) && is_scalar($source[$key])) {
                return trim((string) $source[$key]);
            }
        }

        return '';
    }

    /**
     * @param array<string, mixed> $source
     * @return array<string, mixed>|null
     */
    private function objectValue(array $source, string $key): ?array
    {
        return isset($source[$key]) && is_array($source[$key]) ? $source[$key] : null;
    }

    /**
     * @param array<string, mixed> $resource
     */
    private function resourceUrl(string $resourceId, array $resource): string
    {
        return $this->firstString($resource, ['Url', 'url', 'PublicUrl', 'publicUrl'])
            ?: 'https://builtbybit.com/resources/' . $resourceId;
    }

    /**
     * @param array<string, mixed> $resource
     */
    private function coverImageUrl(array $resource): string
    {
        return $this->firstString($resource, [
            'IconUrl',
            'iconUrl',
            'icon_url',
            'CoverImageUrl',
            'coverImageUrl',
            'cover_image_url',
            'ThumbnailUrl',
            'thumbnailUrl',
        ]);
    }

    /**
     * @param array<string, mixed> $resource
     * @return array<int, string>
     */
    private function carouselImageUrls(array $resource): array
    {
        foreach (['Images', 'images', 'CarouselImages', 'carouselImages', 'carousel_image_urls'] as $key) {
            if (!isset($resource[$key]) || !is_array($resource[$key])) {
                continue;
            }

            $urls = [];
            foreach ($resource[$key] as $image) {
                if (is_scalar($image)) {
                    $urls[] = trim((string) $image);
                    continue;
                }

                if (is_array($image)) {
                    $url = $this->firstString($image, ['url', 'Url', 'image_url', 'imageUrl']);
                    if ($url !== '') {
                        $urls[] = $url;
                    }
                }
            }

            return array_values(array_filter(array_unique($urls)));
        }

        return [];
    }

    /**
     * @param array<string, mixed> $resource
     */
    private function priceLabel(array $resource): string
    {
        $value = $this->firstString($resource, ['FinalPrice', 'finalPrice', 'final_price', 'ListPrice', 'listPrice', 'list_price', 'Price', 'price']);

        if ($value === '') {
            return '';
        }

        if (is_numeric($value) && (float) $value <= 0.0) {
            return 'Gratuit';
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $resource
     */
    private function categoryLabel(array $resource): string
    {
        foreach (['Category', 'category'] as $key) {
            if (!isset($resource[$key])) {
                continue;
            }

            if (is_scalar($resource[$key])) {
                return trim((string) $resource[$key]);
            }

            if (is_array($resource[$key])) {
                return $this->firstString($resource[$key], ['Title', 'title', 'Name', 'name']);
            }
        }

        return '';
    }
}
