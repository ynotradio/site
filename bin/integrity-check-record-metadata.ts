/* eslint-disable no-console */
/**
 * Record Metadata Integrity Check
 *
 * Checks imported Records for missing label, releaseDate, and coverImage.
 * Queries MusicBrainz to find correct values and optionally applies fixes.
 *
 * Usage:
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-record-metadata.ts [options]
 *
 * Options:
 *   --fix           Apply fixes (default is dry-run / check-only)
 *   --limit <N>     Process at most N records
 *   --output <file> Write markdown report to file
 *   --verbose       Show detailed logging
 */

import { getPayload, type Payload } from 'payload';
import config from '@payload-config';
import {
  getReleaseMbid,
  getReleaseDetails,
  getCoverArtByMbid,
} from './migrations/shared/musicbrainz';
import { importImageFromUrl } from './migrations/shared/mediaImporter';
import { repairEncoding, getArtistName } from './musicbrainz-bulk-match-utils';
import {
  parseArgs,
  emptyReport,
  addResult,
  printCheckReport,
  writeReport,
  type CheckResult,
  type IntegrityReport,
} from './content-integrity-utils';
import {
  normalizeMbDate,
  buildFieldResults,
  type RecordCheckContext,
  type MbLookupResult,
} from './integrity-check-record-metadata-utils';

const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// MB resolution
// ---------------------------------------------------------------------------

async function resolveMbid(ctx: RecordCheckContext): Promise<MbLookupResult> {
  let mbid = ctx.musicbrainzId;
  let mbidSource: MbLookupResult['mbidSource'] = 'none';

  if (mbid) {
    mbidSource = 'existing';
  } else if (ctx.title && ctx.artistName) {
    const repairedTitle = repairEncoding(ctx.title);
    const repairedArtist = repairEncoding(ctx.artistName);
    mbid = await getReleaseMbid(repairedTitle, repairedArtist);
    if (mbid) mbidSource = 'searched';
  }

  if (!mbid) {
    return {
      mbid: null,
      details: null,
      coverArtUrl: null,
      mbidSource: 'none',
    };
  }

  const [details, coverArtUrl] = await Promise.all([
    getReleaseDetails(mbid),
    getCoverArtByMbid(mbid),
  ]);

  return {
    mbid,
    details,
    coverArtUrl,
    mbidSource,
  };
}

// ---------------------------------------------------------------------------
// Fix application
// ---------------------------------------------------------------------------

