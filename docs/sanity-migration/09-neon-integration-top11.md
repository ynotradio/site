# Chapter 9: Neon Integration (Top 11 Contest)

## Overview

This chapter documents the hybrid Sanity + Neon architecture for the **Top 11 Contest**. This architecture splits contest data between two systems:

- **Sanity CMS**: Staff-managed configuration (contest setup, song lists, dates)
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
│ • Contest   │         │ • Validate   │         │             │
│   Config    │         │ • Authorize  │         │ • Votes     │
│ • Songs     │         │ • Process    │         │ • Entries   │
│ • Dates     │         │              │         │ • Users     │
└─────────────┘         └──────────────┘         └─────────────┘
```

1. User visits site → Frontend fetches contest config from Sanity
2. User submits vote → API validates against Sanity config
3. API stores vote in Neon PostgreSQL
4. Results aggregated from Neon, matched with Sanity song data

---

## Neon Schema Reference

### Tables

#### `users`
User accounts for voting.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | User email (unique) |
| `first_name` | VARCHAR(64) | First name |
| `last_name` | VARCHAR(64) | Last name |
| `phone` | VARCHAR(20) | Phone number |
| `hometown` | VARCHAR(64) | Hometown |
| `newsletter_opt_in` | BOOLEAN | Newsletter subscription |
| `created_at` | TIMESTAMP | Account creation time |

#### `votes`
Individual votes for Top 11 contests.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users (nullable) |
| `contest_sanity_id` | VARCHAR(255) | Sanity contest document ID |
| `option_sanity_id` | VARCHAR(255) | Sanity song document ID |
| `top_11_rank` | INTEGER | Ranked choice position (1-11) |
| `is_write_in` | BOOLEAN | Is this a write-in vote? |
| `write_in_value` | TEXT | Write-in text (if applicable) |
| `submitted_at` | TIMESTAMP | Vote submission time |

**Unique constraint:** One vote per user per option per contest (enforced via unique index on `user_id`, `contest_sanity_id`, and `COALESCE(option_sanity_id, write_in_value)`)

#### `contest_entries`
Contest entries for prize drawings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users (nullable) |
| `contest_sanity_id` | VARCHAR(255) | Sanity contest document ID |
| `first_name` | VARCHAR(64) | Entry first name |
| `last_name` | VARCHAR(64) | Entry last name |
| `email` | VARCHAR(255) | Entry email |
| `phone` | VARCHAR(20) | Entry phone |
| `hometown` | VARCHAR(64) | Entry hometown |
| `newsletter_opt_in` | BOOLEAN | Newsletter opt-in |
| `display` | BOOLEAN | Include in winner pool |
| `submitted_at` | TIMESTAMP | Entry submission time |

**Unique constraint:** One entry per email per contest.

### Helper Functions

#### `pick_winner(p_contest_id VARCHAR)`
Randomly selects a winner from eligible contest entries.

**Returns:** `first_name`, `last_name`, `email`, `phone`

**Usage:**
```sql
SELECT * FROM pick_winner('top11-2025-11-20');
```

#### `get_vote_counts(p_contest_id VARCHAR)`
Aggregates vote counts and weighted scores for a contest.

**Returns:** `option_sanity_id`, `total_votes`, `weighted_score`

**Weighted scoring:** For ranked votes, score = (12 - top_11_rank). #1 choice = 11 points, #11 choice = 1 point.

**Usage:**
```sql
SELECT * FROM get_vote_counts('top11-2025-11-20') ORDER BY weighted_score DESC;
```

#### `get_write_ins(p_contest_id VARCHAR)`
Lists write-in submissions with counts.

**Returns:** `write_in_value`, `count`

**Usage:**
```sql
SELECT * FROM get_write_ins('top11-2025-11-20') WHERE count >= 5;
```

---

## Sanity Schema Reference

### Top 11 Contest
Weekly song countdown contest.

**Document ID format:** `top11-{year}-{month}-{date}` (e.g., `top11-2025-11-20`)

**Key fields:**
- `date` - Contest date
- `songs` - Array of Song references
- `votingOpensAt`, `votingClosesAt` - Voting window
- `summary` - Portable text for description, links, and embeds
- `status` - Contest status

**Fixed values:**
- Max selections: Always 11 (enforced in application)
- Write-ins: Always allowed

### Top 11 Result
Published weekly results.

**Key fields:**
- `contest` - Reference to top11Contest
- `placements` - Array with rank, song reference, artist reference, note
- `publishedAt` - Publication timestamp

---

## API Patterns

### Submit a Vote

```typescript
import { SanityClient } from '@sanity/client';
import postgres from 'postgres';

