# Chapter 9: Neon Integration

[← Back to Index](./README.md)

---

## Overview

Contest features (Top 11, Year End Poll, Modern Rock Madness) use a **hybrid architecture** that splits data between Sanity CMS and Neon PostgreSQL for optimal cost, performance, and functionality.

### Why a Hybrid Approach?

**Sanity** excels at:
- Staff-managed content with editorial workflows
- Visual content management interface
- Reference relationships between content types
- Versioning and publishing workflows

**Neon (PostgreSQL)** excels at:
- High-volume transactional data (thousands of votes)
- Complex aggregation queries
- Unique constraints for duplicate prevention
- Storing personally identifiable information (PII)

### Data Separation

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| Contest configuration (dates, prizes, options) | Sanity | Staff-managed content, editorial workflow |
| Song/album/artist options | Sanity | Reference existing content documents |
| Voting windows and rules | Sanity | CMS-managed configuration |
| Individual votes | Neon | High volume, API cost efficiency |
| Write-in submissions | Neon | User-generated text data |
| Contest entries (contact info) | Neon | PII, prize drawing queries |

---

## Architecture

### Data Flow: Voting

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. User votes
       ▼
┌─────────────────┐
│  API Endpoint   │ ← 2. Fetch contest config from Sanity
│  (Node.js/PHP)  │ → 3. Validate vote
└──────┬──────────┘
       │ 4. Store vote
       ▼
┌─────────────┐
│    Neon     │
│ (PostgreSQL)│
└─────────────┘
```

### Data Flow: Results

```
┌─────────────┐
│    Neon     │
│ (PostgreSQL)│ ← 1. Query vote counts
└──────┬──────┘
       │ 2. Aggregate results
       ▼
┌─────────────────┐
│   Staff Tool    │ → 3. Publish results to Sanity
└─────────────────┘
       │
       ▼
┌─────────────┐
│   Sanity    │ ← 4. Create top11Result document
└─────────────┘
       │
       ▼
