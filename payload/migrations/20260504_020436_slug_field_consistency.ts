import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "cdoftheweek" ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_cdoftheweek_v" ADD COLUMN IF NOT EXISTS "version_generate_slug" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP COLUMN IF EXISTS "generate_slug";
  ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_generate_slug";
  ALTER TABLE "cdoftheweek" DROP COLUMN IF EXISTS "generate_slug";
  ALTER TABLE "_cdoftheweek_v" DROP COLUMN IF EXISTS "version_generate_slug";`)
}
