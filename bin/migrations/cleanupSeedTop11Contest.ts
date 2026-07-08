#!/usr/bin/env tsx
/**
 * Deletes a specific Top11 seed/QA contest and its dependent rows
 * (Contestants, Votes, WriteIns, WinnerDraws) on production Postgres.
 *
 * Defaults to a dry run that only counts what would be deleted. Pass
 * --confirm to actually delete. Requires --contest-id, so this can never
 * accidentally target the wrong contest via a stale default.
 *
 * See bin/migrations/inspectTop11Prod.ts to identify the seed contest id
 * before running this.
 *
 * Usage:
 *   YES_I_MEAN_PROD=true yarn tsx --import ./bin/preload-nextenv-fix.mjs \
 *     bin/migrations/cleanupSeedTop11Contest.ts --contest-id 2
 *
 *   YES_I_MEAN_PROD=true yarn tsx --import ./bin/preload-nextenv-fix.mjs \
 *     bin/migrations/cleanupSeedTop11Contest.ts --contest-id 2 --confirm
 */

import { getPayloadClient } from './shared/payloadClient';

function parseArgs(): { contestId: number; confirm: boolean } {
  const args = process.argv.slice(2);
  let contestId: number | null = null;
  let confirm = false;

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--contest-id') {
      contestId = Number(args[i + 1]);
      i += 1;
    } else if (args[i] === '--confirm') {
      confirm = true;
    }
  }

  if (!contestId || Number.isNaN(contestId)) {
    throw new Error('Usage: cleanupSeedTop11Contest.ts --contest-id <id> [--confirm]');
  }

  return { contestId, confirm };
}

const DEPENDENT_COLLECTIONS = [
  'top11-contestants',
  'top11-votes',
  'top11-write-ins',
  'top11-winner-draws',
] as const;

async function main() {
  const { contestId, confirm } = parseArgs();
  const payload = await getPayloadClient('prod-neon');

  const contest = await payload.findByID({ collection: 'top11-contests', id: contestId });
  if (!contest) {
    throw new Error(`No top11-contests row with id=${contestId}`);
  }

  console.log(`\nTarget contest: id=${contestId} status=${(contest as any).status}\n`);

  for (const collection of DEPENDENT_COLLECTIONS) {
    const result = await payload.find({
      collection,
      where: { contest: { equals: contestId } },
      limit: 0,
    });

    console.log(
      `${collection}: ${result.totalDocs} row(s) ${confirm ? 'to delete' : 'would be deleted'}`,
    );

    if (confirm && result.totalDocs > 0) {
      await payload.delete({
        collection,
        where: { contest: { equals: contestId } },
      });
      console.log(`  deleted ${result.totalDocs} row(s) from ${collection}`);
    }
  }

  console.log(
    `\ntop11-contests id=${contestId}: 1 row ${confirm ? 'to delete' : 'would be deleted'}`,
  );
  if (confirm) {
    await payload.delete({ collection: 'top11-contests', id: contestId });
    console.log(`  deleted contest id=${contestId}`);
  }

  if (!confirm) {
    console.log('\nDry run only. Re-run with --confirm to actually delete.\n');
  } else {
    console.log('\nCleanup complete.\n');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
