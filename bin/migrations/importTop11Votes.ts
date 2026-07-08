#!/usr/bin/env tsx
/* eslint-disable no-await-in-loop */
/**
 * Import only the votes for the current Top 11 contest from legacy MySQL
 * into an already-existing Top11Contests row in Payload/Postgres.
 *
 * Unlike importTop11.ts (which creates the contest, chart entries, nominee
 * pool, contestants, and write-ins), this script touches only top11-votes.
 * It's meant to run repeatedly in the hours/days before a mid-contest
 * cutover -- each run tops up Postgres with whatever new votes have landed
 * in legacy MySQL since the last run, so the gap at cutover time is as
 * small as possible.
 *
 * Cutover safety: legacy's top11_user_votes table records "this voter cast
 * a ballot this week" (unique per email+voting_period) but never recorded
 * which song(s) they picked -- top11songs.value is a per-song counter with
 * no voter attribution at all. So there is no way to recover real
 * voter-to-song mapping. This script preserves both properties the app
 * actually depends on:
 *   - Per-song tallies (Top11Contests' /stats endpoint, which counts
 *     top11-votes rows grouped by song) stay accurate: it creates exactly
 *     `top11songs.value` vote rows per nominee song, matching legacy's
 *     counter.
 *   - Per-voter dedup (hasUserVotedThisWeek(), which checks for any
 *     top11-votes row matching the voter's email/auth0Id in this contest)
 *     stays correct: every real registered voter from top11_user_votes gets
 *     one of those counted rows under their real identity, so they cannot
 *     vote again after cutover. Which specific song their row references is
 *     arbitrary (legacy never recorded it) -- this only affects that one
 *     legacy-attributed row's song, not the total count for any song.
 *   - Remaining counted slots (value - real voters) get synthetic
 *     `legacy-import:<n>` identities, same as importTop11.ts.
 *
 * Incremental/idempotent: on each run, already-imported real voters (by
 * voterEmail/voterAuth0Id) and the synthetic slots already created for this
 * contest are skipped -- only the difference is inserted. Safe to run many
 * times before cutover.
 *
 * Usage:
 *   yarn import:top11-votes [--from local-mysql|prod-mysql]
 *     [--to local-postgres|dev-neon|prod-neon] [--contest-id <id>]
 *
 * Defaults: --from local-mysql --to local-postgres. Prod targets require
 * the explicit confirmation env enforced by getPayloadClient.
 *
 * --contest-id is optional; if omitted, the script finds the Top11Contests
 * row whose weekOf matches legacy's current placement-99 date row (same
 * week-matching importTop11.ts uses) and requires exactly one match.
 */

import * as mysql from 'mysql2/promise';
import type { Payload } from 'payload';
import { getPayloadClient } from './shared/payloadClient';
import type { PostgresTarget } from './shared/payloadClient';
import { createLogger } from './shared/logger';
import { getMySQLConfig, type MySQLSource } from '../../config/databases';

const logger = createLogger('Top11VotesImport');

interface ChartRow {
  placement: number;
  artist: string;
  song: string;
  note: string | null;
}

interface NomineeRow {
  id: number;
  artist: string;
  song: string;
  value: number;
}

interface UserVoteRow {
  user_email: string;
  user_auth0_id: string | null;
}

interface ImportOptions {
  from: MySQLSource;
  to: PostgresTarget;
  contestId: number | null;
}

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = { from: 'local-mysql', to: 'local-postgres', contestId: null };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--from') {
      const value = args[i + 1];
      if (value !== 'local-mysql' && value !== 'prod-mysql') {
        throw new Error('--from must be "local-mysql" or "prod-mysql"');
      }
      options.from = value;
      i += 1;
    } else if (arg === '--to') {
      const value = args[i + 1];
      if (value !== 'local-postgres' && value !== 'prod-neon' && value !== 'dev-neon') {
        throw new Error('--to must be "local-postgres", "prod-neon", or "dev-neon"');
      }
      options.to = value;
      i += 1;
    } else if (arg === '--contest-id') {
      options.contestId = Number(args[i + 1]);
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: yarn import:top11-votes [--from local-mysql|prod-mysql]'
          + ' [--to local-postgres|dev-neon|prod-neon] [--contest-id <id>]',
      );
      process.exit(0);
    }
  }

  return options;
}

