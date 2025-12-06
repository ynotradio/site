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

**Document ID format:** `yep-{year}` (e.g., `yep-2025`)

**Key fields:**
- `title`: Display title (e.g., "2025 Year End Poll")
- `year`: Poll year
- `votingOpensAt`: When voting begins
- `votingClosesAt`: When voting ends
- `contestPrize`: Prize description for contest entry drawing
- `status`: `draft` | `open` | `closed` | `archived`

### `yearEndPollCategory`
Individual category within the Year End Poll.

**Document ID format:** `yep-{year}-{categorySlug}` (e.g., `yep-2025-song-of-the-year`)

**Key fields:**
- `poll`: Reference to `yearEndPoll` document
- `name`: Category name (e.g., "Song of the Year")
- `categoryType`: `song` | `album` | `artist` | `band`
- `displayOrder`: Order in poll display
- `maxSelections`: How many options voters can select
- `allowWriteIns`: Whether write-in votes are permitted
- `songOptions` / `albumOptions` / `artistOptions`: Arrays of references based on category type

---

## Neon Schema Reference

### Year End Poll Voting

The Year End Poll uses the same `votes` table as other contests, with these specific fields:

| Column | Type | Description |
|--------|------|-------------|
| `contest_sanity_id` | VARCHAR(255) | Reference to `yearEndPoll` document |
| `category_sanity_id` | VARCHAR(255) | Reference to `yearEndPollCategory` document |
| `option_sanity_id` | VARCHAR(255) | Reference to song/album/artist document |
| `is_write_in` | BOOLEAN | Is this a write-in vote? |
| `write_in_value` | TEXT | Write-in text (if applicable) |

**Unique constraint:** One vote per user per option per category (enforced via unique index on `user_id`, `contest_sanity_id`, `category_sanity_id`, and `COALESCE(option_sanity_id, write_in_value)`)

### Helper Functions

#### `get_yep_vote_counts(p_contest_id VARCHAR, p_category_id VARCHAR)`
Returns vote counts for a specific Year End Poll category.

**Returns:** `option_sanity_id`, `total_votes`

**Usage:**
```sql
SELECT * FROM get_yep_vote_counts('yep-2025', 'yep-2025-song-of-the-year');
```

#### `get_yep_write_ins(p_contest_id VARCHAR, p_category_id VARCHAR)`
Returns write-in submissions for a specific category.

**Returns:** `write_in_value`, `count`

**Usage:**
```sql
SELECT * FROM get_yep_write_ins('yep-2025', 'yep-2025-song-of-the-year');
```

---

## API Patterns

### Submitting Votes

```typescript
// Example: Submit votes for multiple categories
POST /api/contests/year-end-poll/vote

{
  "pollId": "yep-2025",
  "votes": [
    {
      "categoryId": "yep-2025-song-of-the-year",
      "selections": ["song-123", "song-456", "song-789"]
    },
    {
      "categoryId": "yep-2025-album-of-the-year",
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
GET /api/contests/year-end-poll/results?poll=yep-2025&category=yep-2025-song-of-the-year

Response:
{
  "categoryId": "yep-2025-song-of-the-year",
  "categoryName": "Song of the Year",
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
- `year_end_*` - 19 category tables (one per category type)
- `year_end_contestants` - Contest entries
- `year_end_write_ins` - Write-in submissions
- `year_end_ips` - IP tracking

### Migration Strategy
1. Create `yearEndPoll` document in Sanity for each year
2. Create `yearEndPollCategory` document for each legacy category table
3. Map song/album/artist options to corresponding Sanity documents
4. Migrate votes from category tables to unified `votes` table
5. Migrate contest entries to `contest_entries` table
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
  const categoryId = 'yep-2025-song-of-the-year';
  
  // First vote should succeed
  await submitVote(userId, pollId, categoryId, 'song-123');
  
  // Duplicate vote should fail
  await expect(
    submitVote(userId, pollId, categoryId, 'song-123')
  ).rejects.toThrow('Duplicate vote');
});
```
