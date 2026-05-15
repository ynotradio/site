#!/usr/bin/env tsx
/**
 * Fix the shows table schema manually
 */

/* eslint-disable import/no-extraneous-dependencies */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
/* eslint-enable import/no-extraneous-dependencies */

// Load environment
dotenv.config({ path: '.env.local' });

const DATABASE_URI = process.env.LOCAL_DATABASE_URL
  || process.env.DATABASE_URI
  || process.env.PREVIEW_DATABASE_URL
  || process.env.NEON_DEV_DATABASE_URL;

if (!DATABASE_URI) {
  throw new Error('DATABASE_URI not found in environment');
}

async function fixSchema() {
  console.log('Connecting to database...');
  const client = postgres(DATABASE_URI);
  const db = drizzle(client);

  try {
    console.log('Checking current schema...');

    // Add name column (drop first if it exists with wrong type)
    console.log('Fixing name column...');
    await db.execute(sql`ALTER TABLE shows DROP COLUMN IF EXISTS name`);
    await db.execute(sql`ALTER TABLE shows ADD COLUMN name TEXT`);

    // Add displayName column to djs if it doesn't exist
    console.log('Adding displayName column to djs...');
    await db.execute(sql`ALTER TABLE djs ADD COLUMN IF NOT EXISTS "displayName" TEXT`);

    // Drop day column from shows if it exists (we calculate it from date in PHP now)
    console.log('Dropping day column from shows if it exists...');
    await db.execute(sql`ALTER TABLE shows DROP COLUMN IF EXISTS day`);

    // Handle note column conversion from text to jsonb
    console.log('Converting note column to jsonb...');
    const hasNoteColumn = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shows' AND column_name = 'note'
    `);

    console.log('Note column check result:', hasNoteColumn);

    if (hasNoteColumn && Array.isArray(hasNoteColumn) && hasNoteColumn.length > 0 && (hasNoteColumn[0].data_type === 'text' || hasNoteColumn[0].data_type === 'character varying')) {
      console.log('Note column is text, converting to jsonb...');
      await db.execute(sql`ALTER TABLE shows ADD COLUMN note_new JSONB`);
      await db.execute(sql`UPDATE shows SET note_new = CASE WHEN note IS NULL OR note = ${''} THEN NULL ELSE to_jsonb(note) END`);
      await db.execute(sql`ALTER TABLE shows DROP COLUMN note`);
      await db.execute(sql`ALTER TABLE shows RENAME COLUMN note_new TO note`);
      console.log('Note column converted successfully');
    } else {
      console.log('Note column is already jsonb or does not exist');
    }

    console.log('Schema migration completed successfully!');
  } catch (error) {
    console.error('Error fixing schema:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixSchema().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
