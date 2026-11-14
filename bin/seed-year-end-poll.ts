/* eslint-disable no-console */
import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '@payload-config';
import { assertNotConnectedToProd } from './migrations/shared/payloadClient';
import { seedYearEndPoll } from './seed-data/yearEndPoll';

/**
 * Seed the Year End Poll and staff picks into an existing database.
 *
 * Usage: yarn seed:yep
 *
 * seed:payload also runs this on an empty database; use this one when the
 * database already has other data. Safe to re-run.
 */
async function main() {
  assertNotConnectedToProd();
  const payload = await getPayloadHMR({ config });
  try {
    await seedYearEndPoll(payload);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Year End Poll:', error);
    process.exit(1);
  }
}

main();
