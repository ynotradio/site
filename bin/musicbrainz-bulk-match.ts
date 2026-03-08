/* eslint-disable no-console */
/**
 * MusicBrainz Bulk Match Script
 *
 * Finds and optionally fixes missing or inaccurate MusicBrainz IDs
 * for Artists, Songs, and Records in the Payload CMS database.
 *
 * Usage:
 *   yarn musicbrainz:match                          # Dry run for all collections
 *   yarn musicbrainz:match --fix                    # Fix missing MBIDs
 *   yarn musicbrainz:match --collection artists     # Only process artists
 *   yarn musicbrainz:match --verify                 # Also verify existing MBIDs
 *   yarn musicbrainz:match --limit 10               # Process only 10 records per collection
 *   yarn musicbrainz:match --fix --collection songs # Fix missing song MBIDs
 */

import { getPayload, type Payload } from 'payload';
import config from '@payload-config';
import { getArtistMbid, getReleaseMbid, getRecordingMbid } from './migrations/shared/musicbrainz';
import {
  parseArgs,
  getArtistName,
  repairEncoding,
  emptyReport,
  classifyMatch,
  printReport,
  type CliOptions,
  type CollectionReport,
  type MatchResult,
} from './musicbrainz-bulk-match-utils';

// ---------------------------------------------------------------------------
// Core matching logic
// ---------------------------------------------------------------------------

const PAGE_SIZE = 100;

async function processArtists(payload: Payload, options: CliOptions): Promise<CollectionReport> {
  const report = emptyReport('artists');

  const where: Record<string, unknown> = options.verify ? {} : { musicbrainzId: { exists: false } };

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const limit = options.limit ? Math.min(PAGE_SIZE, options.limit - report.processed) : PAGE_SIZE;
    if (limit <= 0) break;

    const result = await payload.find({
      collection: 'artists',
      where,
      limit,
      page,
      sort: 'name',
    });

    report.total = result.totalDocs;

    for (const doc of result.docs) {
      const rawName = (doc as { name: string }).name;
      const name = repairEncoding(rawName);
      const currentMbid = (doc as { musicbrainzId?: string }).musicbrainzId || null;
      const wasRepaired = name !== rawName;
      const displayName = wasRepaired ? `${name} (was: ${rawName})` : name;

      const matchResult: MatchResult = {
        id: doc.id,
        name: displayName,
        currentMbid,
        foundMbid: null,
        status: 'skipped',
        updated: false,
      };

      if (currentMbid && !options.verify) {
        matchResult.status = 'skipped';
      } else {
        const foundMbid = await getArtistMbid(name);
        matchResult.foundMbid = foundMbid;
        matchResult.status = classifyMatch(currentMbid, foundMbid, options.verify, report);

        if (options.fix && foundMbid && matchResult.status === 'matched') {
          await payload.update({
            collection: 'artists',
            id: doc.id,
            data: { musicbrainzId: foundMbid },
          });
          matchResult.updated = true;
          report.updated++;
        }
      }

      report.results.push(matchResult);
      report.processed++;
      if (options.limit && report.processed >= options.limit) break;
    }

    hasMore = result.hasNextPage && (!options.limit || report.processed < options.limit);
    page++;
  }

  return report;
}

async function processRecords(payload: Payload, options: CliOptions): Promise<CollectionReport> {
  const report = emptyReport('records');

  const where: Record<string, unknown> = options.verify ? {} : { musicbrainzId: { exists: false } };

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const limit = options.limit ? Math.min(PAGE_SIZE, options.limit - report.processed) : PAGE_SIZE;
    if (limit <= 0) break;

    const result = await payload.find({
      collection: 'records',
      where,
      limit,
      page,
      depth: 1,
      sort: 'title',
    });

    report.total = result.totalDocs;

    for (const doc of result.docs) {
      const rawTitle = (doc as { title: string }).title;
      const rawArtistName = getArtistName((doc as { artist?: unknown }).artist);
      const title = repairEncoding(rawTitle);
      const artistName = rawArtistName ? repairEncoding(rawArtistName) : null;
      const currentMbid = (doc as { musicbrainzId?: string }).musicbrainzId || null;

      const wasRepaired = title !== rawTitle || artistName !== rawArtistName;
      const displayLabel = artistName ? `${artistName} — ${title}` : title;
      const displayName = wasRepaired ? `${displayLabel} (repaired encoding)` : displayLabel;

      const matchResult: MatchResult = {
        id: doc.id,
        name: displayName,
        currentMbid,
        foundMbid: null,
        status: 'skipped',
        updated: false,
      };

      if (currentMbid && !options.verify) {
        matchResult.status = 'skipped';
      } else {
        // Try with artist first, then fallback to title-only search
        let foundMbid = await getReleaseMbid(title, artistName || undefined);
        if (!foundMbid && artistName) {
          foundMbid = await getReleaseMbid(title);
        }
        matchResult.foundMbid = foundMbid;
        matchResult.status = classifyMatch(currentMbid, foundMbid, options.verify, report);

        if (options.fix && foundMbid && matchResult.status === 'matched') {
          await payload.update({
            collection: 'records',
            id: doc.id,
            data: { musicbrainzId: foundMbid },
          });
          matchResult.updated = true;
          report.updated++;
        }
      }

      report.results.push(matchResult);
      report.processed++;
      if (options.limit && report.processed >= options.limit) break;
    }

    hasMore = result.hasNextPage && (!options.limit || report.processed < options.limit);
    page++;
  }

  return report;
}

