import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Cleanup Migration: Remove Unused Fields
 * 
 * This migration removes fields that were included in the initial schema
 * but are not used in the current Payload collection definitions:
 * 
 * 1. djs.show_name - Never populated, replaced by description field
 * 2. shows.day - Never populated, date field includes day-of-week
 * 
 * See docs/migrations/reports/unused-fields-analysis.md for details.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- Remove unused show_name column from djs table
  ALTER TABLE "djs" DROP COLUMN IF EXISTS "show_name";
  
  -- Drop the show_name index if it exists
  DROP INDEX IF EXISTS "djs_show_name_idx";
  
  -- Remove unused day column from shows table
  ALTER TABLE "shows" DROP COLUMN IF EXISTS "day";
  
  -- Drop the now-unused enum type
  DROP TYPE IF EXISTS "enum_shows_day";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   -- Recreate enum type
  CREATE TYPE "enum_shows_day" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
  
  -- Re-add show_name column to djs table
  ALTER TABLE "djs" ADD COLUMN "show_name" varchar;
  CREATE INDEX "djs_show_name_idx" ON "djs" USING btree ("show_name");
  
  -- Re-add day column to shows table
  ALTER TABLE "shows" ADD COLUMN "day" "enum_shows_day";`)
}
