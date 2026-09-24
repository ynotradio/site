import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

/**
 * Give `pages` a hybrid body: a raw-HTML column alongside the existing Lexical
 * `content`, chosen per page by a new `content_type` discriminator.
 *
 *   content_type = 'html'     -> render `content_html` verbatim
 *   content_type = 'richText' -> render Lexical `content` through the converter
 *
 * See docs/payload-migration/15-custom-text-strategy.md. Most legacy custom
 * texts are hand-authored HTML (iframes, tables, PayPal forms) that the
 * HTML->Lexical->HTML round-trip mangled; storing and rendering the raw blob
 * removes that whole failure mode.
 *
 * Columns are added to both `pages` and the `_pages_v` version table (drafts
 * are enabled). Existing rows predate this split and hold Lexical content, so
 * they are backfilled to 'richText'; the column DEFAULT is 'html' to match the
 * collection's field default for pages created from here on.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Discriminator enum (Payload names select enums enum_<table>_<field>).
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_content_type" AS ENUM('html', 'richText');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  // pages: add columns nullable/defaultless first so the backfill can tell
  // existing (Lexical) rows apart, then set the go-forward default.
  await db.execute(sql`
    ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "content_type" "enum_pages_content_type";
    ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "content_html" varchar;
  `);
  await db.execute(sql`
    UPDATE "pages" SET "content_type" = 'richText' WHERE "content_type" IS NULL;
  `);
  await db.execute(sql`
    ALTER TABLE "pages" ALTER COLUMN "content_type" SET DEFAULT 'html';
  `);

  // _pages_v: mirror onto the version table.
  await db.execute(sql`
    ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_content_type" "enum_pages_content_type";
    ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_content_html" varchar;
  `);
  await db.execute(sql`
    UPDATE "_pages_v" SET "version_content_type" = 'richText' WHERE "version_content_type" IS NULL;
  `);
  await db.execute(sql`
    ALTER TABLE "_pages_v" ALTER COLUMN "version_content_type" SET DEFAULT 'html';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_content_html";
    ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_content_type";
  `);
  await db.execute(sql`
    ALTER TABLE "pages" DROP COLUMN IF EXISTS "content_html";
    ALTER TABLE "pages" DROP COLUMN IF EXISTS "content_type";
  `);
  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_pages_content_type";
  `);
}
