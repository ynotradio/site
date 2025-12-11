<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Concert;

require_once __DIR__ . '/../../lib/sanity-client.php';

/**
 * Read-only implementation of the Concert model for migration from MySQL to Sanity CMS.
 *
 * This class provides methods to fetch concert data from Sanity CMS.
 * Write operations (create, update, delete) are not yet supported.
 * Intended for use during the migration phase to ensure compatibility and data integrity.
 */
class SanityConcert implements Concert {
    private \SanityClient $sanityClient;

    public function __construct() {
        $this->sanityClient = new \SanityClient();
    }

    public function getById(int $id): ?array {
        $query = '*[_type == "concert" && legacyId == $id][0] {
            _id,
            title,
            date,
            "artists": artists[]->name,
            "artist_url": artists[0]->website,
            "band_pic_url": artists[0]->photo,
            "venue": venue->name,
            "venue_url": venue->website,
            ticketInfo,
            ticketUrl,
            featured,
            legacyId
        }';

        try {
            $result = $this->sanityClient->fetch($query, ['id' => $id]);

            if (empty($result)) {
                return null;
            }

            return $this->transformConcert($result);
        } catch (\Exception $e) {
            throw new \RuntimeException("Error fetching concert by ID from Sanity: " . $e->getMessage());
        }
    }

    public function getAll(int $limit = 64): array {
        $query = '*[_type == "concert"] | order(date desc) [0...$limit] {
            _id,
            title,
            date,
            "artists": artists[]->name,
            "artist_url": artists[0]->website,
            "band_pic_url": artists[0]->photo,
            "venue": venue->name,
            "venue_url": venue->website,
            ticketInfo,
            ticketUrl,
            featured,
            legacyId
        }';

        try {
            $results = $this->sanityClient->fetch($query, [
                'limit' => $limit - 1,
            ]);

            return array_map([$this, 'transformConcert'], $results);
        } catch (\Exception $e) {
            throw new \RuntimeException("Error fetching all concerts from Sanity: " . $e->getMessage());
        }
    }

    public function getUpcoming(int $limit = 500): array {
        $query = '*[_type == "concert" && date >= $today] | order(date asc) [0...$limit] {
            _id,
            title,
            date,
            "artists": artists[]->name,
            "artist_url": artists[0]->website,
            "band_pic_url": artists[0]->photo,
            "venue": venue->name,
            "venue_url": venue->website,
            ticketInfo,
            ticketUrl,
            featured,
            legacyId
        }';

        try {
            $today = date('Y-m-d');
            $results = $this->sanityClient->fetch($query, [
                'today' => $today,
                'limit' => $limit - 1,
            ]);

            return array_map([$this, 'transformConcert'], $results);
        } catch (\Exception $e) {
            throw new \RuntimeException("Error fetching upcoming concerts from Sanity: " . $e->getMessage());
        }
    }

    public function getFeatured(int $limit = 5): array {
        $query = '*[
            _type == "concert"
            && date >= $today
            && featured == true
            && defined(artists[0]->photo)
            && ticketInfo != "SOLD OUT"
        ] | order(date asc) [0...$limit] {
            _id,
            title,
            date,
            "artists": artists[]->name,
            "artist_url": artists[0]->website,
            "band_pic_url": artists[0]->photo,
            "venue": venue->name,
            "venue_url": venue->website,
            ticketInfo,
            ticketUrl,
            featured,
            legacyId
        }';

        try {
            $today = date('Y-m-d');
            $results = $this->sanityClient->fetch($query, [
                'today' => $today,
                'limit' => $limit - 1,
            ]);

            return array_map([$this, 'transformConcert'], $results);
        } catch (\Exception $e) {
            throw new \RuntimeException("Error fetching featured concerts from Sanity: " . $e->getMessage());
        }
    }

    public function add(array $data): int {
        // For now, admin operations still go through MySQL
        // This allows the migration to be read-only from Sanity
        // Once fully migrated, this can be updated to write to Sanity
        throw new \RuntimeException("Add operations not yet supported for Sanity concerts. Please use Sanity Studio.");
    }

    public function update(int $id, array $data): bool {
        // For now, admin operations still go through MySQL
        // This allows the migration to be read-only from Sanity
        throw new \RuntimeException("Update operations not yet supported for Sanity concerts. Please use Sanity Studio.");
    }

    public function delete(int $id): bool {
        // For now, admin operations still go through MySQL
        // This allows the migration to be read-only from Sanity
        throw new \RuntimeException("Delete operations not yet supported for Sanity concerts. Please use Sanity Studio.");
    }

    public function getConcertInfo(int $id): string {
        $concert = $this->getById($id);

        if (!$concert) {
            throw new \RuntimeException("Concert not found with ID: $id");
        }

        return $concert['artist'] . " at " . $concert['venue'];
    }

    /**
     * Transform Sanity concert data to match MySQL format
     */
    private function transformConcert(array $concert): array {
        $bandPicUrl = '';
        if (!empty($concert['band_pic_url'])) {
            $bandPicUrl = $this->sanityClient->getImageUrl($concert['band_pic_url'], 200, 200);
        }

        // Use custom title if provided, otherwise join multiple artists with " & "
        $artistNames = '';
        if (!empty($concert['title'])) {
            $artistNames = $concert['title'];
        } elseif (!empty($concert['artists']) && is_array($concert['artists'])) {
            $artistNames = implode(' & ', $concert['artists']);
        }

        return [
            'id' => $concert['legacyId'] ?? 0,
            'date' => $concert['date'],
            'artist' => $artistNames,
            'band_url' => $concert['artist_url'] ?? '',
            'band_pic_url' => $bandPicUrl,
            'venue' => $concert['venue'] ?? '',
            'venue_url' => $concert['venue_url'] ?? '',
            'ticketinfo' => $concert['ticketInfo'] ?? '',
            'ticketurl' => $concert['ticketUrl'] ?? '',
            'featured' => ($concert['featured'] ?? false) ? 'Yes' : 'No',
            'deleted' => 'n',
        ];
    }
}
