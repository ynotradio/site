import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

/**
 * Add `headerImage` to the `pages` collection.
 *
 * Some legacy custom-text pages used a stylized `<img>` in place of a real
 * text title (e.g. year-end countdown banners). headerImage preserves that
 * banner graphic as a Media reference without repurposing the plain-text
 * `title` field. See docs/payload-migration/15-custom-text-strategy.md.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages"
      ADD COLUMN IF NOT EXISTS "header_image_id" integer;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "pages"
        ADD CONSTRAINT "pages_header_image_id_media_id_fk"
        FOREIGN KEY ("header_image_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "pages_header_image_idx"
      ON "pages" USING btree ("header_image_id");
  `);

  await db.execute(sql`
    ALTER TABLE "_pages_v"
      ADD COLUMN IF NOT EXISTS "version_header_image_id" integer;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_pages_v"
        ADD CONSTRAINT "_pages_v_version_header_image_id_media_id_fk"
        FOREIGN KEY ("version_header_image_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "_pages_v_version_version_header_image_idx"
      ON "_pages_v" USING btree ("version_header_image_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_pages_v"
      DROP COLUMN IF EXISTS "version_header_image_id";
  `);
  await db.execute(sql`
    ALTER TABLE "pages"
      DROP COLUMN IF EXISTS "header_image_id";
  `);
}
