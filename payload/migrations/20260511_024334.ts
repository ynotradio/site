import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

/**
 * Add the payload-query-presets system collection introduced in Payload 3.76.
 *
 * The concert/ondemand/cdoftheweek columns included in the auto-generated diff
 * were already applied by prior hand-crafted migrations (batch 2), so this
 * file intentionally omits them to avoid "column already exists" failures on
 * production. The accompanying JSON snapshot still reflects the full expected
 * schema, so future migrate:create runs will produce clean diffs.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_payload_query_presets_access_read_constraint"
        AS ENUM('everyone', 'onlyMe', 'specificUsers');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_payload_query_presets_access_update_constraint"
        AS ENUM('everyone', 'onlyMe', 'specificUsers');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_payload_query_presets_access_delete_constraint"
        AS ENUM('everyone', 'onlyMe', 'specificUsers');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_payload_query_presets_related_collection"
        AS ENUM(
          'users', 'media', 'people', 'djs', 'artists', 'venues', 'ads',
          'songs', 'records', 'concerts', 'ondemand', 'shows', 'posts',
          'cdoftheweek', 'year-end-poll-results',
          'modern-rock-madness-tournaments', 'modern-rock-madness-groups',
          'modern-rock-madness-matches', 'modern-rock-madness-votes',
          'modern-rock-madness-match-events'
        );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload_query_presets" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "is_shared" boolean DEFAULT false,
      "access_read_constraint" "enum_payload_query_presets_access_read_constraint" DEFAULT 'onlyMe',
      "access_update_constraint" "enum_payload_query_presets_access_update_constraint" DEFAULT 'onlyMe',
      "access_delete_constraint" "enum_payload_query_presets_access_delete_constraint" DEFAULT 'onlyMe',
      "where" jsonb,
      "columns" jsonb,
      "group_by" varchar,
      "related_collection" "enum_payload_query_presets_related_collection" NOT NULL,
      "is_temp" boolean,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload_query_presets_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "users_id" integer
    );
  `);

  await db.execute(sql`
    ALTER TABLE "payload_query_presets_rels"
      ADD CONSTRAINT IF NOT EXISTS "payload_query_presets_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."payload_query_presets"("id")
        ON DELETE cascade ON UPDATE no action;
  `);
  await db.execute(sql`
    ALTER TABLE "payload_query_presets_rels"
      ADD CONSTRAINT IF NOT EXISTS "payload_query_presets_rels_users_fk"
        FOREIGN KEY ("users_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_query_presets_updated_at_idx"
      ON "payload_query_presets" USING btree ("updated_at");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_query_presets_created_at_idx"
      ON "payload_query_presets" USING btree ("created_at");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_query_presets_rels_order_idx"
      ON "payload_query_presets_rels" USING btree ("order");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_query_presets_rels_parent_idx"
      ON "payload_query_presets_rels" USING btree ("parent_id");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_query_presets_rels_path_idx"
      ON "payload_query_presets_rels" USING btree ("path");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_query_presets_rels_users_id_idx"
      ON "payload_query_presets_rels" USING btree ("users_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "payload_query_presets_rels" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "payload_query_presets" CASCADE;`);
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_payload_query_presets_access_read_constraint";`);
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_payload_query_presets_access_update_constraint";`);
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_payload_query_presets_access_delete_constraint";`);
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_payload_query_presets_related_collection";`);
}
