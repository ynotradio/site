import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Client } = pg;
const connectionString = process.env.NEON_DEV_DATABASE_URL || process.env.DATABASE_URI;

if (!connectionString) {
  console.error('❌ No database connection string found');
  process.exit(1);
}

console.log('Using connection string (masked):', connectionString.replace(/:[^:@]+@/, ':***@'));

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: true },
});

async function dropAllTables() {
  try {
    await client.connect();
    console.log('✓ Connected to Neon dev database');

    // Drop all tables
    await client.query('DROP SCHEMA public CASCADE');
    console.log('✓ Dropped public schema and all tables');

    await client.query('CREATE SCHEMA public');
    console.log('✓ Created fresh public schema');

    await client.query('GRANT ALL ON SCHEMA public TO neondb_owner');
    await client.query('GRANT ALL ON SCHEMA public TO public');
    console.log('✓ Granted permissions');

    // Verify empty database
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`✓ Database is now empty. Tables remaining: ${result.rows.length}`);
  } catch (err: any) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

dropAllTables();
