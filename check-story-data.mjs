import { getPayload } from 'payload';
import config from './payload.config.ts';

const checkStoryData = async () => {
  const payload = await getPayload({ config });
  
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
    limit: 10
  });
  
  console.log(`Active Stories: ${stories.totalDocs}`);
  
  stories.docs.forEach((story, idx) => {
    console.log(`\n${idx + 1}. ${story.headline}`);
    console.log(`   Priority: ${story.priority}`);
    console.log(`   Image: ${story.image_id ? `ID ${story.image_id}` : story.image_url || 'NONE'}`);
  });
  
  process.exit(0);
};

checkStoryData().catch(console.error);
