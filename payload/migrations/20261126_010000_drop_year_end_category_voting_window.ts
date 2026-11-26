import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

// The public poll only enforces the poll's window, so per-category dates were
// shown to editors but ignored.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "year_end_poll_categories" DROP COLUMN IF EXISTS "voting_opens_at";
  ALTER TABLE "year_end_poll_categories" DROP COLUMN IF EXISTS "voting_closes_at";`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "year_end_poll_categories" ADD COLUMN IF NOT EXISTS "voting_opens_at" timestamp(3) with time zone;
  ALTER TABLE "year_end_poll_categories" ADD COLUMN IF NOT EXISTS "voting_closes_at" timestamp(3) with time zone;`);
}
