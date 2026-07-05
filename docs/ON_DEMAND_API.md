# On Demand API — Plan

## Overview

This document describes the plan for a basic public On Demand API exposed as a set of Next.js route handlers. The Payload CMS already stores all on-demand recordings in PostgreSQL and exposes a generic REST API at `/api/ondemand` (via the catch-all route handler). The purpose of this dedicated API layer is to provide a stable, purpose-built interface that:

- Returns a response shape designed for the public site's display requirements
- Normalises Cloudinary image URLs and audio source metadata
- Can be consumed by the PHP frontend during the transition period and by the future Next.js frontend
- Is independent of the Payload admin API so its contract does not change if the internal Payload schema evolves

---

## Endpoints

### 1. `GET /api/on-demand`

Returns a paginated list of published on-demand recordings.

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sort`    | `date` \| `artist` \| `title` | `date` | Sort order |
| `page`    | integer | `1` | Page number (1-indexed) |
| `limit`   | integer | `20` | Items per page (max 100) |
| `dj`      | string | — | Filter by DJ slug |

**Response shape**

```json
{
  "data": [
    {
      "id": 42,
      "headline": "The Classic Rock Hour w/ Bobby Smith",
      "date": "2024-03-15",
      "imageUrl": "https://res.cloudinary.com/…/on-demand-thumb.jpg",
      "audioUrl": "abc123def456",
      "source": "opendrive",
      "djs": [
        { "id": 7, "slug": "bobby-smith", "displayName": "Bobby Smith" }
      ]
    }
  ],
  "meta": {
    "total": 483,
    "page": 1,
    "limit": 20,
    "totalPages": 25
  }
}
```

### 2. `GET /api/on-demand/[id]`

Returns a single published on-demand recording by its Payload integer ID.

**Response shape**

```json
{
  "id": 42,
  "headline": "The Classic Rock Hour w/ Bobby Smith",
  "date": "2024-03-15",
  "imageUrl": "https://res.cloudinary.com/…/on-demand-thumb.jpg",
  "audioUrl": "abc123def456",
  "source": "opendrive",
  "description": "<p>An hour of classic rock…</p>",
  "djs": [
    { "id": 7, "slug": "bobby-smith", "displayName": "Bobby Smith" }
  ],
  "artists": [
    { "id": 23, "name": "Led Zeppelin" }
  ],
  "songs": [
    { "id": 101, "title": "Stairway to Heaven" }
  ]
}
```

Returns `404` JSON `{ "error": "Not found" }` when the ID does not exist or the recording is not published.

---

## Implementation Approach

### File layout

```
app/
  api/
    on-demand/
      route.ts          ← GET /api/on-demand  (list)
      [id]/
        route.ts        ← GET /api/on-demand/[id]  (single)
```

> Note: the slug `on-demand` (hyphenated) avoids colliding with the Payload catch-all route that owns `/api/ondemand` (no hyphen).

### Data access

Both handlers use the [Payload Local API](https://payloadcms.com/docs/local-api/overview) (`getPayload`) to query the `ondemand` collection directly inside the Next.js process — no HTTP round-trip to Payload's REST layer:

```ts
import { getPayload } from 'payload';
import config from '@payload-config';

const payload = await getPayload({ config });

const result = await payload.find({
  collection: 'ondemand',
  where: { _status: { equals: 'published' } },
  sort: '-date',
  page: 1,
  limit: 20,
  depth: 1,   // populate djs, artists, songs one level deep
});
```

### Response transformation

A shared `formatOnDemandItem` helper converts the raw Payload document into the public response shape:

- Extracts `media.url` for `imageUrl`
- Passes `audioUrl` and `source` through directly
- Converts the Lexical `description` to plain HTML via the existing `lexicalToHtml` utility if one exists, otherwise returns the serialized Lexical JSON
- Formats `date` as `YYYY-MM-DD`
- Maps `djs`, `artists`, `songs` relationships to minimal `{ id, name/displayName/title }` objects

### Error handling

- Invalid `id` (non-integer) → `400 Bad Request`
- Record not found or not published → `404 Not Found`
- Internal database errors → `500 Internal Server Error` with no details leaked to the client

---

## Caching

Route handlers return `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` headers so that Netlify's CDN edge can cache responses and serve them without hitting the database on every request. The cache is short-lived (1 minute fresh, 5 minutes stale-while-revalidate) so content changes in the Payload admin are visible promptly.

---

## Testing

- **Unit tests** (`app/api/on-demand/*.test.ts`) mock the Payload Local API and verify:
  - Correct query construction for each sort option
  - Pagination meta calculation
  - 404 when item is not found
  - 400 when `id` is non-numeric
- **E2E test** (`e2e/on-demand-api.spec.ts`) hits the running dev server and checks:
  - List endpoint returns expected shape and `meta` block
  - Single-item endpoint returns full detail including relationships
  - Non-existent ID returns 404

---

## Consuming the API from PHP

During the transition period the PHP `ondemand.php` page can optionally call this API instead of querying PostgreSQL directly, by adding a feature flag `use_api_ondemand`. This keeps the database credentials out of the PHP environment and centralises data shaping logic in one place. The switch is low-risk because the response shape maps 1-to-1 with what `on_demand_player()` already expects.

---

## Open Questions / Decisions Deferred

- **DJ filter on list endpoint**: filtering by DJ slug requires a relationship lookup. Implement in v2 once the frontend design is confirmed.
- **Lexical-to-HTML**: if no existing utility is available, return raw Lexical JSON in `description` for v1 and add a serialiser in a follow-up PR.
- **Auth**: all endpoints are read-only and unauthenticated. If a write path is ever needed it will go through the Payload admin API directly, not through this layer.
