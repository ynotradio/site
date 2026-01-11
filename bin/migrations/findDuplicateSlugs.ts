import { getPayloadClient } from './shared/payloadClient';

async function findDuplicates() {
  const payload = await getPayloadClient('dev');

  // Get all posts
  const result = await payload.find({
    collection: 'posts',
    limit: 1000,
    sort: 'slug',
  });

  console.log(`Total posts in Payload: ${result.totalDocs}`);

  // Find duplicate slugs
  const slugCounts = new Map<string, any[]>();
  for (const post of result.docs) {
    const existing = slugCounts.get(post.slug) || [];
    existing.push(post);
    slugCounts.set(post.slug, existing);
  }

  const duplicates = Array.from(slugCounts.entries())
    .filter(([, posts]) => posts.length > 1);

  console.log(`\nFound ${duplicates.length} duplicate slugs in Payload:`);
  for (const [slug, posts] of duplicates) {
    console.log(`\n${slug}:`);
    for (const post of posts) {
      console.log(`  ID ${post.id} (legacyId: ${post.legacyId}): "${post.headline}"`);
    }
  }

  process.exit(0);
}

findDuplicates();
