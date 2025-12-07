# Chapter 10: Neon Integration (Year End Poll)

## Overview

This chapter documents the hybrid Sanity + Neon architecture for the **Year End Poll**. This architecture splits poll data between two systems:

- **Sanity CMS**: Staff-managed configuration (poll setup, categories, options)
- **Neon PostgreSQL**: High-volume user data (votes, contest entries)

This separation provides:
- **Cost efficiency**: Thousands of votes don't impact Sanity API costs
- **Performance**: PostgreSQL handles vote aggregation efficiently
- **Privacy**: PII (contestant contact info) stored appropriately
- **Scalability**: Database can handle high traffic during voting periods

### Data Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Sanity    │◄────────│  Next.js API │────────►│    Neon     │
│             │         │              │         │  PostgreSQL │
│ • Poll      │         │ • Validate   │         │             │
│   Config    │         │ • Authorize  │         │ • Votes     │
│ • Categories│         │ • Process    │         │ • Entries   │
│ • Options   │         │              │         │ • Users     │
└─────────────┘         └──────────────┘         └─────────────┘
```

1. User visits site → Frontend fetches poll config from Sanity
2. User submits votes → API validates against Sanity config
3. API stores votes in Neon PostgreSQL (one vote per category)
4. Results aggregated from Neon, matched with Sanity option data

---

## Sanity Schemas

### `yearEndPoll`
Annual poll configuration.

**Document ID format:** `year-end-poll-{year}` (e.g., `year-end-poll-2025`)

**Key fields:**
- `title`: Display title (e.g., "2025 Year End Poll")
- `year`: Poll year
- `votingOpensAt`: When voting begins
- `votingClosesAt`: When voting ends
- `contestPrize`: Prize description for contest entry drawing
- `status`: `draft` | `open` | `closed` | `archived`

### `yearEndPollCategory`
Individual category within the Year End Poll.

**Document ID format:** `year-end-poll-{year}-{categorySlug}` (e.g., `year-end-poll-2025-songs`)

**Key fields:**
- `poll`: Reference to `yearEndPoll` document
- `name`: Category name (e.g., "Songs", "Albums", "Artists")
- `categoryType`: `SONG` | `ALBUM` | `ARTIST` | `CONCERT` | `NEW_ARTIST` | `PHILLY_ARTIST` | `MOST_ANTICIPATED_ALBUM` | `TV_DRAMA` | `TV_COMEDY` | `BEST_MOVIE` | `WORST_MOVIE` | `UNNECESSARY_SEQUEL` | `OTHER`
- `displayOrder`: Order in poll display
- `numSelections`: Exact number of items voters must select (20 for songs, 10 for albums, 5 for artists, etc.)
- `allowWriteIns`: Whether write-in votes are permitted
- `songOptions` / `albumOptions` / `artistOptions`: Arrays of references based on category type
- `otherOptions`: Array of string values for categories like movies and TV shows

---

## Neon Schema Reference

### Year End Poll Voting

The Year End Poll uses the same `votes` table as other contests, with these specific fields:

| Column | Type | Description |
|--------|------|-------------|
| `contest_sanity_id` | VARCHAR(255) | Reference to `yearEndPoll` document |
| `year_end_poll_category_sanity_id` | VARCHAR(255) | Reference to `yearEndPollCategory` document |
| `option_sanity_id` | VARCHAR(255) | Reference to song/album/artist document (NULL for string options/write-ins) |
| `other_option_value` | VARCHAR(255) | String option value for movie/TV categories (NULL for document references/write-ins) |
| `is_write_in` | BOOLEAN | Is this an actual write-in vote? |
| `write_in_value` | TEXT | User-submitted write-in text (NULL for document references/string options) |

**Unique constraint:** One vote per user per option per category (enforced via unique index on `user_id`, `contest_sanity_id`, `year_end_poll_year_end_poll_category_sanity_id`, and `COALESCE(option_sanity_id, other_option_value, write_in_value)`)

**Vote Type Handling:**
- **Document references** (songs, albums, artists): `option_sanity_id` is set, other option fields are NULL
- **String options** (movies, TV shows): `other_option_value` is set, other option fields are NULL
- **Write-ins** (user-submitted): `write_in_value` is set, `is_write_in` is TRUE, other option fields are NULL

### Helper Functions

#### `get_year_end_poll_vote_counts(p_contest_id VARCHAR, p_category_id VARCHAR)`
Returns vote counts for a specific Year End Poll category.

**Returns:** `option_sanity_id`, `total_votes`

**Usage:**
```sql
SELECT * FROM get_year_end_poll_vote_counts('year-end-poll-2025', 'year-end-poll-2025-songs');
```

#### `get_year_end_poll_write_ins(p_contest_id VARCHAR, p_category_id VARCHAR)`
Returns write-in submissions for a specific category.

**Returns:** `write_in_value`, `count`

**Usage:**
```sql
SELECT * FROM get_year_end_poll_write_ins('year-end-poll-2025', 'year-end-poll-2025-songs');
```

---

## API Patterns

### Submitting Votes

```typescript
// Example: Submit votes for multiple categories
POST /api/contests/year-end-poll/vote

