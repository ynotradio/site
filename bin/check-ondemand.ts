import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Client } = pg;
const connectionString = process.env.NEON_DEV_DATABASE_URL || process.env.DATABASE_URI;

const client = new Client({ 
  connectionString,
  ssl: { rejectUnauthorized: true }
});

async function checkOnDemand() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');
    
    // Check ondemand table columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ondemand'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 OnDemand table columns:\n');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check for relationship tables
    console.log('\n🔗 Checking for relationship tables:\n');
    const relTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%ondemand%rels%'
      ORDER BY table_name
    `);
    
    if (relTables.rows.length > 0) {
      relTables.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
      
      // Check columns in relationship table
      for (const row of relTables.rows) {
        const relCols = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [row.table_name]);
        
        console.log(`\n  Columns in ${row.table_name}:`);
        relCols.rows.forEach(col => {
          console.log(`    ${col.column_name.padEnd(20)} ${col.data_type}`);
        });
      }
    } else {
      console.log('  ⚠ No relationship tables found');
    }
    
  } catch (err: any) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkOnDemand();
