import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const root = resolve(__dirname, '..');

function listFiles(dir: string, matchFn: (path: string) => boolean): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath ?? (e as unknown as { path: string }).path, e.name))
    .filter(matchFn)
    .map((abs) => abs.replace(root + '/', ''));
}

function extractComponentPaths(src: string): string[] {
  return [...src.matchAll(/['"](\/(payload)[^'"]+)['"]/g)].map((m) => m[1]);
}

/**
 * Extracts the local identifier bound by each top-level `import { X as Y } from '...'`
 * or `import { X } from '...'` statement in importMap.js.
 */
function extractImportedIdentifiers(src: string): Set<string> {
  const clauses = [...src.matchAll(/^import\s*\{([^}]+)\}\s*from/gm)].flatMap((match) => match[1].split(','));
  const identifiers = clauses
    .map((clause) => clause.match(/\bas\s+(\w+)/)?.[1] ?? clause.trim().match(/^(\w+)$/)?.[1])
    .filter((identifier): identifier is string => Boolean(identifier));
  return new Set(identifiers);
}

/**
 * Extracts the identifier used as the value for each `"path#Key": Identifier,` entry
 * in importMap.js's `export const importMap = { ... }` object.
 */
function extractMapValueIdentifiers(src: string): Map<string, string> {
  const matches = [...src.matchAll(/^\s*"([^"]+)":\s*(\w+),?\s*$/gm)];
  return new Map(matches.map((match) => [match[1], match[2]]));
}

describe('Payload importMap integrity', () => {
  it('registers every custom component path from collection configs in importMap.js', () => {
    const importMapSrc = readFileSync(resolve(root, 'app/(payload)/admin/importMap.js'), 'utf-8');

    const collectionFiles = listFiles(
      resolve(root, 'payload/src/collections'),
      (f) => f.endsWith('.ts') && !f.includes('/hooks/'),
    );
    const featureFiles = listFiles(
      resolve(root, 'payload/src/features'),
      (f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && !f.endsWith('.stories.ts'),
    );

    const missing = [...collectionFiles, ...featureFiles].flatMap((file) => {
      const src = readFileSync(resolve(root, file), 'utf-8');
      return extractComponentPaths(src)
        .filter((path) => !importMapSrc.includes(`"${path}"`))
        .map((path) => `${path}  (referenced in ${file})`);
    });

    expect(
      missing,
      `These component paths are missing from importMap.js:\n${missing.join('\n')}`,
    ).toHaveLength(0);
  });

  it('every identifier used in the importMap object has a matching import statement', () => {
    // Regenerating importMap.js (via `yarn payload:generate-importmap` or the dev
    // server's live auto-regen) can silently drop the `import` line for an entry
    // while leaving its "path#Key": Identifier map entry in place — this compiles
    // fine (the map object doesn't error until Next.js tries to render that
    // specific admin view) but throws `ReferenceError: X is not defined` at
    // runtime for anyone who visits it. This check catches that class of bug at
    // the file level, independent of Payload's own (incomplete) static analysis.
    const importMapSrc = readFileSync(resolve(root, 'app/(payload)/admin/importMap.js'), 'utf-8');

    const importedIdentifiers = extractImportedIdentifiers(importMapSrc);
    const mapEntries = extractMapValueIdentifiers(importMapSrc);

    const orphaned = [...mapEntries.entries()]
      .filter(([, identifier]) => !importedIdentifiers.has(identifier))
      .map(([path, identifier]) => `"${path}": ${identifier}  (no matching import statement)`);

    expect(
      orphaned,
      `These importMap.js entries reference an identifier with no import statement:\n${orphaned.join('\n')}`,
    ).toHaveLength(0);
  });
});
