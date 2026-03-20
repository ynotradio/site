/* eslint-disable no-console */
/**
 * Shared types and utilities for the MusicBrainz bulk match script.
 *
 * Separated from the main script so tests can import without pulling in
 * Payload CMS / @payload-config dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CollectionChoice = 'artists' | 'records' | 'songs' | 'all';

export interface CliOptions {
  collection: CollectionChoice;
  fix: boolean;
  verify: boolean;
  limit: number;
}

export interface MatchResult {
  id: string | number;
  name: string;
  currentMbid: string | null;
  foundMbid: string | null;
  status: 'missing' | 'matched' | 'mismatch' | 'not-found' | 'skipped' | 'verified' | 'conflict';
  updated: boolean;
}

export interface CollectionReport {
  collection: string;
  total: number;
  processed: number;
  missing: number;
  matched: number;
  mismatched: number;
  notFound: number;
  conflicts: number;
  verified: number;
  updated: number;
  results: MatchResult[];
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

export function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  const options: CliOptions = {
    collection: 'all',
    fix: false,
    verify: false,
    limit: 0,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--collection':
        i++;
        if (!['artists', 'records', 'songs', 'all'].includes(args[i])) {
          throw new Error(
            `Invalid collection "${args[i]}". Must be one of: artists, records, songs, all`,
          );
        }
        options.collection = args[i] as CollectionChoice;
        break;
      case '--fix':
        options.fix = true;
        break;
      case '--verify':
        options.verify = true;
        break;
      case '--limit':
        i++;
        options.limit = parseInt(args[i], 10);
        if (Number.isNaN(options.limit) || options.limit < 1) {
          throw new Error(`Invalid limit "${args[i]}". Must be a positive number`);
        }
        break;
      case '--help':
        console.log(`
MusicBrainz Bulk Match — find and fix missing or inaccurate MBIDs

Options:
  --collection <name>  Which collection to process (artists|records|songs|all) [default: all]
  --fix                Update records with found MBIDs (default is dry-run)
  --verify             Also check records that already have an MBID
  --limit <N>          Process at most N records per collection
  --help               Show this help message
`);
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${args[i]}. Use --help for usage.`);
    }
  }

  return options;
}

// ---------------------------------------------------------------------------
// Encoding repair
// ---------------------------------------------------------------------------

/**
 * Detect and repair mojibake — text where UTF-8 bytes were decoded as Latin-1.
 *
 * Example: "PoliÃ§a" → "Poliça", "LiberaciÃ³n" → "Liberación"
 *
 * Works by re-interpreting the string's char codes as Latin-1 bytes, then
 * decoding those bytes as UTF-8. Returns the original if repair fails or
 * produces no improvement.
 */
export function repairEncoding(text: string): string {
  // Quick check: if no characters above U+007F, nothing to repair
  if (!/[\u0080-\u00ff]/.test(text)) return text;

  try {
    // Treat each char code as a Latin-1 byte value
    const bytes = Buffer.from(text, 'latin1');
    const repaired = bytes.toString('utf8');

    // Repair is valid if it decoded cleanly (no replacement chars) and is shorter
    // (multi-byte mojibake sequences collapse into single characters)
    if (!repaired.includes('\uFFFD') && repaired.length < text.length) {
      return repaired;
    }
  } catch {
    // Decoding failed — return original
  }
  return text;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract artist name from a populated Payload relationship field.
 * When depth >= 1 the field is an object with `name`; otherwise it is an ID string.
 */
export function getArtistName(artistField: unknown): string | null {
  if (!artistField) return null;

  if (typeof artistField === 'object' && artistField !== null && 'name' in artistField) {
    return (artistField as { name: string }).name;
  }

  return null;
}

/**
 * Create an empty CollectionReport scaffold.
 */
export function emptyReport(collection: string): CollectionReport {
  return {
    collection,
    total: 0,
    processed: 0,
    missing: 0,
    matched: 0,
    mismatched: 0,
    notFound: 0,
    conflicts: 0,
    verified: 0,
    updated: 0,
    results: [],
  };
}

/**
 * Determine the match status for a single entity and update report counters.
 *
 * Returns the classified status and increments the appropriate counters on
 * the supplied report object.
 */
export function classifyMatch(
  currentMbid: string | null,
  foundMbid: string | null,
  verify: boolean,
  report: CollectionReport,
): MatchResult['status'] {
  if (currentMbid && !verify) return 'skipped';

  const counters = report; // alias to satisfy no-param-reassign
  if (!currentMbid) {
    counters.missing += 1;
    if (foundMbid) {
      counters.matched += 1;
      return 'matched';
    }
    counters.notFound += 1;
    return 'not-found';
  }

  // currentMbid is set; verify must be true (else we early-returned above)
  if (!foundMbid) {
    counters.notFound += 1;
    return 'not-found';
  }
  if (currentMbid === foundMbid) {
    counters.verified += 1;
    return 'verified';
  }
  counters.mismatched += 1;
  return 'mismatch';
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export function printReport(report: CollectionReport): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${report.collection.toUpperCase()} — Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total in DB:     ${report.total}`);
  console.log(`  Processed:       ${report.processed}`);
  console.log(`  Missing MBID:    ${report.missing}`);
  console.log(`  Matched:         ${report.matched}`);
  console.log(`  Verified:        ${report.verified}`);
  console.log(`  Mismatched:      ${report.mismatched}`);
  console.log(`  Not found:       ${report.notFound}`);
  console.log(`  Conflicts:       ${report.conflicts}`);
  console.log(`  Updated:         ${report.updated}`);

  const actionableStatuses = new Set<MatchResult['status']>([
    'matched', 'mismatch', 'not-found', 'verified', 'conflict',
  ]);
  const actionable = report.results.filter((r) => actionableStatuses.has(r.status));

  const statusIcons: Partial<Record<MatchResult['status'], string>> = {
    matched: '✅',
    verified: '✔️',
    mismatch: '⚠️',
    conflict: '🔁',
  };

  if (actionable.length > 0) {
    console.log('\n  Details:');
    for (const r of actionable) {
      const icon = statusIcons[r.status] ?? '❌';
      const updateTag = r.updated ? ' [UPDATED]' : '';
      console.log(`    ${icon} ${r.name}`);
      if (r.currentMbid) {
        console.log(`       Current: ${r.currentMbid}`);
      }
      if (r.foundMbid) {
        console.log(`       Found:   ${r.foundMbid}${updateTag}`);
      } else {
        console.log('       Found:   (none)');
      }
    }
  }
}
