# Chapter 11: Neon Integration (Modern Rock Madness)

## Overview

This chapter documents the hybrid Sanity + Neon architecture for **Modern Rock Madness** (MRM). This architecture splits tournament data between two systems:

- **Sanity CMS**: Staff-managed configuration (tournament setup, groups, brackets, matches)
- **Neon PostgreSQL**: High-volume user data (votes for each matchup)

This separation provides:
- **Cost efficiency**: Thousands of votes don't impact Sanity API costs
- **Performance**: PostgreSQL handles vote aggregation efficiently
- **Real-time updates**: Fast vote counting for live bracket updates
- **Scalability**: Database can handle high traffic during voting periods

### Data Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Sanity    │◄────────│  Next.js API │────────►│    Neon     │
│             │         │              │         │  PostgreSQL │
│ • Tournament│         │ • Validate   │         │             │
│   Config    │         │ • Authorize  │         │ • Votes     │
│ • Groups     │         │ • Process    │         │ • Users     │
│ • Matches   │         │              │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
```

1. User visits bracket → Frontend fetches tournament/match data from Sanity
2. User votes in matchup → API validates match is active
3. API stores vote in Neon PostgreSQL
4. Vote counts aggregated from Neon in real-time
5. Winner determined and updated in Sanity after match closes

---

## Sanity Schemas

### `modernRockMadnessTournament`
Annual tournament configuration.

**Document ID format:** `modern-rock-madness-{year}` (e.g., `modern-rock-madness-2025`)

**Key fields:**
- `title`: Display title (e.g., "Modern Rock Madness 2025")
- `year`: Tournament year
- `status`: `draft` | `active` | `complete` | `archived`
- `rounds`: Array of round configurations
  - `roundNumber`: Round sequence (1, 2, 3...)
  - `name`: Round name (e.g., "First Round", "Sweet Sixteen", "Elite Eight", "Final Four", "Championship")
  - `startsAt`: Round start datetime
  - `endsAt`: Round end datetime

### `modernRockMadnessGroup`
Tournament participant (group/artist). A group can represent one or more artists.

**Key fields:**
- `tournament`: Reference to `modernRockMadnessTournament` document
- `artists`: Array of references to `artist` documents (one or more artists)
- `seed`: Tournament seed (1-64 typical)
- `region`: Bracket region (e.g., "East", "West", "North", "South")
- `placement`: Final result (e.g., "Champion", "Runner-up", "Elite Eight")
- `sponsor`: Sponsor name for this group
- `abbreviation`: Short abbreviation for display

### `modernRockMadnessMatch`
Individual bracket matchup between two groups.

**Document ID format:** `modern-rock-madness-{year}-match-{matchNumber}` (e.g., `modern-rock-madness-2025-match-1`)

**Key fields:**
- `tournament`: Reference to `modernRockMadnessTournament` document
- `matchNumber`: Unique match number within tournament
- `round`: Round number (1 = First Round, 2 = Second Round, etc.)
- `region`: Bracket region
- `group1`: Reference to first `modern-rock-madnessGroup`
- `group2`: Reference to second `modern-rock-madnessGroup`
- `winner`: Reference to winning `modern-rock-madnessGroup` (set after voting closes)
- `startsAt`: Match voting start time
- `endsAt`: Match voting end time
- `showScore`: Whether to publicly display vote counts
- `sponsor`: Match sponsor name
- `sponsorMessage`: Message from match sponsor

---

## Neon Schema Reference

### Modern Rock Madness Voting

The Modern Rock Madness tournament uses the same `votes` table as other contests, with these specific fields:

| Column | Type | Description |
|--------|------|-------------|
| `match_sanity_id` | VARCHAR(255) | Reference to `modernRockMadnessMatch` document |
| `option_sanity_id` | VARCHAR(255) | Reference to `modern-rock-madnessGroup` document (the group being voted for) |
| `user_id` | UUID | User who cast the vote |

**Unique constraint:** One vote per user per match (enforced via unique index on `user_id` and `match_sanity_id`)

**Note:** Write-ins are NOT supported for Modern Rock Madness (voters must choose one of the two groups in the matchup)

### Helper Functions

#### `get_modern_rock_madness_match_votes(p_match_id VARCHAR)`
Returns vote counts for a specific match.

**Returns:** `option_sanity_id` (group ID), `total_votes`

**Usage:**
```sql
SELECT * FROM get_modern_rock_madness_match_votes('modern-rock-madness-2025-match-1');
```

**Example result:**
```
option_sanity_id   | total_votes
-------------------+------------
mrmgroup-foo-2025  | 1523
mrmgroup-bar-2025  | 1204
```

---

## API Patterns

### Submitting a Vote

```typescript
// Example: Vote in a match
POST /api/contests/mrm/vote

{
  "matchId": "modern-rock-madness-2025-match-1",
  "groupId": "mrmgroup-foo-2025"
}

