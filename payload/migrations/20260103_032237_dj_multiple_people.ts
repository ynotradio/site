import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "djs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  ALTER TABLE "djs" DROP CONSTRAINT "djs_person_id_people_id_fk";
  
  DROP INDEX "djs_person_idx";
  ALTER TABLE "djs_rels" ADD CONSTRAINT "djs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."djs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "djs_rels" ADD CONSTRAINT "djs_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "djs_rels_order_idx" ON "djs_rels" USING btree ("order");
  CREATE INDEX "djs_rels_parent_idx" ON "djs_rels" USING btree ("parent_id");
  CREATE INDEX "djs_rels_path_idx" ON "djs_rels" USING btree ("path");
  CREATE INDEX "djs_rels_people_id_idx" ON "djs_rels" USING btree ("people_id");
  ALTER TABLE "djs" DROP COLUMN "person_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "djs_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "djs_rels" CASCADE;
  ALTER TABLE "djs" ADD COLUMN "person_id" integer;
  ALTER TABLE "djs" ADD CONSTRAINT "djs_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "djs_person_idx" ON "djs" USING btree ("person_id");`)
}
