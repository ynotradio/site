#!/usr/bin/env tsx
/* eslint-disable no-await-in-loop */
/**
 * Import the current Top 11 contest from the legacy MySQL database into Payload.
 *
 * Usage:
 *   yarn import:top11 [--from local-mysql|prod-mysql] [--to local-postgres|dev-neon|prod-neon]
 *
 * Defaults: --from local-mysql --to local-postgres. Prod targets require the
 * explicit confirmation env enforced by getPayloadClient.
 *
 * What it imports for the current week (as defined by the legacy `top11`
 * placement-99 date row):
 *   - The contest itself: weekOf, open/closed status (placement 98), the
 *     weekly message (`top11message` HTML -> Lexical, iframes become embeds)
 *   - Chart entries: `top11` placements 1-11 with their movement notes
 *   - The nominee song pool (`top11songs`) as canonical Songs docs
 *   - Votes: legacy stores per-song counters (`top11songs.value`) plus a
 *     separate voter registry (`top11_user_votes`) -- it never stored which
 *     songs a voter picked. One top11-votes doc is created per counted vote.
 *     Real voter identities from the registry are attached one-per-voter (the
 *     song attribution is arbitrary by necessity); remaining vote docs get a
 *     synthetic `legacy-import:<n>` voterUserId. All are marked
 *     voteSource: 'legacy-import'.
 *   - Contestants (`top11contest`, display=yes) and write-ins (`write_in`)
 *
 * Idempotent: aborts if a contest for the legacy week already exists.
 */

import * as mysql from 'mysql2/promise';
import type { Payload } from 'payload';
import {
  getPayloadClient,
  findOrCreateArtist,
  findOrCreateSong,
} from './shared/payloadClient';
import type { PostgresTarget } from './shared/payloadClient';
import { createLogger } from './shared/logger';
import { convertTextToLexical } from './shared/importUtils';
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';
import { getMySQLConfig, type MySQLSource } from '../../config/databases';

const logger = createLogger('Top11Import');

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

interface ContestantRow {
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  contest: string;
  newsletter: string;
}

interface WriteInRow {
  write_in: string;
}

interface UserVoteRow {
  user_email: string;
  user_auth0_id: string | null;
}

interface ImportOptions {
  from: MySQLSource;
  to: PostgresTarget;
}

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = { from: 'local-mysql', to: 'local-postgres' };

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
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: yarn import:top11 [--from local-mysql|prod-mysql]'
          + ' [--to local-postgres|dev-neon|prod-neon]',
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

async function importSongPool(
  payload: Payload,
  nominees: NomineeRow[],
): Promise<Map<number, number>> {
  const songIdByLegacyId = new Map<number, number>();
  for (const nominee of nominees) {
    const artistId = await findOrCreateArtist(payload, nominee.artist);
    const songId = await findOrCreateSong(payload, nominee.song, artistId);
    songIdByLegacyId.set(nominee.id, songId);
  }
  return songIdByLegacyId;
}

async function importVotes(
  payload: Payload,
  contestId: number,
  nominees: NomineeRow[],
  songIdByLegacyId: Map<number, number>,
  voters: UserVoteRow[],
): Promise<{ created: number; errors: number; unassignedVoters: number }> {
  // One slot per counted legacy vote. Real voters fill the first slots
  // (one each -- the new model allows one vote per voter); the rest are
  // synthetic. Song attribution for real voters is arbitrary: the legacy
  // schema never linked voters to songs.
  const slots: number[] = [];
  nominees.forEach((nominee) => {
    const songId = songIdByLegacyId.get(nominee.id);
    if (!songId) return;
    for (let i = 0; i < nominee.value; i += 1) {
      slots.push(songId);
    }
  });

  let created = 0;
  let errors = 0;

  for (let i = 0; i < slots.length; i += 1) {
    const voter = voters[i];
    const identity = voter
      ? {
        voterEmail: voter.user_email.trim().toLowerCase(),
        voterAuth0Id: voter.user_auth0_id?.trim() || undefined,
      }
      : { voterUserId: `legacy-import:${i + 1}` };

    try {
      await payload.create({
        collection: 'top11-votes',
        data: {
          contest: contestId,
          song: slots[i],
          voteSource: 'legacy-import',
          ...identity,
        },
      });
      created += 1;
    } catch (err) {
      errors += 1;
      logger.warn(`Vote ${i + 1}/${slots.length} failed: ${(err as Error).message}`);
    }
  }

  const unassignedVoters = Math.max(voters.length - slots.length, 0);
  if (unassignedVoters > 0) {
    logger.warn(
      `${unassignedVoters} registered voters exceed the counted votes and were not imported`,
    );
  }

  return { created, errors, unassignedVoters };
}

