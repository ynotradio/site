/* eslint-disable no-console */
/**
 * Repair DJ Issues - Deletes the specific DJs mentioned in issues #597 and #598
 *
 * This script will:
 * 1. Delete DJ #84 (orphaned DJ from issue #597)
 * 2. Find and delete duplicate Josh DJs (keeping only the one that appears on /deejays)
 *
 * Usage:
 *   DRY RUN (show what will be deleted):
 *     node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/repair-dj-issues.ts
 *
 *   ACTUAL DELETE (requires --confirm flag):
 *     node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/repair-dj-issues.ts --confirm
 *
 * Connect to specific database:
 *   DATABASE_URI=postgresql://user:pass@host/db node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/repair-dj-issues.ts --confirm
 */

import { getPayload } from 'payload';
import config from '@payload-config';

process.env.PAYLOAD_MIGRATING = 'true';

function getPersonCount(person: any): number {
  if (Array.isArray(person)) {
    return person.length;
  }
  return person ? 1 : 0;
}

async function main() {
  const confirm = process.argv.includes('--confirm');
  const mode = confirm ? '🔥 DELETE MODE' : '👀 DRY RUN';

  console.log(`\n${'='.repeat(60)}`);
  console.log(`DJ Issues Repair Script — ${mode}`);
  console.log('='.repeat(60));
  console.log('');

  if (!confirm) {
    console.log('⚠️  This is a DRY RUN. No changes will be made.');
    console.log('    Run with --confirm to actually delete records.\n');
  } else {
    console.log('🔥 CONFIRM MODE: Records will be DELETED!\n');
  }

  const payload = await getPayload({ config });
  let deletedCount = 0;

  // Issue #597: Delete DJ #84
  console.log('─'.repeat(60));
  console.log('Issue #597: Deleting DJ #84 (orphaned)');
  console.log('─'.repeat(60));

  try {
    const dj84Result = await payload.find({
      collection: 'djs',
      where: { id: { equals: 84 } },
      depth: 1,
    });

    if (dj84Result.docs.length > 0) {
      const dj84 = dj84Result.docs[0];
      const displayName = dj84.displayName || '(no name)';
      console.log(`Found DJ #84: "${displayName}"`);
      console.log(`  Display Name: ${dj84.displayName || '(empty)'}`);
      console.log(`  Person(s) linked: ${getPersonCount(dj84.person)}`);
      console.log(`  On Air: ${dj84.onAir}`);

      if (confirm) {
        try {
          await payload.delete({
            collection: 'djs',
            id: 84,
          });
          console.log('✓ DELETED DJ #84');
          deletedCount += 1;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`✗ Failed to delete DJ #84: ${msg}`);
        }
      } else {
        console.log('→ Would delete DJ #84 (use --confirm to proceed)');
      }
    } else {
      console.log('✓ DJ #84 does not exist (already deleted or never existed)');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ Error processing DJ #84: ${msg}`);
  }

  // Issue #598: Handle duplicate Josh DJs
  console.log(`\n${'─'.repeat(60)}`);
  console.log('Issue #598: Handling duplicate Josh DJs');
  console.log('─'.repeat(60));

  try {
    const allDJsResult = await payload.find({
      collection: 'djs',
      limit: 10000,
      depth: 1,
    });

    const joshDJs = allDJsResult.docs.filter((dj: any) => {
      const displayName = (dj.displayName || '').toLowerCase();
      return displayName.includes('josh');
    });

    if (joshDJs.length <= 1) {
      const count = joshDJs.length;
      console.log(`✓ No duplicate Josh DJs found (${count} Josh DJ exists)`);
    } else {
      console.log(`Found ${joshDJs.length} Josh DJs:`);

      for (let i = 0; i < joshDJs.length; i++) {
        const dj = joshDJs[i];
        console.log(`\n  [${i + 1}] ID ${dj.id}: "${dj.displayName}"`);
        console.log(`      Person(s): ${getPersonCount(dj.person)}`);
        console.log(`      On Air: ${dj.onAir}`);
        console.log(`      Legacy ID: ${dj.legacyId || '(none)'}`);
      }

      console.log('\n⚠️  MANUAL REVIEW REQUIRED:');
      console.log('   1. Visit http://localhost:3000/admin/collections/djs');
      console.log('   2. Visit https://ynotradio.org/deejays');
      console.log('   3. Identify which Josh DJ appears on the public deejays page');
      console.log('   4. Run this script again with additional flags to delete the duplicate:');
      console.log('      node ... bin/repair-dj-issues.ts --delete-josh-id <ID> --confirm');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ Error processing Josh DJs: ${msg}`);
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  if (confirm) {
    console.log(`✓ Repair complete. Deleted ${deletedCount} DJ(s).`);
  } else {
    console.log('ℹ️  Dry run complete. Use --confirm to make changes.');
  }
  console.log('='.repeat(60));
  console.log('');

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
