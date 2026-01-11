/**
 * Check total posts expected from MySQL
 */

import { connectToDatabase } from './database';

async function checkTotal() {
  const connection = await connectToDatabase();

  // Count all stories (including deleted, script filters them)
  const [storyRows] = await connection.query(
    'SELECT COUNT(*) as count FROM stories',
  );

  // Count active custom_texts
  const [customTextRows] = await connection.query(
    'SELECT COUNT(*) as count FROM custom_texts WHERE status = ?',
    ['active'],
  );

  const storyCount = (storyRows as any)[0].count;
  const customTextCount = (customTextRows as any)[0].count;
  const total = storyCount + customTextCount;

  console.log('\n📊 MySQL Database Totals:');
  console.log('================================================================================');
  console.log(`Stories (all): ${storyCount}`);
  console.log(`Custom Texts (active): ${customTextCount}`);
  console.log(`Total in MySQL: ${total}`);
  console.log('================================================================================\n');

  await connection.end();
  process.exit(0);
}

checkTotal().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
