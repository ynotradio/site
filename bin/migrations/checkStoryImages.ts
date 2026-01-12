import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '../../payload.config';

const checkStories = async () => {
  const payload = await getPayloadHMR({ config });
  
  const result = await payload.find({
    collection: 'posts',
    where: {
      _status: { equals: 'published' },
    },
    sort: 'priority',
    limit: 15,
  });
  
  console.log(`\nTotal posts: ${result.totalDocs}\n`);
  console.log('First 15 posts:');
  console.log('='.repeat(80));
  
  result.docs.forEach((story: any, idx: number) => {
    const hasImage = story.image_id || story.image || story.image_url;
    console.log(`${idx + 1}. ${story.headline || 'No headline'}`);
    console.log(`   Priority: ${story.priority}, Start: ${story.start_date?.substring(0,10)}, End: ${story.end_date?.substring(0,10)}`);
    console.log(`   Image ID: ${story.image_id || 'none'}, Image URL: ${story.image_url || 'none'}`);
    console.log(`   Has image relation: ${typeof story.image}`);
  });
  
  const withoutImages = result.docs.filter((s: any) => !s.image_id && !s.image && !s.image_url);
  console.log(`\n⚠️  Posts without images: ${withoutImages.length} / ${result.docs.length}`);
  
  process.exit(0);
};

checkStories().catch((err) => {
  console.error(err);
  process.exit(1);
});
