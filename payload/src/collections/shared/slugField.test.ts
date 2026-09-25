/**
 * Unit tests for the shared safe slug-field helper.
 *
 * These exercise the pure guard logic (`coerceSlug`, `makeSafeSlugify`) that
 * guarantees an auto-generated slug is always a valid, non-empty string — the
 * fix for editors being blocked by a generic "invalid slug" error when adding
 * content (notably new music).
 */
import { describe, it, expect } from 'vitest';
import { coerceSlug, makeSafeSlugify, SLUG_FALLBACK, slugField } from './slugField';
import { adminOnlyCondition } from '../../utils/auth';

type RowField = { admin?: { condition?: unknown } };

const req = { payload: {} } as never;

describe('coerceSlug', () => {
  it('preserves an already-valid slug verbatim', () => {
    expect(coerceSlug('pet-shop-boys--west-end-girls')).toBe('pet-shop-boys--west-end-girls');
  });

  it('preserves a date-prefixed slug with double-hyphen separators', () => {
    expect(coerceSlug('2026-01-15--pink-floyd--dark-side')).toBe(
      '2026-01-15--pink-floyd--dark-side',
    );
  });

  it('slugifies free text that is not yet a slug', () => {
    expect(coerceSlug('West End Girls!')).toBe('west-end-girls');
  });

  it('returns undefined for empty or symbol-only input', () => {
    expect(coerceSlug('')).toBeUndefined();
    expect(coerceSlug('   ')).toBeUndefined();
    expect(coerceSlug('♪♫★')).toBeUndefined();
    expect(coerceSlug(null)).toBeUndefined();
    expect(coerceSlug(undefined)).toBeUndefined();
  });
});

describe('makeSafeSlugify', () => {
  it('returns the wrapped slugify result when it is a valid slug', () => {
    const safe = makeSafeSlugify(() => 'the-beatles--hey-jude');
    expect(safe({ data: {}, req, valueToSlugify: 'Hey Jude' })).toBe('the-beatles--hey-jude');
  });

  it('never returns a Promise — falls back to the source value synchronously', () => {
    // Simulates the Songs/Records async artist lookup that used to reach the
    // field as a Promise and fail validation.
    const asyncSlugify = () => Promise.resolve('the-beatles--hey-jude') as never;
    const safe = makeSafeSlugify(asyncSlugify);
    const result = safe({ data: {}, req, valueToSlugify: 'Hey Jude' });
    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toBe('hey-jude');
  });

  it('falls back to the source value when slugify returns undefined', () => {
    const safe = makeSafeSlugify(() => undefined);
    expect(safe({ data: {}, req, valueToSlugify: 'New Album' })).toBe('new-album');
  });

  it('falls back to the source value when slugify throws', () => {
    const safe = makeSafeSlugify(() => {
      throw new Error('boom');
    });
    expect(safe({ data: {}, req, valueToSlugify: 'Some Title' })).toBe('some-title');
  });

  it('uses the constant fallback when there is no usable source at all', () => {
    const safe = makeSafeSlugify(() => undefined);
    expect(safe({ data: {}, req, valueToSlugify: '♪♫★' })).toBe(SLUG_FALLBACK);
    expect(safe({ data: {}, req, valueToSlugify: undefined })).toBe(SLUG_FALLBACK);
  });

  it('honors a user-typed valid slug passed through valueToSlugify (no custom slugify)', () => {
    const safe = makeSafeSlugify();
    expect(safe({ data: {}, req, valueToSlugify: 'my-custom-slug' })).toBe('my-custom-slug');
  });

  it('slugifies the source field when no custom slugify is given', () => {
    const safe = makeSafeSlugify();
    expect(safe({ data: {}, req, valueToSlugify: 'The National' })).toBe('the-national');
  });
});

describe('slugField adminOnly', () => {
  it('hides the slug field from non-admins when adminOnly is set', () => {
    const field = slugField({ useAsSlug: 'name', adminOnly: true }) as RowField;
    expect(field.admin?.condition).toBe(adminOnlyCondition);
    // The admin-only condition returns false (hidden) for an editor.
    const condition = field.admin?.condition as (
      d: unknown,
      s: unknown,
      ctx: { user: unknown },
    ) => boolean;
    expect(condition({}, {}, { user: { role: 'editor' } })).toBe(false);
    expect(condition({}, {}, { user: { role: 'admin' } })).toBe(true);
  });

  it('does not set a visibility condition by default', () => {
    const field = slugField({ useAsSlug: 'name' }) as RowField;
    expect(field.admin?.condition).toBeUndefined();
  });
});
