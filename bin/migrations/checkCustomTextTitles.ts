import { connectToDatabase } from './database';

async function check() {
  const connection = await connectToDatabase();

  const query = `
    SELECT id, title, permalink, 
           CASE WHEN title LIKE '<img%' THEN 'HTML' ELSE 'Text' END as title_type
    FROM custom_texts 
    WHERE status = 'active' 
    ORDER BY id ASC
  `;

  const [rows] = await connection.query(query);

  console.log('\n📋 Custom Text Titles Analysis:');
  console.log('================================================================================');

  let htmlTitles = 0;
  let textTitles = 0;

  for (const row of rows as any[]) {
    if (row.title_type === 'HTML') {
      htmlTitles++;
      console.log(`ID ${row.id}: [HTML] "${row.title.substring(0, 60)}..." (permalink: ${row.permalink})`);
    } else {
      textTitles++;
    }
  }

  console.log('================================================================================');
  console.log(`Text Titles: ${textTitles}`);
  console.log(`HTML Titles: ${htmlTitles}`);
  console.log('================================================================================\n');

  await connection.end();
  process.exit(0);
}

check().catch(console.error);
