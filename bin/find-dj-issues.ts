/* eslint-disable no-console */
/**
 * Find DJ Issues - Identifies the specific problems mentioned in issues #597 and #598
 *
 * Usage:
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/find-dj-issues.ts
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
  const payload = await getPayload({ config });

  console.log('\n🔍 Finding DJ Issues...\n');

  // Issue #597: Find DJ #84
  console.log('='.repeat(60));
  console.log('Issue #597: DJ #84 - unknown DJ');
  console.log('='.repeat(60));
  try {
    const dj84Result = await payload.find({
      collection: 'djs',
      where: { id: { equals: 84 } },
      depth: 1,
    });

    if (dj84Result.docs.length > 0) {
      const dj84 = dj84Result.docs[0];
      console.log('✓ Found DJ #84:');
      console.log(`  ID: ${dj84.id}`);
      console.log(`  Display Name: ${dj84.displayName || '(empty)'}`);
      console.log(`  Person(s) linked: ${getPersonCount(dj84.person)}`);
      console.log(`  On Air: ${dj84.onAir}`);
      console.log(`  Legacy ID: ${dj84.legacyId || '(none)'}`);
      console.log('\n  Action: This DJ appears to be orphaned. Should be deleted.');
    } else {
      console.log('✓ DJ #84 does NOT exist (may have already been deleted)');
    }
  } catch (err) {
    console.error('✗ Error checking DJ #84:', err instanceof Error ? err.message : err);
  }

  // Issue #598: Find duplicate "Josh" DJs
  console.log('\n'.concat('='.repeat(60)));
  console.log('Issue #598: Duplicate Josh DJs');
  console.log('='.repeat(60));
  try {
    const joshResult = await payload.find({
      collection: 'djs',
      limit: 1000,
      depth: 1,
    });

    const joshDJs = joshResult.docs.filter((dj: any) => {
      const displayName = (dj.displayName || '').toLowerCase();
      return displayName.includes('josh');
    });

    if (joshDJs.length === 0) {
      console.log('✓ No DJs with "Josh" in their name found');
    } else if (joshDJs.length === 1) {
      console.log('✓ Only one Josh DJ exists (issue already resolved):');
      const dj = joshDJs[0];
      console.log(`  ID: ${dj.id}`);
      console.log(`  Display Name: ${dj.displayName}`);
      console.log(`  Person(s): ${getPersonCount(dj.person)}`);
      console.log(`  On Air: ${dj.onAir}`);
    } else {
      console.log(`✗ Found ${joshDJs.length} DJs with "Josh" in their name:`);
      for (const dj of joshDJs) {
        console.log(`\n  ID: ${dj.id}`);
        console.log(`  Display Name: ${dj.displayName}`);
        console.log(`  Person(s): ${getPersonCount(dj.person)}`);
        console.log(`  On Air: ${dj.onAir}`);
        console.log(`  Legacy ID: ${dj.legacyId || '(none)'}`);
      }
      console.log(
        '\n  Action: Identify which Josh DJ should be kept (the one appearing on /deejays)',
      );
      console.log('          and delete the other(s).');
    }
  } catch (err) {
    console.error('✗ Error checking Josh DJs:', err instanceof Error ? err.message : err);
  }

  // Find all orphaned DJs (no person linked)
  console.log('\n'.concat('='.repeat(60)));
  console.log('Bonus: All Orphaned DJs (no person linked)');
  console.log('='.repeat(60));
  try {
    const allDJsResult = await payload.find({
      collection: 'djs',
      limit: 10000,
      depth: 1,
    });

    const orphanedDJs = allDJsResult.docs.filter((dj: any) => {
      const { person } = dj;
      return !person || (Array.isArray(person) && person.length === 0);
    });

    if (orphanedDJs.length === 0) {
      console.log('✓ No orphaned DJs found!');
    } else {
      console.log(`✗ Found ${orphanedDJs.length} orphaned DJ(s):`);
      for (const dj of orphanedDJs) {
        console.log(`  - ID ${dj.id}: "${dj.displayName || '(no name)'}"`);
      }
    }
  } catch (err) {
    console.error('✗ Error checking for orphaned DJs:', err instanceof Error ? err.message : err);
  }

  console.log('\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
