#!/usr/bin/env tsx
/**
 * Backfill OnDemand song relationships from legacy MySQL free-text lists.
 *
 * Usage:
 *   tsx bin/migrations/backfillOnDemandSongs.ts --from prod-mysql --to prod-neon --dry-run
 */

import type { Payload } from 'payload';
import * as mysql from 'mysql2/promise';
import { getActiveOnDemand } from './database';
import {
  getPayloadClient,
  findOrCreateArtist,
  findOrCreateSong,
  type PostgresTarget,
} from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import {
  extractArtistCandidates,
  formatSongPreviewTitles,
  parseLegacySongList,
} from './shared/ondemandSongs';
import { getMySQLConfig, parseFromToArgs, type MySQLSource } from '../../config/databases';

const logger = createLogger('OnDemandSongsBackfill');

interface BackfillOptions {
  from: MySQLSource;
  to: PostgresTarget;
  dryRun: boolean;
  limit?: number;
  startId?: number;
}

interface BackfillStats {
  total: number;
  eligible: number;
  skipped: number;
  alreadyLinked: number;
  updated: number;
  createdSongs: number;
  reusedSongs: number;
  warnings: number;
}

interface PreviewRow {
  legacyId: number;
  headline: string;
  artist: string;
  songs: string[];
  status: 'ready' | 'already-linked' | 'skipped' | 'warning';
  note?: string;
  createdSongs: number;
  reusedSongs: number;
}