Response:
{
  "success": true,
  "matchId": "modern-rock-madness-2025-match-1",
  "votedFor": "mrmgroup-foo-2025"
}
```

### Getting Match Results

```typescript
// Example: Get current vote counts for a match
GET /api/contests/mrm/results?match=modern-rock-madness-2025-match-1

Response:
{
  "matchId": "modern-rock-madness-2025-match-1",
  "matchNumber": 1,
  "round": 1,
  "group1": {
    "id": "mrmgroup-foo-2025",
    "artistName": "Foo Fighters",
    "seed": 1,
    "voteCount": 1523
  },
  "group2": {
    "id": "mrmgroup-bar-2025",
    "artistName": "The Black Keys",
    "seed": 16,
    "voteCount": 1204
  },
  "winner": null,  // Set after match closes
  "votingActive": true
}
```

### Getting Bracket Status

```typescript
// Example: Get full tournament bracket
GET /api/contests/mrm/bracket?tournament=modern-rock-madness-2025

Response:
{
  "tournamentId": "modern-rock-madness-2025",
  "year": 2025,
  "status": "active",
  "currentRound": 2,
  "regions": [
    {
      "name": "East",
      "matches": [...],
      "groups": [...]
    },
    ...
  ]
}
```

---

## Migration from Legacy MySQL

### Legacy Tables
- `modern-rock-madness_groups` - Tournament participants
- `modern-rock-madness_matches` - Bracket matchups
- `modern-rock-madness_votes` - Individual votes

### Migration Strategy
1. Create `modernRockMadnessTournament` document in Sanity for each year
2. Create `modern-rock-madnessGroup` documents for all tournament participants
3. Create `modernRockMadnessMatch` documents for all bracket matchups
4. Migrate votes from `modern-rock-madness_votes` to unified `votes` table
5. Update winner references in match documents based on vote counts

---

## Tournament Workflow

### Pre-Tournament Setup
1. Create `modernRockMadnessTournament` document with rounds configured
2. Add all `modern-rock-madnessGroup` documents with seeds and regions
3. Create `modernRockMadnessMatch` documents for first round matchups
4. Set tournament status to `active`

### During Tournament
1. Matches open for voting based on `startsAt` datetime
2. Users vote for their preferred group
3. Real-time vote counts displayed (if `showScore` is true)
4. Match closes at `endsAt` datetime
5. Staff reviews results and sets `winner` in match document
6. Winners advance to next round matches

### Post-Tournament
1. Set final `placement` values on all `modern-rock-madnessGroup` documents
2. Set tournament `status` to `complete`
3. Display championship results and bracket history

---

## Security Considerations

1. **Authentication**: Votes require authenticated users
2. **Rate Limiting**: Prevent vote spamming with rate limits
3. **Validation**: 
   - Verify match is currently active (between `startsAt` and `endsAt`)
   - Verify selected group is actually in the match
4. **Score Visibility**: Respect `showScore` setting when displaying results
5. **Duplicate Prevention**: Database constraints prevent multiple votes per match

---

## Testing

```typescript
// Example test: Verify duplicate vote prevention
test('MRM: Prevents duplicate votes per match', async () => {
  const userId = 'test-user-123';
  const matchId = 'modern-rock-madness-2025-match-1';
  const groupId = 'mrmgroup-foo-2025';
  
  // First vote should succeed
  await submitVote(userId, matchId, groupId);
  
  // Duplicate vote should fail
  await expect(
    submitVote(userId, matchId, groupId)
  ).rejects.toThrow('Duplicate vote');
  
  // Changing vote to other group should also fail
  await expect(
    submitVote(userId, matchId, 'mrmgroup-bar-2025')
  ).rejects.toThrow('Duplicate vote');
});

// Example test: Verify vote time window enforcement
test('MRM: Only accepts votes during active window', async () => {
  const userId = 'test-user-123';
  
  // Vote before match starts should fail
  const futureMatch = await createMatch({
    startsAt: addDays(new Date(), 1),
    endsAt: addDays(new Date(), 2)
  });
  await expect(
    submitVote(userId, futureMatch.id, 'group-1')
  ).rejects.toThrow('Voting not yet open');
  
  // Vote after match ends should fail
  const pastMatch = await createMatch({
    startsAt: subDays(new Date(), 2),
    endsAt: subDays(new Date(), 1)
  });
  await expect(
    submitVote(userId, pastMatch.id, 'group-1')
  ).rejects.toThrow('Voting has closed');
});
```

---

## Performance Considerations

1. **Caching**: Cache tournament/match data from Sanity (refreshed periodically)
2. **Vote Counting**: Use database indexes for fast aggregation
3. **Real-time Updates**: Consider WebSocket connections for live score updates
4. **CDN**: Serve bracket visualizations via CDN for better performance
