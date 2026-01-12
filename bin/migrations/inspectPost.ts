/**
 * Inspect a specific post's content structure
 */

import { getPayloadClient } from './shared/payloadClient';

async function inspect() {
  const payload = await getPayloadClient('dev');

  const postId = process.argv[2] || '864';

  const post = await payload.findByID({
    collection: 'posts',
    id: postId,
  });

  console.log('\n📄 Post Details');
  console.log('================================================================================');
  console.log(`ID: ${post.id}`);
  console.log(`Headline: ${post.headline}`);
  console.log(`Slug: ${post.slug}`);
  console.log(`Legacy ID: ${post.legacyId}`);
  console.log('\n📝 Content Structure:');
  console.log(JSON.stringify(post.content, null, 2));
  console.log('================================================================================\n');

  process.exit(0);
}

inspect().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
