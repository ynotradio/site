import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

/**
 * Add the `editor_events` collection — the editor-experience observability log.
 *
 * Captures editor-facing errors and empty searches (written by server hooks;
 * see payload/src/collections/hooks/observability.ts). `payload_locked_documents_rels`
 * gains an `editor_events_id` column so Payload's admin document-locking can
 * reference the collection like any other.
 *
 * One statement per db.execute call — combining multiple DDL statements in a
 * single sql`` template can silently execute only the first statement depending
 * on the driver/query path.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_editor_events_type" AS ENUM('error', 'empty-search');
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "editor_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "type" "enum_editor_events_type" NOT NULL,
      "collection_slug" varchar,
      "operation" varchar,
      "message" varchar,
      "field_path" varchar,
      "search_query" varchar,
      "user_email" varchar,
      "user_id" varchar,
      "url" varchar,
      "user_agent" varchar,
      "details" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "editor_events_type_idx" ON "editor_events" USING btree ("type");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "editor_events_collection_slug_idx" ON "editor_events" USING btree ("collection_slug");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "editor_events_user_email_idx" ON "editor_events" USING btree ("user_email");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "editor_events_updated_at_idx" ON "editor_events" USING btree ("updated_at");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "editor_events_created_at_idx" ON "editor_events" USING btree ("created_at");
  `);

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "editor_events_id" integer;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_editor_events_fk"
        FOREIGN KEY ("editor_events_id") REFERENCES "public"."editor_events"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_editor_events_id_idx"
      ON "payload_locked_documents_rels" USING btree ("editor_events_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_editor_events_fk";
  `);
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "editor_events_id";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "editor_events" CASCADE;
  `);
  await db.execute(sql`
    DROP TYPE IF EXISTS "enum_editor_events_type";
  `);
}
