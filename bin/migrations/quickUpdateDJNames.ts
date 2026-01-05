#!/usr/bin/env tsx
/**
 * Simple script to populate displayName for all DJs using direct SQL
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '.env.local' });

const DATABASE_URI = process.env.NEON_DEV_DATABASE_URL || process.env.DATABASE_URI;

if (!DATABASE_URI) {
  throw new Error('DATABASE_URI not found in environment');
}

async function updateDJDisplayNames() {
  console.log('Connecting to database...');
  const sql = postgres(DATABASE_URI);

  try {
    console.log('Fetching all DJs with their person relationships...');

    // Get all DJs
    const djs = await sql`
      SELECT 
        id, 
        "displayName" as current_display_name
      FROM djs
    `;

    console.log(`Found ${djs.length} DJs to process`);

    let updated = 0;
    let skipped = 0;

    for (const dj of djs) {
      // Skip if already has a good displayName
      if (dj.current_display_name && !dj.current_display_name.startsWith('DJ #')) {
        console.log(`DJ ${dj.id} already has displayName: ${dj.current_display_name}, skipping`);
        skipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      let displayName = `DJ #${dj.id}`;

      // Get person IDs for this DJ
      const rels = await sql`
        SELECT people_id 
        FROM djs_rels 
        WHERE parent_id = ${dj.id} AND path = 'person'
        ORDER BY "order"
      `;

      if (rels.length > 0) {
        const personIds = rels.map((r) => r.people_id);

        // Get person names
        const people = await sql`
          SELECT name 
          FROM people 
          WHERE id = ANY(${personIds})
          ORDER BY id
        `;

        if (people.length > 0) {
          displayName = people.map((p) => p.name).join(', ');
        }
      }

      // Update the DJ
      await sql`
        UPDATE djs 
        SET "displayName" = ${displayName}
        WHERE id = ${dj.id}
      `;

      console.log(`Updated DJ ${dj.id}: displayName="${displayName}"`);
      updated += 1;
    }

    console.log(`\nCompleted! Updated: ${updated}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('Error updating DJ displayNames:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

updateDJDisplayNames().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
