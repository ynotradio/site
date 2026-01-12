import { getPayloadClient } from './shared/payloadClient';

async function inspect() {
  const payload = await getPayloadClient('dev');

  // Get one post with images
  const result = await payload.find({
    collection: 'posts',
    where: {
      legacyId: { equals: 10027 }, // "Specialty Shows On Demand" - has 20 images
    },
    limit: 1,
  });

  if (result.totalDocs === 0) {
    console.log('Post not found');
    process.exit(1);
  }

  const post = result.docs[0];
  console.log(`\nPost: ${post.headline}`);
  console.log(`LegacyId: ${post.legacyId}`);
  console.log('\nContent structure:');
  console.log(JSON.stringify(post.content, null, 2));

  process.exit(0);
}

inspect();