function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2);
  const { from, to } = parseFromToArgs(args);
  const options: BackfillOptions = {
    from,
    to,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--limit') {
      const limit = parseInt(args[i + 1], 10);
      if (Number.isNaN(limit) || limit < 1) {
        throw new Error('--limit must be a positive number');
      }
      options.limit = limit;
      i += 1;
    } else if (arg === '--start-id') {
      const startId = parseInt(args[i + 1], 10);
      if (Number.isNaN(startId) || startId < 0) {
        throw new Error('--start-id must be a positive number');
      }
      options.startId = startId;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx bin/migrations/backfillOnDemandSongs.ts [options]

Options:
  --from SOURCE    Source MySQL: 'local-mysql' (default) or 'prod-mysql'
  --to TARGET      Target Postgres: 'prod-neon' (default), 'dev-neon', or 'local-postgres'
  --start-id ID    Optional ID to start from
  --limit N        Limit records processed
  --dry-run        Preview updates without writing
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/backfillOnDemandSongs.ts --from prod-mysql --to prod-neon --dry-run
  tsx bin/migrations/backfillOnDemandSongs.ts --from prod-mysql --to prod-neon --start-id 500
      `);
      process.exit(0);
    }
  }

  return options;
}

async function findArtistByName(payload: Payload, name: string): Promise<number | null> {
  const existing = await payload.find({
    collection: 'artists',
    where: {
      name: {
        equals: name,
      },
    },
    limit: 1,
    depth: 0,
  });

  return existing.docs.length > 0 ? (existing.docs[0].id as number) : null;
}

function getCurrentSongTitles(doc: Record<string, unknown>): string[] {
  const current = Array.isArray(doc.songs) ? doc.songs : [];
  return current
    .map((song) => {
      if (typeof song === 'object' && song !== null && 'title' in song) {
        return String((song as { title?: unknown }).title ?? '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

function getCurrentSongIds(doc: Record<string, unknown>): number[] {
  const current = Array.isArray(doc.songs) ? doc.songs : [];
  return current
    .map((song) => {
      if (typeof song === 'object' && song !== null && 'id' in song) {
        const id = Number((song as { id?: unknown }).id);
        return Number.isNaN(id) ? null : id;
      }
      const id = Number(song);
      return Number.isNaN(id) ? null : id;
    })
    .filter((id): id is number => id !== null);
}

async function findSongByTitleAndArtist(
  payload: Payload,
  title: string,
  artistId?: number,
): Promise<number | null> {
  let where: Record<string, unknown>;
  if (artistId !== undefined) {
    where = {
      and: [{ title: { equals: title } }, { artist: { equals: artistId } }],
    };
  } else {
    where = { title: { equals: title } };
  }

  const existing = await payload.find({
    collection: 'songs',
    where,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  return existing.docs.length > 0 ? (existing.docs[0].id as number) : null;
}

async function resolveArtist(
  payload: Payload,
  doc: Record<string, unknown>,
  dryRun: boolean,
): Promise<{
    artistId?: number;
    artistName: string;
    source: 'relation' | 'name' | 'would-create' | 'created' | 'none';
    warning?: string;
  }> {
  const candidates = extractArtistCandidates({
    artists: doc.artists,
    artistsText: typeof doc.artistsText === 'string' ? doc.artistsText : null,
    headline: typeof doc.headline === 'string' ? doc.headline : null,
  });

  if (candidates.length === 0) {
    return {
      artistName: String(doc.headline ?? '').trim(),
      source: 'none',
      warning: 'No artist candidates found',
    };
  }

  for (const candidate of candidates) {
    const foundId = candidate.id ?? (await findArtistByName(payload, candidate.name));
    if (foundId !== null && foundId !== undefined) {
      return {
        artistId: foundId,
        artistName: candidate.name,
        source: candidate.id ? 'relation' : 'name',
      };
    }
  }

  const fallback = candidates[0];
  if (dryRun) {
    return {
      artistName: fallback.name,
      source: 'would-create',
      warning: 'Artist does not exist yet and would be created',
    };
  }

  const artistId = await findOrCreateArtist(payload, fallback.name);
  return {
    artistId,
    artistName: fallback.name,
    source: 'created',
  };
}

async function backfillOnDemandSongs(options: BackfillOptions): Promise<void> {
  logger.info('Starting OnDemand song backfill...');
  logger.info(`Source: ${options.from}`);
  logger.info(`Target: ${options.to}`);
  if (options.dryRun) {
    logger.info('Dry run enabled; no changes will be written.');
  }
  if (options.startId) {
    logger.info(`Starting from legacy ID: ${options.startId}`);
  }

  const stats: BackfillStats = {
    total: 0,
    eligible: 0,
    skipped: 0,
    alreadyLinked: 0,
    updated: 0,
    createdSongs: 0,
    reusedSongs: 0,
    warnings: 0,
  };

  const previews: PreviewRow[] = [];
  let mysqlConnection: mysql.Connection | undefined;
  let payload: Payload | undefined;

  try {
    logger.info(`Connecting to MySQL (${options.from})...`);
    const mysqlConfig = getMySQLConfig(options.from);
    mysqlConnection = await mysql.createConnection(mysqlConfig);

    logger.info(`Connecting to Payload (${options.to})...`);
    payload = await getPayloadClient(options.to);

    const legacyItems = await getActiveOnDemand(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = legacyItems.length;
    logger.info(`Found ${stats.total} legacy on-demand records`);

    for (let i = 0; i < legacyItems.length; i += 1) {
      const legacyItem = legacyItems[i];
      const parsed = parseLegacySongList(legacyItem.songs);

      if (parsed.reason) {
        stats.skipped += 1;
        previews.push({
          legacyId: legacyItem.id,
          headline: legacyItem.headline,
          artist: legacyItem.headline,
          songs: [],
          status: 'skipped',
          note:
            parsed.reason === 'placeholder' ? 'Non-song placeholder value' : 'No importable songs',
          createdSongs: 0,
          reusedSongs: 0,
        });
      } else {
        stats.eligible += 1;

        const targetDocResult = await payload.find({
          collection: 'ondemand',
          where: {
            legacyId: {
              equals: legacyItem.id,
            },
          },
          depth: 1,
          limit: 1,
          overrideAccess: true,
        });

        if (targetDocResult.docs.length === 0) {
          stats.warnings += 1;
          previews.push({
            legacyId: legacyItem.id,
            headline: legacyItem.headline,
            artist: legacyItem.headline,
            songs: parsed.titles,
            status: 'warning',
            note: 'Imported Payload record not found',
            createdSongs: 0,
            reusedSongs: 0,
          });
        } else {
          const targetDoc = targetDocResult.docs[0] as Record<string, unknown>;
          const currentSongTitles = getCurrentSongTitles(targetDoc);
          const currentSongIds = getCurrentSongIds(targetDoc);
          const normalizedCurrentSongTitles = currentSongTitles.map((title) => title.toLowerCase());
          const missingTitles = parsed.titles.filter(
            (title) => !normalizedCurrentSongTitles.includes(title.toLowerCase()),
          );

          if (missingTitles.length === 0) {
            stats.alreadyLinked += 1;
            previews.push({
              legacyId: legacyItem.id,
              headline: legacyItem.headline,
              artist: String(targetDoc.artistsText ?? legacyItem.headline).trim(),
              songs: currentSongTitles,
              status: 'already-linked',
              note: 'Songs already linked',
              createdSongs: 0,
              reusedSongs: 0,
            });
          } else {
            const artist = await resolveArtist(payload, targetDoc, options.dryRun);
            const resolvedArtistName = artist.artistName || legacyItem.headline;

            if (artist.source === 'none') {
              stats.warnings += 1;
              previews.push({
                legacyId: legacyItem.id,
                headline: legacyItem.headline,
                artist: resolvedArtistName,
                songs: missingTitles,
                status: 'warning',
                note: artist.warning ?? 'No artist candidates found',
                createdSongs: 0,
                reusedSongs: 0,
              });
            } else {
              const songIds: number[] = [...currentSongIds];
              let createdSongs = 0;
              let reusedSongs = 0;

              if (options.dryRun) {
                for (const title of missingTitles) {
                  const existingSongId = await findSongByTitleAndArtist(
                    payload,
                    title,
                    artist.artistId,
                  );
                  if (existingSongId !== null) {
                    reusedSongs += 1;
                  } else {
                    createdSongs += 1;
                  }
                }
              } else {
                for (const title of missingTitles) {
                  const existingSongId = await findSongByTitleAndArtist(
                    payload,
                    title,
                    artist.artistId,
                  );
                  if (existingSongId !== null) {
                    songIds.push(existingSongId);
                    reusedSongs += 1;
                  } else {
                    const songId = await findOrCreateSong(payload, title, artist.artistId);
                    songIds.push(songId);
                    createdSongs += 1;
                  }
                }

                await payload.update({
                  collection: 'ondemand',
                  id: targetDoc.id as number | string,
                  data: {
                    songs: songIds,
                  },
                  overrideAccess: true,
                });

                stats.updated += 1;
              }

              stats.createdSongs += createdSongs;
              stats.reusedSongs += reusedSongs;

              let previewSongs = missingTitles;
              let previewNote = artist.warning;
              if (currentSongTitles.length > 0) {
                previewSongs = [...currentSongTitles, ...missingTitles];
                previewNote = 'Partially linked; adding missing songs';
              }

              previews.push({
                legacyId: legacyItem.id,
                headline: legacyItem.headline,
                artist: resolvedArtistName,
                songs: previewSongs,
                status: 'ready',
                note: previewNote,
                createdSongs,
                reusedSongs,
              });
            }
          }
        }
      }

      if ((i + 1) % 10 === 0 || i === legacyItems.length - 1) {
        logProgress(i + 1, legacyItems.length, `OnDemand ${legacyItem.id}`);
      }
    }
  } catch (error) {
    logger.error('OnDemand song backfill failed', error as Error);
    throw error;
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      logger.info('MySQL connection closed');
    }
  }

  logSummary({
    total: stats.total,
    success: stats.updated,
    skipped: stats.skipped + stats.alreadyLinked + stats.warnings,
    errors: 0,
  });

  if (options.dryRun) {
    logger.info('Dry run preview:');
    previews.slice(0, 25).forEach((row) => {
      const songPreview = formatSongPreviewTitles(row.songs);
      const suffix = row.note ? ` (${row.note})` : '';
      logger.info(`[${row.status}] ${row.legacyId} ${row.artist} — ${songPreview || '(no songs)'}${suffix}`);
    });
    logger.info(`Would update ${stats.eligible - stats.alreadyLinked - stats.warnings} OnDemand records.`);
    logger.info(`Would create ${stats.createdSongs} songs and reuse ${stats.reusedSongs} existing songs.`);
  } else {
    logger.info(`Updated ${stats.updated} OnDemand records with song relationships.`);
    logger.info(`Created ${stats.createdSongs} songs and reused ${stats.reusedSongs} existing songs.`);
  }

  logger.info('OnDemand song backfill completed');
}

function isMainModule(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return import.meta.url === `file://${process.argv[1]}`;
  }
  return require.main === module;
}

if (isMainModule()) {
  const options = parseArgs();
  backfillOnDemandSongs(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export {
  backfillOnDemandSongs,
  parseArgs,
  findArtistByName,
  resolveArtist,
};
