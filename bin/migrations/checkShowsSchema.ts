#!/usr/bin/env tsx
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(
  process.env.LOCAL_DATABASE_URL
    || process.env.DATABASE_URI
    || process.env.PREVIEW_DATABASE_URL
    || process.env.NEON_DEV_DATABASE_URL!,
);

async function checkSchema() {
  console.log('Checking shows table schema...');
  const columns = await sql`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns 
    WHERE table_name = 'shows'
    ORDER BY ordinal_position
  `;

  console.log('Columns in shows table:');
  columns.forEach((col) => {
    console.log(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`);
  });

  await sql.end();
}

checkSchema();
