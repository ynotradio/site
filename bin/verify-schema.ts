import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Client } = pg;
const connectionString = process.env.NEON_DEV_DATABASE_URL || process.env.DATABASE_URI;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: true },
});

async function verifySchema() {
  try {
    await client.connect();
    console.log('✓ Connected to Neon dev database\n');

    // Get all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`📊 Total tables created: ${tables.rows.length}\n`);
    console.log('Tables:');
    tables.rows.forEach((row) => console.log(`  - ${row.table_name}`));

    // Get column counts for each table
    console.log('\n📋 Column counts per table:');
    await Promise.all(tables.rows.map(async (row) => {
      const columns = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `, [row.table_name]);
      console.log(`  ${row.table_name}: ${columns.rows[0].count} columns`);
    }));
  } catch (err: any) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifySchema();
