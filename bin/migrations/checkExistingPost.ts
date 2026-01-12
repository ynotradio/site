import { getPayloadClient } from './shared/payloadClient';

async function checkPost() {
  const payload = await getPayloadClient('dev');

  // Check for post with legacyId 7 (Y-Not Thursdays @ Dobbs)
  const result = await payload.find({
    collection: 'posts',
    where: {
      legacyId: { equals: 7 },
    },
  });

  console.log(`Found ${result.totalDocs} posts with legacyId 7:`);
  for (const post of result.docs) {
    console.log(`  ID: ${post.id}`);
    console.log(`  Slug: ${post.slug}`);
    console.log(`  Headline: ${post.headline}`);
  }

  // Check if the slug is taken
  const slugResult = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: '2011-03-20--y-not-thursdays-dobbs' },
    },
  });

  console.log(`\nFound ${slugResult.totalDocs} posts with slug "2011-03-20--y-not-thursdays-dobbs":`);
  for (const post of slugResult.docs) {
    console.log(`  ID: ${post.id}`);
    console.log(`  LegacyID: ${post.legacyId}`);
    console.log(`  Headline: ${post.headline}`);
  }

  process.exit(0);
}

checkPost();
