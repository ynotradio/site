import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

/**
 * Add `artists_text` column to concerts tables.
 *
 * This is a denormalized, searchable text field that stores the concatenated
 * names of the artists on a concert (e.g. "Band A, Band B"). It is populated
 * automatically via a Payload field hook on every save, and is used as a
 * listSearchableFields target so the admin list search works by artist name.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "concerts" ADD COLUMN IF NOT EXISTS "artists_text" varchar`);
  await db.execute(sql`ALTER TABLE "_concerts_v" ADD COLUMN IF NOT EXISTS "version_artists_text" varchar`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "concerts" DROP COLUMN IF EXISTS "artists_text"`);
  await db.execute(sql`ALTER TABLE "_concerts_v" DROP COLUMN IF EXISTS "version_artists_text"`);
}
