import { connectToDatabase } from './database';
import { getPayloadClient } from './shared/payloadClient';

async function check() {
  const mysql = await connectToDatabase();
  const payload = await getPayloadClient('dev');

  // Get all deleted story IDs from MySQL
  const [deletedStories] = await mysql.query(`
    SELECT id, headline 
    FROM stories 
    WHERE deleted = 'y'
    ORDER BY id
  `) as any[];

  console.log(`\nMySQL has ${deletedStories.length} deleted stories`);

  // Check how many of these are in Payload
  let importedDeleted = 0;
  const importedDeletedList: any[] = [];

  for (const story of deletedStories) {
    const result = await payload.find({
      collection: 'posts',
      where: {
        legacyId: { equals: story.id },
      },
      limit: 1,
    });

    if (result.totalDocs > 0) {
      importedDeleted++;
      importedDeletedList.push(story);
    }
  }

  console.log(`Payload has ${importedDeleted} of these deleted stories imported`);
  console.log('\nFirst 10 deleted stories that were imported:');
  for (let i = 0; i < Math.min(10, importedDeletedList.length); i++) {
    const story = importedDeletedList[i];
    console.log(`  ID ${story.id}: "${story.headline}"`);
  }

  await mysql.end();
  process.exit(0);
}

check();
