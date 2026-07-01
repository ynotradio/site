import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "cdoftheweek" ADD COLUMN IF NOT EXISTS "slug" varchar;
    ALTER TABLE "_cdoftheweek_v" ADD COLUMN IF NOT EXISTS "version_slug" varchar;
    CREATE UNIQUE INDEX IF NOT EXISTS "cdoftheweek_slug_idx" ON "cdoftheweek" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "_cdoftheweek_v_version_slug_idx" ON "_cdoftheweek_v" USING btree ("version_slug");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "_cdoftheweek_v_version_slug_idx";
    DROP INDEX IF EXISTS "cdoftheweek_slug_idx";
    ALTER TABLE "_cdoftheweek_v" DROP COLUMN IF EXISTS "version_slug";
    ALTER TABLE "cdoftheweek" DROP COLUMN IF EXISTS "slug";
  `)
}