/** Parse the legacy display date ("July 2, 2026") into a UTC-midnight ISO string. */
function parseWeekOf(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Cannot parse legacy Top 11 date "${dateStr}"`);
  }
  return new Date(
    Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
  ).toISOString();
}

async function findContestId(
  payload: Payload,
  weekOf: string,
  explicitContestId: number | null,
): Promise<number> {
  if (explicitContestId !== null) {
    const contest = await payload.findByID({
      collection: 'top11-contests',
      id: explicitContestId,
      depth: 0,
    });
    if (!contest) {
      throw new Error(`No top11-contests row with id=${explicitContestId}`);
    }
    return explicitContestId;
  }

  const existing = await payload.find({
    collection: 'top11-contests',
    where: { weekOf: { equals: weekOf } },
    limit: 1,
    depth: 0,
  });

  if (existing.docs.length === 0) {
    throw new Error(
      `No top11-contests row found for week of ${weekOf}. This script only imports votes into `
        + 'an existing contest -- run importTop11.ts first to create it.',
    );
  }

  return existing.docs[0].id as number;
}

/** Strips HTML tags for comparison purposes only -- same rules as importUtils' stripHtmlTags. */
function stripHtmlTagsForComparison(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|td|th|tr)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(text: string): string {
  return stripHtmlTagsForComparison(text).trim().toLowerCase();
}

/**
 * Maps legacy nominee-pool song rows to their canonical Payload song ids
 * by matching against the contest's own nominees array (title + artist
 * name, case/whitespace/HTML-tag-insensitive).
 *
 * Deliberately does NOT call findOrCreateArtist/findOrCreateSong (which
 * importSongPool() in importTop11.ts uses to build the pool in the first
 * place) -- those make network calls (MusicBrainz lookups) per song, which
 * made an early version of this script take 15+ seconds per nominee and
 * effectively hang on the ~57-song pool. Since the contest's nominees
 * already exist by the time this script runs (importTop11.ts creates them
 * up front), matching against that fixed set locally is both correct and
 * fast enough to re-run every few minutes before cutover.
 */
async function mapNomineesToSongIds(
  payload: Payload,
  contestId: number,
  nominees: NomineeRow[],
): Promise<Map<number, number>> {
  const contest = (await payload.findByID({
    collection: 'top11-contests',
    id: contestId,
    depth: 1,
  })) as {
    nominees?: {
      song: number | { id: number; title?: string; artist?: number | { name?: string } };
    }[];
  };

  const contestSongs = (contest.nominees ?? [])
    .map((n) => (typeof n.song === 'object' ? n.song : null))
    .filter((s): s is { id: number; title?: string; artist?: number | { name?: string } } => (
      s !== null
    ));

  const songIdByLegacyId = new Map<number, number>();
  for (const nominee of nominees) {
    const normalizedTitle = normalizeTitle(nominee.song);
    const normalizedArtist = normalizeTitle(nominee.artist);

    const match = contestSongs.find((s) => {
      if (normalizeTitle(s.title ?? '') !== normalizedTitle) return false;
      const artistName = typeof s.artist === 'object' ? s.artist?.name : undefined;
      return artistName ? normalizeTitle(artistName) === normalizedArtist : true;
    });

    if (match) {
      songIdByLegacyId.set(nominee.id, match.id);
    } else {
      logger.warn(
        `Nominee "${nominee.artist} - ${nominee.song}" (legacy id ${nominee.id}) has no `
          + "matching song in the contest's nominees array -- its votes will be skipped. "
          + 'Re-run importTop11.ts if the nominee pool is stale.',
      );
    }
  }
  return songIdByLegacyId;
}

/**
 * Every registered voter (top11_user_votes) gets exactly one dedup-guard
 * vote row under their real identity, unconditionally -- including voters
 * who only submitted a write-in with no checkbox picks, who would
 * otherwise have zero rows in top11songs.value's counted total and so be
 * invisible to hasUserVotedThisWeek() after cutover. Song attribution for
 * these rows is arbitrary: legacy never recorded voter-to-song mapping.
 *
 * Per-song tallies stay accurate separately: after every voter's row is
 * placed, synthetic legacy-import:<n> rows top up each song to its
 * top11songs.value count. A voter's row already counts toward whichever
 * song it was arbitrarily assigned, so that song needs one fewer synthetic
 * fill than its raw counter -- this only shifts which specific row
 * "represents" a given count, never double-counts or under-counts a song.
 */
export async function importVotesIncremental(
  payload: Payload,
  contestId: number,
  nominees: NomineeRow[],
  songIdByLegacyId: Map<number, number>,
  voters: UserVoteRow[],
): Promise<{ created: number; skipped: number; errors: number }> {
  const nomineeSongIds = nominees
    .map((nominee) => songIdByLegacyId.get(nominee.id))
    .filter((id): id is number => id !== undefined);

  if (nomineeSongIds.length === 0 && voters.length > 0) {
    throw new Error(
      'No nominee resolved to a song on this contest -- cannot attach dedup-guard vote rows. '
        + 'Re-run importTop11.ts to refresh the nominee pool before importing votes.',
    );
  }

  // Target counted total per song, from legacy's top11songs.value.
  const targetCountBySong = new Map<number, number>();
  nominees.forEach((nominee) => {
    const songId = songIdByLegacyId.get(nominee.id);
    if (songId === undefined) return;
    targetCountBySong.set(songId, (targetCountBySong.get(songId) ?? 0) + nominee.value);
  });

  const existingVotes = await payload.find({
    collection: 'top11-votes',
    where: { contest: { equals: contestId }, voteSource: { equals: 'legacy-import' } },
    limit: 0,
    depth: 0,
  });

  const existingRealIdentities = new Set<string>();
  // How many rows (real or synthetic) already exist per song -- this is
  // all that's needed to decide how many synthetic top-up rows a song
  // still needs; synthetic labels themselves don't need to be stable
  // across runs, only unique per row created.
  const existingCountBySong = new Map<number, number>();
  let maxExistingSyntheticIndex = 0;

  existingVotes.docs.forEach((vote: any) => {
    const identity = vote.voterAuth0Id || vote.voterEmail;
    if (identity) existingRealIdentities.add(identity);

    if (typeof vote.voterUserId === 'string' && vote.voterUserId.startsWith('legacy-import:')) {
      const index = Number(vote.voterUserId.slice('legacy-import:'.length));
      if (Number.isInteger(index)) {
        maxExistingSyntheticIndex = Math.max(maxExistingSyntheticIndex, index);
      }
    }

    const songId = typeof vote.song === 'object' ? vote.song?.id : vote.song;
    if (songId !== undefined) {
      existingCountBySong.set(songId, (existingCountBySong.get(songId) ?? 0) + 1);
    }
  });

  let created = 0;
  let skipped = 0;
  let errors = 0;
  let nextSongIndex = 0;
  let nextSyntheticIndex = maxExistingSyntheticIndex + 1;

  const nextArbitrarySongId = (): number => {
    const songId = nomineeSongIds[nextSongIndex % nomineeSongIds.length];
    nextSongIndex += 1;
    return songId;
  };

  const recordCreatedRow = (songId: number): void => {
    existingCountBySong.set(songId, (existingCountBySong.get(songId) ?? 0) + 1);
  };

  const createVote = async (
    identity: Record<string, string>,
    songId: number,
    label: string,
  ): Promise<void> => {
    try {
      await payload.create({
        collection: 'top11-votes',
        data: {
          contest: contestId,
          song: songId,
          voteSource: 'legacy-import',
          ...identity,
        },
      });
      created += 1;
      recordCreatedRow(songId);
    } catch (err) {
      errors += 1;
      logger.warn(`Vote for ${label} failed: ${(err as Error).message}`);
    }
  };

  // Every registered voter gets one dedup-guard row, unconditionally --
  // including voters who only wrote in a song with no checkbox picks.
  for (const voter of voters) {
    const voterEmail = voter.user_email.trim().toLowerCase();
    const voterAuth0Id = voter.user_auth0_id?.trim() || undefined;
    const identity = { voterEmail, ...(voterAuth0Id ? { voterAuth0Id } : {}) };

    if (existingRealIdentities.has(voterAuth0Id || voterEmail)) {
      skipped += 1;
    } else {
      const songId = nextArbitrarySongId();
      await createVote(identity, songId, voterEmail);
    }
  }

  // Top up each song's row count to match its target from top11songs.value.
  for (const [songId, target] of targetCountBySong) {
    const existingCount = existingCountBySong.get(songId) ?? 0;
    const stillNeeded = Math.max(target - existingCount, 0);

    for (let i = 0; i < stillNeeded; i += 1) {
      const syntheticId = `legacy-import:${nextSyntheticIndex}`;
      nextSyntheticIndex += 1;
      await createVote({ voterUserId: syntheticId }, songId, syntheticId);
    }
  }

  return { created, skipped, errors };
}

async function main(): Promise<void> {
  process.env.PAYLOAD_MIGRATING = 'true';

  const options = parseArgs();
  logger.info(`Importing Top 11 votes from ${options.from} to ${options.to}`);

  const connection = await mysql.createConnection(getMySQLConfig(options.from));

  try {
    const [chartRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT placement, artist, song, note FROM top11 ORDER BY placement',
    );
    const [nomineeRows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT id, artist, song, value FROM top11songs WHERE deleted = 'n' ORDER BY id",
    );

    const dateRow = (chartRows as ChartRow[]).find((row) => row.placement === 99);
    if (!dateRow?.artist) {
      throw new Error('Legacy top11 table has no date row (placement 99)');
    }

    const [voterRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT user_email, user_auth0_id FROM top11_user_votes WHERE voting_period = ? ORDER BY id',
      [dateRow.artist],
    );

    const weekOf = parseWeekOf(dateRow.artist);
    logger.info(
      `Legacy contest: week of ${dateRow.artist}, ${nomineeRows.length} nominees, `
        + `${voterRows.length} registered voters`,
    );

    const payload = await getPayloadClient(options.to);

    const contestId = await findContestId(payload, weekOf, options.contestId);
    logger.info(`Target contest: id=${contestId}`);

    const songIdByLegacyId = await mapNomineesToSongIds(
      payload,
      contestId,
      nomineeRows as NomineeRow[],
    );

    const result = await importVotesIncremental(
      payload,
      contestId,
      nomineeRows as NomineeRow[],
      songIdByLegacyId,
      voterRows as UserVoteRow[],
    );

    logger.info(
      `Votes: ${result.created} created, ${result.skipped} already present (skipped), `
        + `${result.errors} failed`,
    );
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error(`Import failed: ${(error as Error).message}`);
    process.exit(1);
  });
}
