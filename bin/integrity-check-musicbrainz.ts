/* eslint-disable no-console */
// Skip Drizzle pushDevSchema — these scripts only read/write data, never alter schema
/**
 * MusicBrainz Integrity Check
 *
 * Verifies that stored MusicBrainz IDs are:
 *   1. The correct entity type (artist MBID → artist, song → recording,
 *      record → release)
 *   2. The best available match for the entity's name
 *
 * Usage:
 *   yarn integrity:check:musicbrainz                    # Dry run, both checks
 *   yarn integrity:check:musicbrainz --fix              # Fix mismatches
 *   yarn integrity:check:musicbrainz --skip-type-check  # Best-match only
 *   yarn integrity:check:musicbrainz --type-check-only  # Type check only
 *   yarn integrity:check:musicbrainz --limit 10         # 10 per collection
 */

import { getPayload, type Payload } from 'payload';
import config from '@payload-config';
import { repairEncoding, getArtistName } from './musicbrainz-bulk-match-utils';
import {
  emptyReport,
  addResult,
  printCheckReport,
  writeReport,
  type CheckResult,
  type IntegrityReport,
} from './content-integrity-utils';
import {
  parseMbArgs,
  checkEntityType,
  checkBestMatch,
  COLLECTIONS,
  type MbCheckOptions,
  type CollectionConfig,
} from './integrity-check-musicbrainz-utils';

process.env.PAYLOAD_MIGRATING = 'true';

// ---------------------------------------------------------------------------
// Process a single collection
// ---------------------------------------------------------------------------

const PAGE_SIZE = 100;

async function processCollection(
  payload: Payload,
  collectionCfg: CollectionConfig,
  options: MbCheckOptions,
  report: ReturnType<typeof emptyReport>,
): Promise<void> {
  let page = 1;
  let hasMore = true;
  let processed = 0;

  while (hasMore) {
    const limit = options.limit ? Math.min(PAGE_SIZE, options.limit - processed) : PAGE_SIZE;
    if (limit <= 0) break;

    const result = await payload.find({
      collection: collectionCfg.slug,
      where: { musicbrainzId: { exists: true } },
      limit,
      page,
      depth: 1,
      sort: collectionCfg.nameField,
    });

    for (const doc of result.docs) {
      const rawName = (doc as Record<string, unknown>)[collectionCfg.nameField] as string;
      const name = repairEncoding(rawName);
      const mbid = (doc as { musicbrainzId?: string }).musicbrainzId;

      if (mbid) {
        const artistName = collectionCfg.needsArtist
          ? (() => {
            const raw = getArtistName((doc as { artist?: unknown }).artist);
            return raw ? repairEncoding(raw) : null;
          })()
          : null;

        const identifier = collectionCfg.needsArtist && artistName ? `${artistName} — ${name}` : name;

        if (options.verbose) {
          console.log(`  Checking [${collectionCfg.slug}] ${identifier} (${mbid})`);
        }

        let handled = false;

        // --- Type check ---
        if (!options.skipTypeCheck) {
          const typeResult = await checkEntityType({
            mbid,
            expectedType: collectionCfg.expectedType,
          });

          if (!typeResult.isCorrect) {
            addResult(report, {
              id: doc.id,
              collection: collectionCfg.slug,
              identifier,
              field: 'musicbrainzId',
              status: 'mismatch',
              currentValue: mbid,
              expectedValue: `(${collectionCfg.expectedType} type)`,
              detail: typeResult.detail,
            });
            handled = true;
          }
        }

        // --- Best-match check ---
        if (!handled && !options.typeCheckOnly) {
          const bestMatch = await checkBestMatch({
            collection: collectionCfg.slug,
            currentMbid: mbid,
            name,
            artistName,
          });

          if (!bestMatch.matches) {
            const checkResult: CheckResult = {
              id: doc.id,
              collection: collectionCfg.slug,
              identifier,
              field: 'musicbrainzId',
              status: 'mismatch',
              currentValue: mbid,
              expectedValue: bestMatch.foundMbid ?? undefined,
              detail: bestMatch.detail,
            };

            if (options.fix && bestMatch.foundMbid) {
              try {
                await payload.update({
                  collection: collectionCfg.slug,
                  id: doc.id,
                  data: { musicbrainzId: bestMatch.foundMbid },
                });
                checkResult.status = 'fixed';
                if (options.verbose) {
                  console.log(`    ✅ Fixed: ${mbid} → ${bestMatch.foundMbid}`);
                }
              } catch (err) {
                checkResult.status = 'fix-failed';
                checkResult.detail = `${bestMatch.detail} (update failed: ${err})`;
              }
            }

            addResult(report, checkResult);
            handled = true;
          }
        }

        // Everything OK
        if (!handled) {
          addResult(report, {
            id: doc.id,
            collection: collectionCfg.slug,
            identifier,
            field: 'musicbrainzId',
            status: 'ok',
          });
        }

        processed += 1;
      }
    }

    hasMore = result.hasNextPage && (!options.limit || processed < options.limit);
    page++;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const options = parseMbArgs(process.argv);
  const mode = options.fix ? '🔧 FIX MODE' : '👀 DRY RUN';

  let checks = 'type + best-match';
  if (options.skipTypeCheck) checks = 'best-match only';
  if (options.typeCheckOnly) checks = 'type check only';

  console.log(`\n🎵 MusicBrainz Integrity Check — ${mode}`);
  console.log(`   Checks: ${checks}`);
  if (options.limit) console.log(`   Limit: ${options.limit} per collection`);
  if (options.verbose) console.log('   Verbose: on');

  const payload = await getPayload({ config });
  const report = emptyReport('musicbrainz', 'MusicBrainz ID Integrity');
  const start = Date.now();

  for (const collectionCfg of COLLECTIONS) {
    console.log(`\n⏳ Processing ${collectionCfg.label}...`);
    await processCollection(payload, collectionCfg, options, report);
  }

  report.durationMs = Date.now() - start;
  printCheckReport(report);

  const integrity: IntegrityReport = {
    checks: [report],
    generatedAt: new Date().toISOString(),
    mode: options.fix ? 'fix' : 'check',
  };

  if (options.output) {
    writeReport(integrity, options.output);
  }

  const exitCode = report.mismatch > 0 || report.fixFailed > 0 ? 1 : 0;

  if (!options.fix && report.mismatch > 0) {
    console.log('\n💡 This was a dry run. Use --fix to update mismatched MBIDs.\n');
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
