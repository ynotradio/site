/**
 * Visual-diff verification: screenshots the local Postgres-backed PHP
 * front end against production (still MySQL-backed) for a content type,
 * pixel-diffs the pair, and writes side-by-side PNGs + a sorted summary.
 *
 * Not a pass/fail test — a human still eyeballs the `--diff.png` output to
 * separate "layout drift we don't care about" from "we actually lost
 * content." Point at whichever env vars make sense for your setup:
 *
 *   VISUAL_DIFF_LOCAL_ORIGIN (default http://localhost:8080)
 *   VISUAL_DIFF_PROD_ORIGIN  (default https://www.ynotradio.net)
 *
 * Usage:
 *   yarn tsx --import ./bin/preload-nextenv-fix.mjs bin/visual-diff/run.ts pages [slug ...]
 *   yarn tsx --import ./bin/preload-nextenv-fix.mjs bin/visual-diff/run.ts top11
 *   yarn tsx --import ./bin/preload-nextenv-fix.mjs bin/visual-diff/run.ts \
 *     yearendpoll 2023 2024 2025
 *
 * Requires the local Docker PHP stack running (`docker compose up -d`) and
 * `getPayloadClient()`'s usual .env.local / DATABASE_URI setup for `pages`.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import { Command } from 'commander';
import path from 'node:path';
import { getPayloadClient } from '../migrations/shared/payloadClient';
import {
  pageTargets, top11Targets, yearEndPollTargets, type DiffTarget,
} from './targets';
import { runDiff } from './runDiff';

const OUT_DIR = path.resolve(process.cwd(), 'bin/visual-diff/out');

async function resolvePageTargets(slugFilter: string[]): Promise<DiffTarget[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'pages',
    limit: 1000,
    select: { slug: true },
  });
  const rows = docs as { slug: string }[];
  const filtered = slugFilter.length > 0 ? rows.filter((r) => slugFilter.includes(r.slug)) : rows;
  return pageTargets(filtered);
}

function printSummary(results: Awaited<ReturnType<typeof runDiff>>): void {
  const sorted = [...results].sort(
    (x, y) => (parseFloat(y.diffPercent ?? '0') || 0) - (parseFloat(x.diffPercent ?? '0') || 0),
  );
  console.log('\n=== Sorted by diff % (highest first) ===');
  sorted.forEach((r) => {
    const note = r.note ? ` -- ${r.note}` : '';
    console.log(
      `${r.diffPercent ?? 'N/A'}%\t${r.label}\t(local ${r.localStatus}, prod ${r.prodStatus})${note}`,
    );
  });
  console.log(`\nScreenshots + diffs written to ${OUT_DIR}`);
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .name('visual-diff')
    .description('Screenshot local (Postgres) vs prod (MySQL) and pixel-diff the result');

  program
    .command('pages [slugs...]')
    .description('Diff pages.php?page=<slug> for every imported Pages doc, or just the given slugs')
    .action(async (slugs: string[]) => {
      const targets = await resolvePageTargets(slugs);
      const results = await runDiff(targets, OUT_DIR);
      printSummary(results);
      process.exit(0);
    });

  program
    .command('top11')
    .description('Diff top11.php (single current-state page)')
    .action(async () => {
      const results = await runDiff(top11Targets(), OUT_DIR);
      printSummary(results);
      process.exit(0);
    });

  program
    .command('yearendpoll <years...>')
    .description('Diff yearendpoll.php?poll=<year> for the given year(s)')
    .action(async (years: string[]) => {
      const results = await runDiff(yearEndPollTargets(years.map(Number)), OUT_DIR);
      printSummary(results);
      process.exit(0);
    });

  program.parse(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