async function submitVote(
  sanity: SanityClient,
  sql: postgres.Sql,
  contestId: string,
  userId: string,
  votes: Array<{ optionId: string; rank?: number }>
) {
  // 1. Fetch contest configuration from Sanity
  const contest = await sanity.fetch(
    `*[_id == $contestId][0]{ 
      _type, status, votingOpensAt, votingClosesAt
    }`,
    { contestId }
  );

  // 2. Validate voting window and status
  if (contest.status !== 'open') {
    throw new Error('Voting is closed');
  }

  const now = new Date();
  if (now < new Date(contest.votingOpensAt) || now > new Date(contest.votingClosesAt)) {
    throw new Error('Outside voting window');
  }

  // 3. Validate vote count (Top 11 always allows 11 selections)
  const MAX_SELECTIONS = 11;
  if (votes.length > MAX_SELECTIONS) {
    throw new Error(`Maximum ${MAX_SELECTIONS} votes allowed`);
  }

  // 4. Insert votes into Neon
  await sql`
    INSERT INTO votes (user_id, contest_sanity_id, option_sanity_id, top_11_rank)
    SELECT ${userId}, ${contestId}, optionId, rank
    FROM json_populate_recordset(null::record, ${JSON.stringify(votes)})
  `;
}
```

### Get Vote Results

```typescript
async function getResults(sql: postgres.Sql, sanity: SanityClient, contestId: string) {
  // 1. Get vote counts from Neon
  const voteCounts = await sql`
    SELECT * FROM get_vote_counts(${contestId})
  `;
  
  // 2. Fetch song details from Sanity
  const songIds = voteCounts.map(v => v.option_sanity_id);
  const songs = await sanity.fetch(
    `*[_id in $songIds]{ _id, title, artist->{ name } }`,
    { songIds }
  );
  
  // 3. Combine data
  return voteCounts.map(vote => ({
    ...vote,
    song: songs.find(s => s._id === vote.option_sanity_id)
  }));
}
```

### Pick Contest Winner

```typescript
async function pickContestWinner(sql: postgres.Sql, contestId: string) {
  const [winner] = await sql`
    SELECT * FROM pick_winner(${contestId})
  `;
  
  return winner;
}
```

---

## Performance Considerations

### Indexes

The schema includes indexes for common query patterns:
- Vote lookups by contest and option
- User vote history
- Winner pool filtering (`display = TRUE`)

### Query Optimization

For large result sets:
```sql
-- Efficient Top 11 results (uses index on contest_sanity_id + option_sanity_id)
SELECT option_sanity_id, COUNT(*) as votes
FROM votes
WHERE contest_sanity_id = 'top11-2025-11-20'
  AND is_write_in = false
GROUP BY option_sanity_id;
```

### Connection Pooling

Use connection pooling for production:
```typescript
import postgres from 'postgres';

const sql = postgres(process.env.NEON_DATABASE_URL!, {
  max: 10, // Maximum pool size
  idle_timeout: 20, // Idle connection timeout (seconds)
});
```

---

## Security Considerations

### User Authentication

Duplicate vote prevention relies on authenticated user accounts:
- Require user login for voting
- User ID is the primary duplicate prevention mechanism
- Unique constraints in database enforce one vote per user per option per contest

### PII Protection

Contest entry data contains PII:
- Store in Neon (not Sanity) for better access control
- Encrypt sensitive fields at application level
- Implement data deletion requests
- Restrict database access to authorized services only

### Vote Integrity

Prevent duplicate votes:
- Unique constraints in database based on user_id
- User account verification required
- Rate limiting on submission endpoints

---

## Environment Setup

### Required Environment Variables

```env
# Neon Database
NEON_DATABASE_URL=postgresql://user:pass@host/database

# Sanity
SANITY_PROJECT_ID=your-project-id
SANITY_DATASET=production
SANITY_API_TOKEN=your-token
```

### Database Setup

1. Create Neon project
2. Run schema migration: `psql $NEON_DATABASE_URL < src/db/neon/schema.sql`
3. Verify tables created: `\dt` in psql

---

## Migration Notes

### From Legacy MySQL

Current MySQL schema:
- `top11songs` - Song options for voting
- `top11contest` - Contest configuration
- `top11_write_ins` - Write-in submissions

Migration strategy:
1. Create Sanity contest documents from `top11contest` table
2. Migrate `top11songs` entries as votes into Neon `votes` table
3. Migrate `top11_write_ins` as write-in votes
4. Archive MySQL data after verification

### Data Mapping

| MySQL | New Architecture |
|-------|------------------|
| `top11contest.*` | Sanity `top11Contest` document |
| `top11songs.id` | Neon `votes.option_sanity_id` |
| `top11songs.rank` | Neon `votes.top_11_rank` |
| `top11_write_ins.*` | Neon `votes` (with `is_write_in=true`) |