{
  "pollId": "year-end-poll-2025",
  "votes": [
    {
      "categoryId": "year-end-poll-2025-songs",
      "selections": ["song-123", "song-456", "song-789"]
    },
    {
      "categoryId": "year-end-poll-2025-album-of-the-year",
      "selections": ["record-abc"]
    }
  ],
  "entry": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "newsletterOptIn": true
  }
}
```

### Getting Results

```typescript
// Example: Get results for a category
GET /api/contests/year-end-poll/results?poll=yep-2025&category=yep-2025-songs

Response:
{
  "categoryId": "year-end-poll-2025-songs",
  "categoryName": "Songs",
  "results": [
    {
      "optionId": "song-123",
      "songTitle": "Example Song",
      "artistName": "Example Artist",
      "voteCount": 1523
    },
    ...
  ]
}
```

---

## Migration from Legacy MySQL

### Legacy Tables
- `year_end_songs`, `year_end_albums`, `year_end_artists`, `year_end_concerts`, `year_end_new_artists`, `year_end_philly_artists`, `year_end_most_anticipated_albums`, `year_end_tv_dramas`, `year_end_tv_comedies`, `year_end_best_movies`, `year_end_worst_movies`, `year_end_unnecessary_sequels` - Category-specific tables
- `year_end_contestants` - Contest entries
- `year_end_write_ins` - Write-in submissions
- `year_end_ips` - IP tracking

### Migration Strategy
1. Create `yearEndPoll` document in Sanity for 2025
2. Create `yearEndPollCategory` documents for each active category (songs, albums, artists, concerts, new_artists, philly_artists, most_anticipated_albums, tv_dramas, tv_comedies, best_movies, worst_movies, unnecessary_sequels)
3. Map song/album/artist options to corresponding Sanity documents where applicable
4. For string-based categories (movies, TV), migrate option values as `otherOptions`
5. **Note:** Only configuration data from 2025 will be migrated. Historical votes and contest entries will NOT be migrated.
6. **Note:** IP tracking is replaced with user authentication

---

## Security Considerations

1. **Authentication**: Votes require authenticated users (no IP-only tracking)
2. **Rate Limiting**: API endpoints should implement rate limiting
3. **Validation**: All votes validated against Sanity config before storage
4. **Data Privacy**: PII in contest entries follows privacy policy
5. **Write-ins**: Sanitize and review write-in submissions before display

---

## Testing

```typescript
// Example test: Verify duplicate vote prevention
test('Year End Poll: Prevents duplicate votes per category', async () => {
  const userId = 'test-user-123';
  const pollId = 'yep-2025';
  const categoryId = 'yep-2025-songs';
  
  // First vote should succeed
  await submitVote(userId, pollId, categoryId, 'song-123');
  
  // Duplicate vote should fail
  await expect(
    submitVote(userId, pollId, categoryId, 'song-123')
  ).rejects.toThrow('Duplicate vote');
});
```
