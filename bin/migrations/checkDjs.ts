import { getPayload } from 'payload';
import config from '../../payload.config';

const checkData = async () => {
  const payload = await getPayload({ config });
  
  const result = await payload.find({
    collection: 'djs',
    limit: 100,
  });
  
  console.log(`\nTotal DJs: ${result.totalDocs}`);
  console.log(`On Air: ${result.docs.filter((d: any) => d.on_air === true || d.onAir === true).length}`);
  console.log(`\nFirst 10 DJs:`);
  
  result.docs.slice(0, 10).forEach((dj: any, idx: number) => {
    console.log(`${idx + 1}. On Air: ${dj.on_air || dj.onAir || 'undefined'}, Sort: ${dj.sort_order || dj.sortOrder || 'N/A'}`);
    console.log(`   Person: ${dj.person?.map((p: any) => p.name).join(' & ') || 'N/A'}`);
  });
  
  process.exit(0);
};

checkData().catch(console.error);