async function processSongs(payload: Payload, options: CliOptions): Promise<CollectionReport> {
  const report = emptyReport('songs');

  const where: Record<string, unknown> = options.verify ? {} : { musicbrainzId: { exists: false } };

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const limit = options.limit ? Math.min(PAGE_SIZE, options.limit - report.processed) : PAGE_SIZE;
    if (limit <= 0) break;

    const result = await payload.find({
      collection: 'songs',
      where,
      limit,
      page,
      depth: 1,
      sort: 'title',
    });

    report.total = result.totalDocs;

    for (const doc of result.docs) {
      const rawTitle = (doc as { title: string }).title;
      const rawArtistName = getArtistName((doc as { artist?: unknown }).artist);
      const title = repairEncoding(rawTitle);
      const artistName = rawArtistName ? repairEncoding(rawArtistName) : null;
      const currentMbid = (doc as { musicbrainzId?: string }).musicbrainzId || null;

      const wasRepaired = title !== rawTitle || artistName !== rawArtistName;
      const displayLabel = artistName ? `${artistName} — ${title}` : title;
      const displayName = wasRepaired ? `${displayLabel} (repaired encoding)` : displayLabel;

      const matchResult: MatchResult = {
        id: doc.id,
        name: displayName,
        currentMbid,
        foundMbid: null,
        status: 'skipped',
        updated: false,
      };

      if (currentMbid && !options.verify) {
        matchResult.status = 'skipped';
      } else {
        // Try with artist first, then fallback to title-only search
        let foundMbid = await getRecordingMbid(title, artistName || undefined);
        if (!foundMbid && artistName) {
          foundMbid = await getRecordingMbid(title);
        }
        matchResult.foundMbid = foundMbid;
        matchResult.status = classifyMatch(currentMbid, foundMbid, options.verify, report);

        if (options.fix && foundMbid && matchResult.status === 'matched') {
          await payload.update({
            collection: 'songs',
            id: doc.id,
            data: { musicbrainzId: foundMbid },
          });
          matchResult.updated = true;
          report.updated++;
        }
      }

      report.results.push(matchResult);
      report.processed++;
      if (options.limit && report.processed >= options.limit) break;
    }

    hasMore = result.hasNextPage && (!options.limit || report.processed < options.limit);
    page++;
  }

  return report;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const options = parseArgs(process.argv);

  const mode = options.fix ? '🔧 FIX MODE' : '👀 DRY RUN';
  console.log(`\n🎵 MusicBrainz Bulk Match — ${mode}`);
  console.log(`   Collection: ${options.collection}`);
  console.log(`   Verify existing: ${options.verify ? 'yes' : 'no'}`);
  if (options.limit) {
    console.log(`   Limit: ${options.limit} per collection`);
  }

  const payload = await getPayload({ config });
  const reports: CollectionReport[] = [];

  const collections = options.collection === 'all'
    ? (['artists', 'records', 'songs'] as const)
    : ([options.collection] as const);

  for (const collection of collections) {
    console.log(`\n⏳ Processing ${collection}...`);

    let report: CollectionReport;
    switch (collection) {
      case 'artists':
        report = await processArtists(payload, options);
        break;
      case 'records':
        report = await processRecords(payload, options);
        break;
      case 'songs':
        report = await processSongs(payload, options);
        break;
      default:
        throw new Error(`Unknown collection: ${collection}`);
    }

    printReport(report);
    reports.push(report);
  }

  // Grand total
  if (reports.length > 1) {
    const totals = reports.reduce(
      (acc, r) => ({
        processed: acc.processed + r.processed,
        missing: acc.missing + r.missing,
        matched: acc.matched + r.matched,
        verified: acc.verified + r.verified,
        mismatched: acc.mismatched + r.mismatched,
        notFound: acc.notFound + r.notFound,
        updated: acc.updated + r.updated,
      }),
      {
        processed: 0,
        missing: 0,
        matched: 0,
        verified: 0,
        mismatched: 0,
        notFound: 0,
        updated: 0,
      },
    );

    console.log(`\n${'='.repeat(60)}`);
    console.log('  GRAND TOTAL');
    console.log(`${'='.repeat(60)}`);
    console.log(`  Processed:    ${totals.processed}`);
    console.log(`  Missing MBID: ${totals.missing}`);
    console.log(`  Matched:      ${totals.matched}`);
    console.log(`  Verified:     ${totals.verified}`);
    console.log(`  Mismatched:   ${totals.mismatched}`);
    console.log(`  Not found:    ${totals.notFound}`);
    console.log(`  Updated:      ${totals.updated}`);
  }

  if (!options.fix) {
    console.log('\n💡 This was a dry run. Use --fix to update records.\n');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
