<?php
/**
 * Sanity CMS PHP Client
 *
 * A lightweight client for querying Sanity CMS from PHP
 */

class SanityClient {
    private $projectId;
    private $dataset;
    private $apiVersion;
    private $useCdn;

    /**
     * Initialize Sanity client
     *
     * @param string $projectId Sanity project ID (default: getenv('SANITY_PROJECT_ID') or 'otcmx0q6')
     * @param string $dataset Dataset name (default: 'production')
     * @param string $apiVersion API version (default: getenv('SANITY_API_VERSION') or '2024-01-01')
     * @param bool $useCdn Whether to use CDN (default: true)
     *
     * The default API version '2024-01-01' was chosen based on the date this integration was developed.
     * To use a different version, set the SANITY_API_VERSION environment variable or pass the desired version to the constructor.
     */
    public function __construct(
        $projectId = null,
        $dataset = 'production',
        $apiVersion = null,
        $useCdn = true
    ) {
        // Load projectId from environment variable if not provided
        if ($projectId === null) {
            $projectId = getenv('SANITY_PROJECT_ID') ?: 'otcmx0q6';
        }
        $this->projectId = $projectId;
        $this->dataset = $dataset;
        $this->apiVersion = $apiVersion ?? getenv('SANITY_API_VERSION') ?: '2024-01-01';
        $this->useCdn = $useCdn;
    }

    /**
     * Execute a GROQ query
     *
     * @param string $query GROQ query string
     * @param array $params Optional query parameters
     * @return array Query results
     * @throws Exception on HTTP errors
     */
    public function fetch($query, $params = []) {
        $host = $this->useCdn ? 'apicdn.sanity.io' : 'api.sanity.io';
        $url = "https://{$this->projectId}.{$host}/v{$this->apiVersion}/data/query/{$this->dataset}";

        // Build query string
        $queryParams = ['query' => $query];
        if (!empty($params)) {
            foreach ($params as $key => $value) {
                $queryParams['$' . $key] = json_encode($value);
            }
        }

        $url .= '?' . http_build_query($queryParams);

        // Make HTTP request
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Sanity API request failed: {$error}");
        }

        if ($httpCode !== 200) {
            throw new Exception("Sanity API returned HTTP {$httpCode}: {$response}");
        }

        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Failed to parse Sanity API response: " . json_last_error_msg());
        }

        return $data['result'] ?? [];
    }

    /**
     * Get image URL for a Sanity image asset
     *
     * @param object|array $image Sanity image object with asset reference
     * @param int $width Optional width for image transformation
     * @param int $height Optional height for image transformation
     * @return string|null Image URL or null if no image
     */
    public function getImageUrl($image, $width = null, $height = null) {
        if (!$image || !isset($image['asset'])) {
            return null;
        }

        // Handle both object and array syntax
        $assetRef = is_array($image['asset'])
            ? ($image['asset']['_ref'] ?? null)
            : ($image['asset']->_ref ?? null);

        if (!$assetRef) {
            return null;
        }

        // Parse asset reference: image-{id}-{width}x{height}-{format}
        if (!preg_match('/image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)/', $assetRef, $matches)) {
            return null;
        }

        list(, $id, $origWidth, $origHeight, $format) = $matches;

        $url = "https://cdn.sanity.io/images/{$this->projectId}/{$this->dataset}/{$id}-{$origWidth}x{$origHeight}.{$format}";

        // Add transformations if specified
        $params = [];
        if ($width) $params['w'] = $width;
        if ($height) $params['h'] = $height;

        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        return $url;
    }
}
?>