┌─────────────┐
│   Website   │ ← 5. Display published results
└─────────────┘
```

---

## Neon Schema Reference

### Tables

#### `users`
Registered users and voters.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | Unique email address |
| `first_name` | VARCHAR(64) | First name |
| `last_name` | VARCHAR(64) | Last name |
| `phone` | VARCHAR(20) | Phone number |
| `hometown` | VARCHAR(64) | Hometown |
| `newsletter_opt_in` | BOOLEAN | Newsletter subscription |
| `created_at` | TIMESTAMP | Account creation time |

#### `votes`
Individual votes for all contest types.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users (nullable) |
| `contest_type` | VARCHAR(50) | Contest type enum ('top11', 'year_end_poll', 'mrm') |
| `contest_sanity_id` | VARCHAR(255) | Sanity contest document ID |
| `sanity_option_id` | VARCHAR(255) | Sanity option document ID (song/record/artist) |
| `year_end_poll_category_sanity_id` | VARCHAR(255) | Year End Poll category ID |
| `modern_rock_madness_matchup_sanity_id` | VARCHAR(255) | MRM match ID |
| `top_11_rank` | INTEGER | Ranked choice position (Top 11) |
| `is_write_in` | BOOLEAN | Is this a write-in vote? |
| `write_in_value` | TEXT | Write-in text (if applicable) |
| `submitted_at` | TIMESTAMP | Vote submission time |

**Unique constraints:**
- MRM: One vote per user per matchup
- Year End Poll: One vote per user per category per option

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

**Returns:** `sanity_option_id`, `year_end_poll_category_sanity_id`, `total_votes`, `weighted_score`

**Weighted scoring:** For ranked votes, score = (12 - top_11_rank). #1 choice = 11 points, #11 choice = 1 point.

**Usage:**
```sql
SELECT * FROM get_vote_counts('top11-2025-11-20') ORDER BY weighted_score DESC;
```

#### `get_write_ins(p_contest_id VARCHAR)`
Lists write-in submissions with counts.

**Returns:** `write_in_value`, `category`, `count`

**Usage:**
```sql
SELECT * FROM get_write_ins('yep-2025') WHERE count >= 5;
```

---

## Sanity Schema Reference

### Contest Types

#### Top 11 Contest
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

#### Top 11 Result
Published weekly results.

**Key fields:**
- `contest` - Reference to top11Contest
- `placements` - Array of rank/song/artist objects
- `publishedAt` - Publication timestamp

#### Year End Poll
Annual poll configuration.

**Document ID format:** `yep-{year}`

**Key fields:**
- `year` - Poll year
- `votingOpensAt`, `votingClosesAt` - Voting window
- `status` - 'draft' | 'open' | 'closed' | 'archived'

#### Year End Poll Category
Individual poll category (e.g., "Best Album").

**Document ID format:** `yep-{year}-{categorySlug}`

**Key fields:**
- `poll` - Reference to yearEndPoll
- `categoryType` - 'songs' | 'records' | 'artists' | 'concerts' | 'freeform'
- `options` - Array (structure varies by categoryType)
- `maxSelections` - How many votes per user

#### MRM Tournament
Tournament configuration.

**Document ID format:** `mrm-{year}`

**Key fields:**
- `year` - Tournament year
- `rounds` - Array of round definitions
- `status` - 'draft' | 'active' | 'complete' | 'archived'

#### MRM Band
Tournament participant.

**Key fields:**
- `tournament` - Reference to mrmTournament
- `artist` - Reference to Artist
- `seed` - 1-16
- `region` - 'east' | 'west' | 'north' | 'south'

#### MRM Match
Bracket matchup.

**Document ID format:** `mrm-{year}-match-{matchNumber}`

**Key fields:**
- `tournament` - Reference to mrmTournament
- `band1`, `band2` - References to mrmBand
- `winner` - Reference to mrmBand (set after voting)
- `startsAt`, `endsAt` - Voting window

---

## Environment Setup

### Neon Connection

Add to `.env`:
```
NEON_DATABASE_URL=postgresql://user:pass@host/database?sslmode=require
```

### Sanity Connection

Add to `.env`:
```
SANITY_PROJECT_ID=your-project-id
SANITY_DATASET=production
SANITY_API_TOKEN=your-read-token
```

### Initialize Neon Database

```bash
# Apply schema
psql $NEON_DATABASE_URL < src/db/neon/schema.sql
```

---

## Migration Notes

### From Legacy MySQL

The hybrid architecture replaces these legacy MySQL tables:

**Top 11:**
- `top11songs` → Neon `votes` table
- `top11contest` → Sanity `top11Contest` + Neon `contest_entries`
- `top11_write_ins` → Neon `votes` with `is_write_in=true`

**Year End Poll:**
- `year_end_*` (19 category tables) → Neon `votes` table
- `year_end_contestants` → Sanity `yearEndPollCategory.options`
- `year_end_write_ins` → Neon `votes` with `is_write_in=true`
- `year_end_ips` → Neon `contest_entries`

**Modern Rock Madness:**
- `mrm_bands` → Sanity `mrmBand`
- `mrm_matches` → Sanity `mrmMatch`
- `mrm_votes` → Neon `votes` table

### Migration Strategy

1. **Export historical votes** from MySQL to Neon
   - Map legacy contest IDs to new Sanity document IDs
   - Preserve submission timestamps
   
2. **Create Sanity contest documents** for historical data
   - Back-populate Top 11 contests for past weeks
   - Create Year End Poll documents for past years
   
3. **Archive completed contests** in Sanity
   - Set status to 'archived'
   - Keep for historical reference

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

  // 4. Determine contest type from ID prefix
  const contestType = contestId.startsWith('top11') ? 'top11' 
    : contestId.startsWith('yearendpoll') ? 'year_end_poll'
    : 'mrm';

  // 5. Insert votes into Neon
  await sql`
    INSERT INTO votes (user_id, contest_type, contest_sanity_id, sanity_option_id, top_11_rank)
    SELECT ${userId}, ${contestType}, ${contestId}, optionId, rank
    FROM json_populate_recordset(null::record, ${JSON.stringify(votes)})
  `;
}
```

### Get Vote Results

```typescript
async function getVoteResults(sql: postgres.Sql, contestId: string) {
  const results = await sql`
    SELECT * FROM get_vote_counts(${contestId})
    ORDER BY weighted_score DESC
    LIMIT 11
  `;
  
  return results;
}
```

### Pick a Winner

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
- Vote lookups by contest, option, category, matchup
- User vote history
- Contest type filtering
- Winner pool filtering (`display = TRUE`)

### Query Optimization

For large result sets:
```sql
-- Efficient Top 11 results (uses index on contest_sanity_id + sanity_option_id)
SELECT sanity_option_id, COUNT(*) as votes
FROM votes
WHERE contest_sanity_id = 'top11-2025-11-20'
  AND is_write_in = false
GROUP BY sanity_option_id;

-- Efficient MRM matchup results (uses index on modern_rock_madness_matchup_sanity_id)
SELECT sanity_option_id as band_id, COUNT(*) as votes
FROM votes
WHERE modern_rock_madness_matchup_sanity_id = 'mrm-2025-match-42'
GROUP BY sanity_option_id;
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
- User ID (not IP address) is the primary duplicate prevention mechanism
- Unique constraints in database enforce one vote per user per contest/matchup/category

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

## TypeScript Types

Type definitions are available in `src/types/database.ts`:

```typescript
import { User, Vote, ContestEntry, VoteCount, WriteIn, Winner } from '@/types/database';
```

See the file for complete interface definitions.

---

[← Back to Index](./README.md)
