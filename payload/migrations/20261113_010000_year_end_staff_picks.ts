import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

const pickTable = (table: string) => [
  sql.raw(`
    CREATE TABLE IF NOT EXISTS "${table}" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "artist" varchar,
      "title" varchar
    );
  `),
  sql.raw(`
    DO $$ BEGIN
      ALTER TABLE "${table}" ADD CONSTRAINT "${table}_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_staff_picks"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `),
  sql.raw(`CREATE INDEX IF NOT EXISTS "${table}_order_idx" ON "${table}" USING btree ("_order");`),
  sql.raw(
    `CREATE INDEX IF NOT EXISTS "${table}_parent_id_idx" ON "${table}" USING btree ("_parent_id");`,
  ),
];

const statementsUp = [
  sql`
    CREATE TABLE IF NOT EXISTS "year_end_staff_picks" (
      "id" serial PRIMARY KEY NOT NULL,
      "year" numeric NOT NULL,
      "name" varchar NOT NULL,
      "dj_id" integer,
      "show_name" varchar,
      "sort_order" numeric DEFAULT 100,
      "details" varchar,
      "mixcloud_url" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `,
  sql`
    DO $$ BEGIN
      ALTER TABLE "year_end_staff_picks" ADD CONSTRAINT "year_end_staff_picks_dj_id_djs_id_fk"
        FOREIGN KEY ("dj_id") REFERENCES "public"."djs"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `,
  sql`CREATE INDEX IF NOT EXISTS "year_end_staff_picks_year_idx" ON "year_end_staff_picks" USING btree ("year");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_staff_picks_dj_idx" ON "year_end_staff_picks" USING btree ("dj_id");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_staff_picks_updated_at_idx" ON "year_end_staff_picks" USING btree ("updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_staff_picks_created_at_idx" ON "year_end_staff_picks" USING btree ("created_at");`,
  ...pickTable('year_end_staff_picks_songs'),
  ...pickTable('year_end_staff_picks_albums'),
  sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "year_end_staff_picks_id" integer;`,
  sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_year_end_staff_picks_fk"
        FOREIGN KEY ("year_end_staff_picks_id") REFERENCES "public"."year_end_staff_picks"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `,
  sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_year_end_staff_picks_id_idx" ON "payload_locked_documents_rels" USING btree ("year_end_staff_picks_id");`,
];

const statementsDown = [
  sql`ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_year_end_staff_picks_fk";`,
  sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "year_end_staff_picks_id";`,
  sql`DROP TABLE IF EXISTS "year_end_staff_picks_songs" CASCADE;`,
  sql`DROP TABLE IF EXISTS "year_end_staff_picks_albums" CASCADE;`,
  sql`DROP TABLE IF EXISTS "year_end_staff_picks" CASCADE;`,
];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of statementsUp) {
    // eslint-disable-next-line no-await-in-loop
    await db.execute(statement);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const statement of statementsDown) {
    // eslint-disable-next-line no-await-in-loop
    await db.execute(statement);
  }
}
