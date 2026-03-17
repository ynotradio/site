/**
 * Pure utility functions for the Record metadata integrity check.
 *
 * Separated from the main script so tests can import without pulling in
 * Payload CMS / @payload-config dependencies.
 */

import type { CheckResult } from './content-integrity-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecordCheckContext {
  id: string | number;
  title: string;
  artistName: string | null;
  label: string | null;
  releaseDate: string | null;
  coverImage: string | number | null;
  musicbrainzId: string | null;
}

export interface MbLookupResult {
  mbid: string | null;
  details: MbReleaseDetails | null;
  coverArtUrl: string | null;
  mbidSource: 'existing' | 'searched' | 'none';
}

export interface MbReleaseDetails {
  id: string;
  title: string;
  date?: string;
  label?: string;
  country?: string;
}

// ---------------------------------------------------------------------------
// Date normalisation
// ---------------------------------------------------------------------------

/**
 * Normalize a MusicBrainz partial date to a full YYYY-MM-DD string.
 *
 * MusicBrainz returns dates as YYYY, YYYY-MM, or YYYY-MM-DD.
 * Payload expects a full ISO date string.
 */
export function normalizeMbDate(mbDate: string): string | null {
  if (!mbDate || mbDate.trim() === '') return null;

  const trimmed = mbDate.trim();

  // Already full: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Year + month: YYYY-MM → YYYY-MM-01
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;

  // Year only: YYYY → YYYY-01-01
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;

  return null;
}

// ---------------------------------------------------------------------------
// Field result builders
// ---------------------------------------------------------------------------

/**
 * Build CheckResult entries for a single record.
 * Does NOT apply fixes — that is handled by the caller.
 */
export function buildFieldResults(ctx: RecordCheckContext, mb: MbLookupResult): CheckResult[] {
  const identifier = ctx.artistName ? `${ctx.artistName} — ${ctx.title}` : ctx.title;

  const results: CheckResult[] = [];

  // --- label ---
  if (ctx.label && ctx.label.trim() !== '') {
    results.push({
      id: ctx.id,
      collection: 'records',
      identifier,
      field: 'label',
      status: 'ok',
      currentValue: ctx.label,
    });
  } else if (mb.details?.label) {
    results.push({
      id: ctx.id,
      collection: 'records',
      identifier,
      field: 'label',
      status: 'missing',
      currentValue: '(empty)',
      expectedValue: mb.details.label,
      detail: `MB source: ${mb.mbidSource}`,
    });
  } else {
    results.push({
      id: ctx.id,
      collection: 'records',
      identifier,
      field: 'label',
      status: mb.mbid ? 'missing' : 'skipped',
      currentValue: '(empty)',
      detail: mb.mbid ? 'MB has no label info' : 'No MBID available',
    });
  }

  // --- releaseDate ---
  if (ctx.releaseDate && ctx.releaseDate.trim() !== '') {
    results.push({
      id: ctx.id,
      collection: 'records',
      identifier,
      field: 'releaseDate',
      status: 'ok',
      currentValue: ctx.releaseDate,
    });
  } else if (mb.details?.date) {
    const normalized = normalizeMbDate(mb.details.date);
    results.push({
      id: ctx.id,
      collection: 'records',
      identifier,
      field: 'releaseDate',
      status: 'missing',
      currentValue: '(empty)',
      expectedValue: normalized ?? mb.details.date,
      detail: `MB raw date: ${mb.details.date}, source: ${mb.mbidSource}`,
    });
  } else {
    results.push({
      id: ctx.id,
      collection: 'records',
      identifier,
      field: 'releaseDate',
      status: mb.mbid ? 'missing' : 'skipped',
      currentValue: '(empty)',
      detail: mb.mbid ? 'MB has no date info' : 'No MBID available',
    });
  }

  // --- coverImage ---
  if (ctx.coverImage) {
    results.push({
      id: ctx.id,
      collection: 'records',
      identifier,
      field: 'coverImage',
      status: 'ok',
      currentValue: String(ctx.coverImage),
    });
  } else if (mb.coverArtUrl) {
    results.push({
      id: ctx.id,
      collection: 'records',
      identifier,
      field: 'coverImage',
      status: 'missing',
      currentValue: '(none)',
      expectedValue: mb.coverArtUrl,
      detail: `Cover art available, source: ${mb.mbidSource}`,
    });
  } else {
    results.push({
      id: ctx.id,
      collection: 'records',
      identifier,
      field: 'coverImage',
      status: mb.mbid ? 'missing' : 'skipped',
      currentValue: '(none)',
      detail: mb.mbid ? 'No cover art in CAA' : 'No MBID available',
    });
  }

  return results;
}
