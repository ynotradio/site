import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

/**
 * Add searchable text columns to cdoftheweek and ondemand tables.
 *
 * cdoftheweek.record_text — denormalized "Artist — Album" string from the
 *   linked record's displayName, used as a listSearchableFields target so
 *   content managers can search reviews by album or artist name.
 *
 * ondemand.artists_text — comma-separated artist names for the recording.
 * ondemand.songs_text   — comma-separated song displayNames (Artist — Title)
 *   for the recording.
 *
 * All three are populated automatically via Payload field hooks on save.
 * Existing rows backfill on next save.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "cdoftheweek" ADD COLUMN IF NOT EXISTS "record_text" varchar`);
  await db.execute(sql`ALTER TABLE "_cdoftheweek_v" ADD COLUMN IF NOT EXISTS "version_record_text" varchar`);

  await db.execute(sql`ALTER TABLE "ondemand" ADD COLUMN IF NOT EXISTS "artists_text" varchar`);
  await db.execute(sql`ALTER TABLE "_ondemand_v" ADD COLUMN IF NOT EXISTS "version_artists_text" varchar`);

  await db.execute(sql`ALTER TABLE "ondemand" ADD COLUMN IF NOT EXISTS "songs_text" varchar`);
  await db.execute(sql`ALTER TABLE "_ondemand_v" ADD COLUMN IF NOT EXISTS "version_songs_text" varchar`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "ondemand" DROP COLUMN IF EXISTS "songs_text"`);
  await db.execute(sql`ALTER TABLE "_ondemand_v" DROP COLUMN IF EXISTS "version_songs_text"`);

  await db.execute(sql`ALTER TABLE "ondemand" DROP COLUMN IF EXISTS "artists_text"`);
  await db.execute(sql`ALTER TABLE "_ondemand_v" DROP COLUMN IF EXISTS "version_artists_text"`);

  await db.execute(sql`ALTER TABLE "_cdoftheweek_v" DROP COLUMN IF EXISTS "version_record_text"`);
  await db.execute(sql`ALTER TABLE "cdoftheweek" DROP COLUMN IF EXISTS "record_text"`);
}
