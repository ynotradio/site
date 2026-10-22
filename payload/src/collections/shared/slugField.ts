import { slugField as basePayloadSlugField } from 'payload';
import type { Slugify } from 'payload/shared';
import { adminOnlyCondition } from '../../utils/auth';
import { slugifyText } from '../hooks/slugUtils';

/**
 * Shared slug-field helper for every collection.
 *
 * WHY THIS EXISTS
 * ----------------
 * Payload's `slugField()` renders a required, format-validated text field whose
 * value is produced by a `slugify` function. Several of our collections pass a
 * custom `slugify` that can legitimately return `undefined` (empty source text,
 * an invalid date) or — for Songs/Records — a `Promise` while an artist name is
 * resolved from the database. Any of those reaches the slug field as an invalid
 * value and the save is rejected with a generic "invalid slug" error.
 *
 * Editors (e.g. adding new music) see that error with no way to understand or
 * fix it — the slug is an internal artifact they never type. See #591/#622 for
 * the UX history.
 *
 * WHAT THIS DOES
 * ---------------
 * `slugField()` here wraps Payload's helper and composes the supplied `slugify`
 * (or the default source-field behaviour) with `makeSafeSlugify`, which
 * GUARANTEES a valid, non-empty slug string returned SYNCHRONOUSLY. Generation
 * can no longer block a save. Collision handling is unchanged: a duplicate slug
 * still surfaces the DB's clear "must be unique" message, never the opaque one.
 */

type BaseSlugFieldOptions = Parameters<typeof basePayloadSlugField>[0];
type SlugFieldOptions = BaseSlugFieldOptions & {
  /**
   * Hide the slug field (and its lock/unlock control) from non-admin editors.
   * The slug is still generated server-side, so hiding it never blocks a save;
   * it just removes an internal, confusing field from the editor's view.
   */
  adminOnly?: boolean;
};

/**
 * Last-resort slug used only when there is genuinely no source text to slugify.
 * Keeps the field format-valid so an editor is never blocked; if it collides
 * with an existing row the DB returns a clear uniqueness error instead.
 */
export const SLUG_FALLBACK = 'item';

// A value that is already a well-formed slug: lowercase alphanumerics in groups
// separated by one or more hyphens. Permits the `artist--title` double-hyphen
// separator used by Songs/Records and the date-prefixed CD-of-the-week slugs.
const VALID_SLUG = /^[a-z0-9]+(?:-+[a-z0-9]+)*$/;

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value != null
    && (typeof value === 'object' || typeof value === 'function')
    && typeof (value as { then?: unknown }).then === 'function'
  );
}

/**
 * Coerce an arbitrary value into a valid slug, or `undefined` when it holds no
 * slugifiable content. An already-well-formed slug (including `artist--title`)
 * is preserved verbatim so we never collapse its separators; anything else is
 * run through `slugifyText`.
 */
export function coerceSlug(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  if (VALID_SLUG.test(text)) return text;
  return slugifyText(text) || undefined;
}

/**
 * Wrap a `slugify` function so it always returns a valid, non-empty slug
 * synchronously. Resolution order:
 *   1. the wrapped slugify's own result (if a usable slug),
 *   2. the value Payload would otherwise slugify (title/name/typed slug),
 *   3. the `SLUG_FALLBACK` constant.
 * A thrown error or a returned Promise is treated as "no result" and falls
 * through — a Promise can never reach the field, which is what caused the
 * intermittent "invalid slug" on Songs/Records.
 */
export function makeSafeSlugify(slugify?: Slugify): Slugify {
  return (args) => {
    let result: unknown;
    try {
      result = slugify ? slugify(args) : args.valueToSlugify;
    } catch {
      result = undefined;
    }
    if (isThenable(result)) result = undefined;

    return coerceSlug(result) ?? coerceSlug(args.valueToSlugify) ?? SLUG_FALLBACK;
  };
}

/**
 * Drop-in replacement for Payload's `slugField()` that guarantees generated
 * slugs are always valid. Use this everywhere instead of importing `slugField`
 * from `'payload'` directly.
 */
export function slugField(options?: SlugFieldOptions) {
  const { adminOnly, ...baseOptions } = options ?? {};
  const field = basePayloadSlugField({
    ...baseOptions,
    slugify: makeSafeSlugify(baseOptions.slugify),
  });
  if (!adminOnly) return field;
  // The helper returns a sidebar `row` wrapping the slug + generateSlug fields;
  // a condition on the row hides both from non-admins. Generation is a
  // server-side hook, so the hidden field is still populated on save.
  return {
    ...field,
    admin: { ...field.admin, condition: adminOnlyCondition },
  };
}
