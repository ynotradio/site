import { getPayload } from 'payload';
import config from './payload.config.js';

const checkStoryData = async () => {
  const payload = await getPayload({ config });
  
  // Check active stories
  const stories = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { type: { equals: 'story' } },
        { _status: { equals: 'published' } },
        { start_date: { less_than_equal: new Date().toISOString() } },
        { end_date: { greater_than_equal: new Date().toISOString() } }
      ]
    },
    sort: 'priority',
    limit: 20
  });
  
  console.log(`\n=== Active Stories ===`);
  console.log(`Total: ${stories.totalDocs}`);
  console.log(`\nFirst 10 stories:`);
  
  stories.docs.slice(0, 10).forEach((story, idx) => {
    console.log(`\n${idx + 1}. ${story.headline || story.title}`);
    console.log(`   ID: ${story.id}`);
    console.log(`   Priority: ${story.priority}`);
    console.log(`   Start: ${story.start_date}`);
    console.log(`   End: ${story.end_date}`);
    console.log(`   Image ID: ${story.image_id || story.image || 'NONE'}`);
    console.log(`   Image URL: ${story.image_url || 'NONE'}`);
  });
  
  process.exit(0);
};

checkStoryData().catch(console.error);
