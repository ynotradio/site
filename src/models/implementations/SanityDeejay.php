<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Deejay;

require_once __DIR__ . '/../../lib/sanity-client.php';

/**
 * Read-only implementation of the Deejay model for migration from MySQL to Sanity CMS.
 *
 * This class provides methods to fetch deejay data from Sanity CMS.
 * Write operations (create, update, delete) are not yet supported.
 * Intended for use during the migration phase to ensure compatibility and data integrity.
 */
class SanityDeejay implements Deejay {
    private \SanityClient $sanityClient;

    public function __construct() {
        $this->sanityClient = new \SanityClient();
    }

    public function getById(int $id): ?array {
        $query = '*[_type == "dj" && person->legacyId == $id][0] {
            "id": person->legacyId,
            "name": person->name,
            "email": person->email,
            "pic": person->photo,
            "show": person->bio,
            "external_connect_text": person->socialLinks[0].text,
            "external_connect_url": person->socialLinks[0].url,
            sortOrder
        }';

        try {
            $result = $this->sanityClient->fetch($query, ['id' => $id]);

            if (empty($result)) {
                return null;
            }

            return $this->transformDeejay($result);
        } catch (\Exception $e) {
            throw new \RuntimeException("Error fetching deejay by ID from Sanity: " . $e->getMessage());
        }
    }

    public function getAll(int $limit = 64): array {
        $query = '*[_type == "dj" && isActive == true] | order(sortOrder asc) {
            "id": person->legacyId,
            "name": person->name,
            "email": person->email,
            "pic": person->photo,
            "show": person->bio,
            "external_connect_text": person->socialLinks[0].text,
            "external_connect_url": person->socialLinks[0].url,
            sortOrder
        }';

        try {
            $results = $this->sanityClient->fetch($query);
            $transformed = array_map([$this, 'transformDeejay'], $results);

            // Split into two columns like the SQL version does
            $left_column = [];
            $right_column = [];

            for ($i = 0; $i < count($transformed); $i++) {
                if (($i + 1) % 2 == 0) {
                    $right_column[] = $transformed[$i];
                } else {
                    $left_column[] = $transformed[$i];
                }
            }

            return [$left_column, $right_column];
        } catch (\Exception $e) {
            throw new \RuntimeException("Error fetching all deejays from Sanity: " . $e->getMessage());
        }
    }

    public function add(array $data): int {
        // For now, admin operations still go through MySQL
        // This allows the migration to be read-only from Sanity
        // Once fully migrated, this can be updated to write to Sanity
        throw new \RuntimeException("Add operations not yet supported for Sanity deejays. Please use Sanity Studio.");
    }

    public function update(int $id, array $data): bool {
        // For now, admin operations still go through MySQL
        // This allows the migration to be read-only from Sanity
        throw new \RuntimeException("Update operations not yet supported for Sanity deejays. Please use Sanity Studio.");
    }

    public function delete(int $id): bool {
        // For now, admin operations still go through MySQL
        // This allows the migration to be read-only from Sanity
        throw new \RuntimeException("Delete operations not yet supported for Sanity deejays. Please use Sanity Studio.");
    }

    public function getName(int $id): string {
        $deejay = $this->getById($id);

        if (!$deejay) {
            throw new \RuntimeException("Deejay not found with ID: $id");
        }

        return $deejay['name'];
    }

    public function updateSortOrder(array $items): bool {
        // For now, admin operations still go through MySQL
        // This allows the migration to be read-only from Sanity
        throw new \RuntimeException("Sort order operations not yet supported for Sanity deejays. Please use Sanity Studio.");
    }

    /**
     * Transform Sanity deejay data to match MySQL format
     */
    private function transformDeejay(array $deejay): array {
        // Extract show info from bio blocks, excluding any blocks with links
        $showText = '';
        if (!empty($deejay['show'])) {
            foreach ($deejay['show'] as $block) {
                // Skip blocks that have markDefs (links)
                if (!empty($block['markDefs'])) {
                    continue;
                }
                
                if (isset($block['children'])) {
                    foreach ($block['children'] as $child) {
                        if (isset($child['text'])) {
                            $text = $child['text'];
                            // Remove "Show: " prefix if present
                            if (strpos($text, 'Show: ') === 0) {
                                $text = substr($text, 6);
                            }
                            // Only add if it's not empty
                            if (!empty(trim($text))) {
                                $showText .= ($showText ? '<br>' : '') . $text;
                            }
                        }
                    }
                }
            }
        }

        // Get image URL
        $picUrl = '';
        if (!empty($deejay['pic'])) {
            $picUrl = $this->sanityClient->getImageUrl($deejay['pic'], 150);
        }

        return [
            'id' => $deejay['id'] ?? 0,
            'name' => $deejay['name'] ?? '',
            'show' => $showText,
            'email' => $deejay['email'] ?? '',
            'external_connect_text' => $deejay['external_connect_text'] ?? '',
            'external_connect_url' => $deejay['external_connect_url'] ?? '',
            'pic' => $picUrl,
            'sort' => $deejay['sortOrder'] ?? 0,
            'deleted' => 'no',
        ];
    }
}
