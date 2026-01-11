/**
 * Debug block structure in posts
 */

import { getPayloadClient } from './shared/payloadClient';

async function debug() {
  const payload = await getPayloadClient('dev');

  const post = await payload.findByID({
    collection: 'posts',
    id: '864',
  });

  console.log('\n📄 Post 864 - Quarantine Takeovers');
  console.log('================================================================================');

  // Find all block nodes
  const { children } = post.content.root;

  console.log(`Total children: ${children.length}`);
  console.log('\nNode types present:');

  const typeCounts: Record<string, number> = {};
  children.forEach((child: any) => {
    typeCounts[child.type] = (typeCounts[child.type] || 0) + 1;
  });

  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Show first block in detail
  const firstBlock = children.find((child: any) => child.type === 'block');
  if (firstBlock) {
    console.log('\n📦 First Block Node (full structure):');
    console.log(JSON.stringify(firstBlock, null, 2));
  }

  process.exit(0);
}

debug().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
