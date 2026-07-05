import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_top11_contests_message_snapshot_recording_source" AS ENUM('mixcloud', 'opendrive', 'other');
  ALTER TABLE "top11_contests_message_snapshot_band_links" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "top11_contests_message_snapshot_band_links" CASCADE;
  ALTER TABLE "top11_contests" ADD COLUMN "message_snapshot_recording_url" varchar;
  ALTER TABLE "top11_contests" ADD COLUMN "message_snapshot_recording_source" "enum_top11_contests_message_snapshot_recording_source";
  ALTER TABLE "top11_contests_entries" ALTER COLUMN "display_order" DROP NOT NULL;
  ALTER TABLE "top11_contests" DROP COLUMN "title";
  ALTER TABLE "top11_contests" DROP COLUMN "external_template_url";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "top11_contests" ADD COLUMN "title" varchar NOT NULL DEFAULT '';
  ALTER TABLE "top11_contests" ADD COLUMN "external_template_url" varchar;
  ALTER TABLE "top11_contests_entries" ALTER COLUMN "display_order" SET NOT NULL;
  ALTER TABLE "top11_contests" DROP COLUMN "message_snapshot_recording_url";
  ALTER TABLE "top11_contests" DROP COLUMN "message_snapshot_recording_source";
  DROP TYPE "public"."enum_top11_contests_message_snapshot_recording_source";
  CREATE TABLE "top11_contests_message_snapshot_band_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"band_name" varchar NOT NULL,
  	"website_url" varchar NOT NULL
  );
  ALTER TABLE "top11_contests_message_snapshot_band_links" ADD CONSTRAINT "top11_contests_message_snapshot_band_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."top11_contests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "top11_contests_message_snapshot_band_links_order_idx" ON "top11_contests_message_snapshot_band_links" USING btree ("_order");
  CREATE INDEX "top11_contests_message_snapshot_band_links_parent_id_idx" ON "top11_contests_message_snapshot_band_links" USING btree ("_parent_id");`)
}
