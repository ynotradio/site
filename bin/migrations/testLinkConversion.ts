import { connectToDatabase } from './database';
import { convertHtmlToLexical } from './shared/importUtils';

async function test() {
  const connection = await connectToDatabase();
  
  const [rows] = await connection.query(
    'SELECT story FROM stories WHERE id = 7',
  );
  
  const story = (rows as any[])[0].story;
  
  console.log('HTML:', story);
  console.log('\n---\n');
  
  const lexical = convertHtmlToLexical(story);
  
  console.log('Lexical:', JSON.stringify(lexical, null, 2));
  
  await connection.end();
}

test().catch(console.error);
