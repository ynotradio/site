/**
 * Verify that "Quarantine Takeovers" was imported successfully
 */

import { getPayloadClient } from './shared/payloadClient';

async function verify() {
  const payload = await getPayloadClient('dev');

  // Search for Quarantine Takeovers
  const result = await payload.find({
    collection: 'posts',
    where: {
      or: [
        { legacyId: { equals: 10046 } },
        { slug: { equals: 'quarantine-takeovers' } },
      ],
    },
    limit: 1,
  });

  if (result.totalDocs > 0) {
    const post = result.docs[0];
    console.log('\n✅ Found "Quarantine Takeovers"!');
    console.log('-----------------------------------');
    console.log(`ID: ${post.id}`);
    console.log(`Headline: ${post.headline}`);
    console.log(`Slug: ${post.slug}`);
    console.log(`Legacy ID: ${post.legacyId}`);
    console.log(`Start Date: ${post.startDate}`);
    console.log(`End Date: ${post.endDate}`);
    console.log(`Status: ${post.status}`);
    console.log('-----------------------------------\n');
  } else {
    console.log('\n❌ "Quarantine Takeovers" not found!\n');
  }

  process.exit(0);
}

verify().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
