/**
 * Get a summary of imported posts
 */

import { getPayloadClient } from './shared/payloadClient';

async function getSummary() {
  const payload = await getPayloadClient('dev');

  // Get total posts
  const totalPosts = await payload.find({
    collection: 'posts',
    limit: 0,
  });

  // Get custom_texts (legacyId >= 10000)
  const customTexts = await payload.find({
    collection: 'posts',
    where: {
      legacyId: { greater_than_equal: 10000 },
    },
    limit: 0,
  });

  // Get regular stories (legacyId < 10000)
  const stories = await payload.find({
    collection: 'posts',
    where: {
      legacyId: { less_than: 10000 },
    },
    limit: 0,
  });

  console.log('\n📊 Import Summary');
  console.log('================================================================================');
  console.log(`Total Posts: ${totalPosts.totalDocs}`);
  console.log(`  - Stories (legacyId < 10000): ${stories.totalDocs}`);
  console.log(`  - Custom Texts (legacyId >= 10000): ${customTexts.totalDocs}`);
  console.log('================================================================================\n');

  process.exit(0);
}

getSummary().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
