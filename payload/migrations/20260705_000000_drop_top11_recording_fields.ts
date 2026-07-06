import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "top11_contests" DROP COLUMN "message_snapshot_recording_url";
  ALTER TABLE "top11_contests" DROP COLUMN "message_snapshot_recording_source";
  DROP TYPE "public"."enum_top11_contests_message_snapshot_recording_source";`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_top11_contests_message_snapshot_recording_source" AS ENUM('mixcloud', 'opendrive', 'other');
  ALTER TABLE "top11_contests" ADD COLUMN "message_snapshot_recording_url" varchar;
  ALTER TABLE "top11_contests" ADD COLUMN "message_snapshot_recording_source" "enum_top11_contests_message_snapshot_recording_source";`);
}
