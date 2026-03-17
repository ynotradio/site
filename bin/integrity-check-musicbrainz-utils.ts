/* eslint-disable no-console */
/**
 * Shared types and pure-logic functions for the MusicBrainz integrity check.
 *
 * Separated from the main script so tests can import without pulling in
 * Payload CMS / @payload-config dependencies.
 */

import {
  getArtistMbid,
  getReleaseMbid,
  getRecordingMbid,
  getMbEntityType,
  type MbEntityType,
} from './migrations/shared/musicbrainz';
import {
  parseArgs as baseParseArgs,
  type CliOptions as BaseCliOptions,
} from './content-integrity-utils';

// ---------------------------------------------------------------------------
// Extended CLI options
// ---------------------------------------------------------------------------

export interface MbCheckOptions extends BaseCliOptions {
  skipTypeCheck: boolean;
  typeCheckOnly: boolean;
}

export function parseMbArgs(argv: string[]): MbCheckOptions {
  const filtered: string[] = [];
  let skipTypeCheck = false;
  let typeCheckOnly = false;

  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--skip-type-check':
        skipTypeCheck = true;
        break;
      case '--type-check-only':
        typeCheckOnly = true;
        break;
      default:
        filtered.push(args[i]);
        break;
    }
  }

  if (skipTypeCheck && typeCheckOnly) {
    throw new Error(
      'Cannot use --skip-type-check and --type-check-only together',
    );
  }

  const base = baseParseArgs(['node', 'script', ...filtered]);

  return { ...base, skipTypeCheck, typeCheckOnly };
}

// ---------------------------------------------------------------------------
// Collection configs
// ---------------------------------------------------------------------------

export interface CollectionConfig {
  slug: 'artists' | 'songs' | 'records';
  label: string;
  expectedType: MbEntityType;
  nameField: 'name' | 'title';
  needsArtist: boolean;
}

export const COLLECTIONS: CollectionConfig[] = [
  {
    slug: 'artists',
    label: 'Artists',
    expectedType: 'artist',
    nameField: 'name',
    needsArtist: false,
  },
  {
    slug: 'songs',
    label: 'Songs',
    expectedType: 'recording',
    nameField: 'title',
    needsArtist: true,
  },
  {
    slug: 'records',
    label: 'Records',
    expectedType: 'release',
    nameField: 'title',
    needsArtist: true,
  },
];

// ---------------------------------------------------------------------------
// Type check logic
// ---------------------------------------------------------------------------

export interface TypeCheckInput {
  mbid: string;
  expectedType: MbEntityType;
}

export interface TypeCheckResult {
  isCorrect: boolean;
  actualType: MbEntityType | null;
  detail: string;
}

export async function checkEntityType(
  input: TypeCheckInput,
): Promise<TypeCheckResult> {
  const actualType = await getMbEntityType(input.mbid);

  if (actualType === null) {
    return {
      isCorrect: false,
      actualType: null,
      detail: 'MBID not found in any MusicBrainz entity type',
    };
  }

  if (actualType !== input.expectedType) {
    return {
      isCorrect: false,
      actualType,
      detail: `Type mismatch: expected ${input.expectedType}, got ${actualType}`,
    };
  }

  return { isCorrect: true, actualType, detail: 'Type OK' };
}

// ---------------------------------------------------------------------------
// Best-match check logic
// ---------------------------------------------------------------------------

export interface BestMatchInput {
  collection: 'artists' | 'songs' | 'records';
  currentMbid: string;
  name: string;
  artistName: string | null;
}

export interface BestMatchResult {
  matches: boolean;
  foundMbid: string | null;
  detail: string;
}

export async function checkBestMatch(
  input: BestMatchInput,
): Promise<BestMatchResult> {
  let foundMbid: string | null = null;

  switch (input.collection) {
    case 'artists':
      foundMbid = await getArtistMbid(input.name);
      break;
    case 'songs':
      foundMbid = await getRecordingMbid(
        input.name,
        input.artistName || undefined,
      );
      if (!foundMbid && input.artistName) {
        foundMbid = await getRecordingMbid(input.name);
      }
      break;
    case 'records':
      foundMbid = await getReleaseMbid(
        input.name,
        input.artistName || undefined,
      );
      if (!foundMbid && input.artistName) {
        foundMbid = await getReleaseMbid(input.name);
      }
      break;
    default:
      break;
  }

  if (!foundMbid) {
    return {
      matches: true,
      foundMbid: null,
      detail: 'No search result to compare against',
    };
  }

  if (foundMbid === input.currentMbid) {
    return { matches: true, foundMbid, detail: 'Best match confirmed' };
  }

  return {
    matches: false,
    foundMbid,
    detail: `Better match available: ${input.currentMbid} → ${foundMbid}`,
  };
}
