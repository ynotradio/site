import { getPayload } from 'payload';
import config from '../../payload.config';

const checkData = async () => {
  const payload = await getPayload({ config });

  // Check with no filters
  const result = await payload.find({
    collection: 'cdoftheweek',
    limit: 10,
  });

  console.log(`\nTotal CD of the Week records: ${result.totalDocs}`);
  console.log('With any status:\n');

  result.docs.forEach((cd: any, idx: number) => {
    // eslint-disable-next-line no-underscore-dangle
    console.log(`${idx + 1}. Status: ${cd._status}`);
    console.log(`   Record ID: ${cd.record_id}, Date: ${cd.date}`);
  });

  process.exit(0);
};

checkData().catch(console.error);
