import { getPayloadClient } from './shared/payloadClient';

async function check() {
  const payload = await getPayloadClient('dev');

  // Get a working post that has links
  const posts = await payload.find({
    collection: 'posts',
    limit: 1,
    where: {
      legacyId: { less_than: 100 },
    },
  });

  if (posts.docs.length > 0) {
    const post = posts.docs[0];
    console.log(`\nPost ${post.id} (legacyId: ${post.legacyId}): ${post.headline}`);
    console.log('\nContent structure:');
    console.log(JSON.stringify(post.content, null, 2));
  }
}

check().catch(console.error);
