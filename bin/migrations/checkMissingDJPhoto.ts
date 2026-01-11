import { connectToDatabase } from './database';
import { getPayloadClient } from './shared/payloadClient';

async function checkMissing() {
  const mysql = await connectToDatabase();
  const payload = await getPayloadClient('dev');

  // Get DJ from MySQL
  const [mysqlDjs] = await mysql.query(`
    SELECT id, name, pic, deleted, email
    FROM deejays 
    WHERE id = 75
  `) as any[];

  if (mysqlDjs.length === 0) {
    console.log('DJ 75 not found in MySQL');
  } else {
    const dj = mysqlDjs[0];
    console.log('\nMySQL DJ 75:');
    console.log(`  Name: ${dj.name}`);
    console.log(`  Pic: ${dj.pic}`);
    console.log(`  Deleted: ${dj.deleted}`);
    console.log(`  Email: ${dj.email}`);
  }

  // Get DJ from Payload
  const payloadDj = await payload.find({
    collection: 'djs',
    where: {
      legacyId: { equals: 75 },
    },
    depth: 2,
  });

  if (payloadDj.totalDocs === 0) {
    console.log('\nDJ 75 not found in Payload');
  } else {
    const dj = payloadDj.docs[0];
    console.log('\nPayload DJ 75:');
    console.log(`  ID: ${dj.id}`);
    console.log(`  Person: ${JSON.stringify(dj.person, null, 2)}`);
    console.log(`  Photo: ${dj.photo}`);
    console.log(`  OnAir: ${dj.onAir}`);
  }

  await mysql.end();
  process.exit(0);
}

checkMissing();