async function applyFixes(
  payload: Payload,
  ctx: RecordCheckContext,
  mb: MbLookupResult,
  results: CheckResult[],
  verbose: boolean,
): Promise<CheckResult[]> {
  const fixedResults: CheckResult[] = [];

  for (const result of results) {
    if (result.status !== 'missing' || !result.expectedValue) {
      fixedResults.push(result);
    } else {
      try {
        if (result.field === 'label' && mb.details?.label) {
          await payload.update({
            collection: 'records',
            id: ctx.id,
            data: { label: mb.details.label },
          });
          fixedResults.push({ ...result, status: 'fixed' });
          if (verbose) console.log(`  ✅ Fixed label → ${mb.details.label}`);
        } else if (result.field === 'releaseDate' && mb.details?.date) {
          const normalized = normalizeMbDate(mb.details.date);
          if (normalized) {
            await payload.update({
              collection: 'records',
              id: ctx.id,
              data: { releaseDate: normalized },
            });
            fixedResults.push({ ...result, status: 'fixed' });
            if (verbose) console.log(`  ✅ Fixed releaseDate → ${normalized}`);
          } else {
            fixedResults.push({
              ...result,
              status: 'fix-failed',
              detail: `Could not normalize date: ${mb.details.date}`,
            });
          }
        } else if (result.field === 'coverImage' && mb.coverArtUrl) {
          const artistLabel = ctx.artistName ?? 'Unknown Artist';
          const importResult = await importImageFromUrl(payload, mb.coverArtUrl, {
            alt: `${ctx.title} — ${artistLabel} cover art`,
            legacyUrl: mb.coverArtUrl,
          });
          if (importResult.success && importResult.mediaId) {
            await payload.update({
              collection: 'records',
              id: ctx.id,
              data: { coverImage: importResult.mediaId },
            });
            fixedResults.push({ ...result, status: 'fixed' });
            if (verbose) console.log(`  ✅ Fixed coverImage → ${importResult.mediaId}`);
          } else {
            fixedResults.push({
              ...result,
              status: 'fix-failed',
              detail: `Image import failed: ${importResult.error}`,
            });
          }
        } else {
          fixedResults.push(result);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        fixedResults.push({ ...result, status: 'fix-failed', detail: msg });
        if (verbose) console.log(`  💥 Fix failed for ${result.field}: ${msg}`);
      }
    }
  }

  return fixedResults;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);
  const {
    fix, limit, verbose, output,
  } = opts;

  console.log(`\n🔍 Record Metadata Integrity Check (${fix ? 'FIX' : 'DRY-RUN'} mode)`);
  if (limit) console.log(`   Limit: ${limit} records`);

  const payload = await getPayload({ config });

  const report = emptyReport(
    'record-metadata',
    'Record Metadata (label / releaseDate / coverImage)',
  );
  const startTime = Date.now();

  let page = 1;
  let processed = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await payload.find({
      collection: 'records',
      where: { legacyId: { exists: true } },
      limit: PAGE_SIZE,
      page,
      sort: 'title',
      depth: 1, // populate artist relationship
    });

    if (batch.docs.length === 0) break;

    for (const doc of batch.docs) {
      if (limit && processed >= limit) {
        hasMore = false;
        break;
      }

      const artistName = getArtistName(doc.artist);
      const ctx: RecordCheckContext = {
        id: doc.id,
        title: doc.title ?? '',
        artistName,
        label: (doc.label as string) ?? null,
        releaseDate: (doc.releaseDate as string) ?? null,
        coverImage: (doc.coverImage as any)?.id ?? doc.coverImage ?? null,
        musicbrainzId: (doc.musicbrainzId as string) ?? null,
      };

      if (verbose) {
        const displayName = artistName ? `${artistName} — ${ctx.title}` : ctx.title;
        console.log(`\n[${processed + 1}] ${displayName}`);
      }

      // Only query MB if at least one field is missing
      const needsLabel = !ctx.label || ctx.label.trim() === '';
      const needsDate = !ctx.releaseDate || ctx.releaseDate.trim() === '';
      const needsCover = !ctx.coverImage;
      const needsLookup = needsLabel || needsDate || needsCover;

      let mb: MbLookupResult;
      if (needsLookup) {
        mb = await resolveMbid(ctx);
        if (verbose && mb.mbid) {
          console.log(`  MB: ${mb.mbid} (${mb.mbidSource})`);
        }
      } else {
        mb = {
          mbid: null,
          details: null,
          coverArtUrl: null,
          mbidSource: 'none',
        };
      }

      let fieldResults = buildFieldResults(ctx, mb);

      if (fix) {
        fieldResults = await applyFixes(payload, ctx, mb, fieldResults, verbose);
      }

      fieldResults.forEach((r) => {
        addResult(report, r);
      });

      processed += 1;
    }

    if (!hasMore) break;
    hasMore = batch.hasNextPage;
    page += 1;
  }

  report.durationMs = Date.now() - startTime;

  printCheckReport(report);

  const integrityReport: IntegrityReport = {
    checks: [report],
    generatedAt: new Date().toISOString(),
    mode: fix ? 'fix' : 'check',
  };

  if (output) {
    writeReport(integrityReport, output);
  }

  console.log(`\nDone. Processed ${processed} records in ${report.durationMs}ms.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
