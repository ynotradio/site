import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "top11_contests_nominees" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"song_id" integer NOT NULL
  );
  ALTER TABLE "top11_contests_nominees" ADD CONSTRAINT "top11_contests_nominees_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "top11_contests_nominees" ADD CONSTRAINT "top11_contests_nominees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."top11_contests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "top11_contests_nominees_order_idx" ON "top11_contests_nominees" USING btree ("_order");
  CREATE INDEX "top11_contests_nominees_parent_id_idx" ON "top11_contests_nominees" USING btree ("_parent_id");
  CREATE INDEX "top11_contests_nominees_song_idx" ON "top11_contests_nominees" USING btree ("song_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "top11_contests_nominees" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "top11_contests_nominees" CASCADE;`)
}
