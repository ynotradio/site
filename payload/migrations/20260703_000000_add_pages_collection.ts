import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

/**
 * Create the `pages` collection tables.
 *
 * `pages` is a dedicated home for the ~35 legacy `custom_texts` records
 * (donate, contests, rodney, etc.) — separate from `posts` (front-page
 * stories). See docs/payload-migration/15-custom-text-strategy.md.
 *
 * Tables created:
 *   pages         — published / draft pages
 *   _pages_v      — version history (drafts support)
 *
 * `payload_locked_documents_rels` gains a `pages_id` column so Payload can
 * track which editor has a page locked for editing.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Status enums
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  // pages table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar,
      "content" jsonb,
      "legacy_id" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_pages_status" DEFAULT 'draft'
    );
  `);

  // _pages_v versions table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_pages_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_title" varchar,
      "version_generate_slug" boolean DEFAULT true,
      "version_slug" varchar,
      "version_content" jsonb,
      "version_legacy_id" numeric,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__pages_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean
    );
  `);

  // FK constraints
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_pages_v"
        ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  // Indexes on pages
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "pages_slug_idx"      ON "pages" USING btree ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "pages_legacy_id_idx" ON "pages" USING btree ("legacy_id");
    CREATE INDEX        IF NOT EXISTS "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
    CREATE INDEX        IF NOT EXISTS "pages_created_at_idx" ON "pages" USING btree ("created_at");
    CREATE INDEX        IF NOT EXISTS "pages__status_idx"    ON "pages" USING btree ("_status");
  `);

  // Indexes on _pages_v
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_pages_v_parent_idx"
      ON "_pages_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_version_version_slug_idx"
      ON "_pages_v" USING btree ("version_slug");
    CREATE INDEX IF NOT EXISTS "_pages_v_version_version_legacy_id_idx"
      ON "_pages_v" USING btree ("version_legacy_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_version_version__status_idx"
      ON "_pages_v" USING btree ("version__status");
    CREATE INDEX IF NOT EXISTS "_pages_v_created_at_idx"
      ON "_pages_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_pages_v_updated_at_idx"
      ON "_pages_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_pages_v_latest_idx"
      ON "_pages_v" USING btree ("latest");
  `);

  // Document-locking support: add pages_id column to the existing
  // payload_locked_documents_rels table
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "pages_id" integer;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_pages_fk"
        FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_pages_id_idx"
      ON "payload_locked_documents_rels" USING btree ("pages_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "pages_id";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "_pages_v";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "pages";
  `);
  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum__pages_v_version_status";
  `);
  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_pages_status";
  `);
}
