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
});
