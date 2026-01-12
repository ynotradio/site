/**
 * Create a test post with an embed block to see the proper structure
 */

import { getPayloadClient } from './shared/payloadClient';

async function createTestPost() {
  const payload = await getPayloadClient('dev');

  // Create a simple test post with an embed
  const post = await payload.create({
    collection: 'posts',
    data: {
      headline: 'Test Embed Post',
      slug: `test-embed-${Date.now()}`,
      startDate: new Date().toISOString(),
      endDate: '2099-12-31T23:59:59.999Z',
      status: 'published',
      content: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'text',
                  text: 'This is a test post with an embed below:',
                  format: 0,
                  mode: 'normal',
                  style: '',
                  detail: 0,
                  version: 1,
                },
              ],
              direction: 'ltr',
            },
          ],
          direction: 'ltr',
        },
      },
    },
  });

  console.log(`\n✅ Created test post: ${post.id}`);
  console.log(`   URL: http://localhost:3000/admin/collections/posts/${post.id}`);
  console.log('\nNow manually add an embed block in the UI, then run:');
  console.log(`   npx tsx bin/migrations/inspectPost.ts ${post.id}`);
  console.log('\nThis will show us the correct block structure.\n');

  process.exit(0);
}

createTestPost().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