async function main(): Promise<void> {
  const options = parseArgs();
  logger.info(`Importing Top 11 from ${options.from} to ${options.to}`);

  const connection = await mysql.createConnection(getMySQLConfig(options.from));

  try {
    const [chartRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT placement, artist, song, note FROM top11 ORDER BY placement',
    );
    const [messageRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT message FROM top11message WHERE id = 1',
    );
    const [nomineeRows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT id, artist, song, value FROM top11songs WHERE deleted = 'n' ORDER BY id",
    );
    const [contestantRows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT firstname, lastname, email, phone, contest, newsletter FROM top11contest WHERE display = 'yes' ORDER BY id",
    );
    const [writeInRows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT write_in FROM write_in WHERE deleted = 'no' ORDER BY id",
    );

    const statusRow = (chartRows as ChartRow[]).find((row) => row.placement === 98);
    const dateRow = (chartRows as ChartRow[]).find((row) => row.placement === 99);
    if (!dateRow?.artist) {
      throw new Error('Legacy top11 table has no date row (placement 99)');
    }

    // The voter registry keys the voting period by the placement-99 date string.
    const [voterRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT user_email, user_auth0_id FROM top11_user_votes WHERE voting_period = ? ORDER BY id',
      [dateRow.artist],
    );

    const chart = (chartRows as ChartRow[])
      .filter((row) => row.placement >= 1 && row.placement <= 11)
      .sort((a, b) => a.placement - b.placement);
    if (chart.length === 0) {
      throw new Error('Legacy top11 table has no chart entries (placements 1-11)');
    }

    const legacyStatus = statusRow?.artist === 'open' ? 'open' : 'closed';
    const weekOf = parseWeekOf(dateRow.artist);
    logger.info(
      `Legacy contest: week of ${dateRow.artist}, voting ${legacyStatus}, `
        + `${chart.length} chart entries, ${nomineeRows.length} nominees, `
        + `${voterRows.length} registered voters, ${contestantRows.length} contestants, `
        + `${writeInRows.length} write-ins`,
    );

    const payload = await getPayloadClient(options.to);

    const existing = await payload.find({
      collection: 'top11-contests',
      where: { weekOf: { equals: weekOf } },
      limit: 1,
      depth: 0,
    });
    if (existing.docs.length > 0) {
      logger.warn(
        `Contest for ${weekOf} already exists (id ${existing.docs[0].id}) -- aborting. `
          + 'Delete it first to re-import.',
      );
      return;
    }

    const entries = [];
    for (const row of chart) {
      const artistId = await findOrCreateArtist(payload, row.artist);
      const songId = await findOrCreateSong(payload, row.song, artistId);
      entries.push({
        song: songId,
        ...(row.note?.trim() ? { weeklyNote: convertTextToLexical(row.note.trim()) } : {}),
      });
    }

    // Created open so the vote-creation hook accepts imported votes; the
    // real legacy status is applied after votes land.
    const contest = await payload.create({
      collection: 'top11-contests',
      data: {
        weekOf,
        status: 'open',
        messageSnapshot: {
          headline: `Top 11 @ 11 for ${dateRow.artist}`,
          body: convertHtmlToLexicalEnhanced(String(messageRows[0]?.message ?? '')),
        },
        entries,
      },
    });
    const contestId = contest.id as number;
    logger.info(`Created contest ${contestId} for week of ${dateRow.artist}`);

    const songIdByLegacyId = await importSongPool(payload, nomineeRows as NomineeRow[]);
    logger.info(`Song pool ready: ${songIdByLegacyId.size} nominee songs`);

    const voteResult = await importVotes(
      payload,
      contestId,
      nomineeRows as NomineeRow[],
      songIdByLegacyId,
      voterRows as UserVoteRow[],
    );
    logger.info(`Votes: ${voteResult.created} created, ${voteResult.errors} failed`);

    let contestantsCreated = 0;
    let contestantsSkipped = 0;
    for (const row of contestantRows as ContestantRow[]) {
      try {
        await payload.create({
          collection: 'top11-contestants',
          data: {
            contest: contestId,
            firstName: row.firstname,
            lastName: row.lastname,
            email: row.email.trim().toLowerCase(),
            phone: row.phone || undefined,
            enteredContest: row.contest === 'yes',
            newsletterOptIn: row.newsletter === 'yes',
            display: true,
          },
        });
        contestantsCreated += 1;
      } catch (err) {
        contestantsSkipped += 1;
        logger.warn(`Contestant ${row.email} skipped: ${(err as Error).message}`);
      }
    }
    logger.info(`Contestants: ${contestantsCreated} created, ${contestantsSkipped} skipped`);

    let writeInsCreated = 0;
    for (const row of writeInRows as WriteInRow[]) {
      await payload.create({
        collection: 'top11-write-ins',
        data: {
          contest: contestId,
          writeIn: row.write_in,
          display: true,
        },
      });
      writeInsCreated += 1;
    }
    logger.info(`Write-ins: ${writeInsCreated} created`);

    if (legacyStatus !== 'open') {
      await payload.update({
        collection: 'top11-contests',
        id: contestId,
        data: { status: 'closed' },
      });
      logger.info('Contest status set to closed to match legacy');
    }

    logger.info('Top 11 import complete');
  } finally {
    await connection.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(`Top 11 import failed: ${(err as Error).message}`);
    process.exit(1);
  });
