import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '../../payload.config';

const checkDb = async () => {
  const payload = await getPayloadHMR({ config });
  
  // Get one post to see actual structure
  const result = await payload.find({
    collection: 'posts',
    limit: 1,
  });
  
  if (result.docs[0]) {
    console.log('\nSample Post Fields:');
    console.log(JSON.stringify(result.docs[0], null, 2));
  }
  
  process.exit(0);
};

checkDb().catch(console.error);
