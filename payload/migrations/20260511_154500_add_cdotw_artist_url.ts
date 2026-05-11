import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "cdoftheweek" ADD COLUMN IF NOT EXISTS "artist_url" varchar`);
  await db.execute(sql`ALTER TABLE "_cdoftheweek_v" ADD COLUMN IF NOT EXISTS "version_artist_url" varchar`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "_cdoftheweek_v" DROP COLUMN IF EXISTS "version_artist_url"`);
  await db.execute(sql`ALTER TABLE "cdoftheweek" DROP COLUMN IF EXISTS "artist_url"`);
}
