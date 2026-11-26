import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

// These collections enable query presets, but the year end migrations never
// added them to the presets' collection enum, so saving a preset failed on
// migrated databases.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_payload_query_presets_related_collection" ADD VALUE IF NOT EXISTS 'year-end-poll-write-ins';
  ALTER TYPE "public"."enum_payload_query_presets_related_collection" ADD VALUE IF NOT EXISTS 'year-end-poll-contestants';
  ALTER TYPE "public"."enum_payload_query_presets_related_collection" ADD VALUE IF NOT EXISTS 'year-end-staff-picks';`);
}

// Postgres can't drop enum values; leaving them is harmless.
export async function down(_args: MigrateDownArgs): Promise<void> {}
