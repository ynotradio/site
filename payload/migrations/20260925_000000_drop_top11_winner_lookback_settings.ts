import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

// Winner draws no longer exclude prior winners (#899). The contest-level
// settings are dropped; the per-draw flag stays as history but loses its
// default so new draws don't claim an exclusion that never happened.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "top11_contests" DROP COLUMN IF EXISTS "settings_exclude_prior_winners";
  ALTER TABLE "top11_contests" DROP COLUMN IF EXISTS "settings_prior_winner_lookback_contests";
  ALTER TABLE "top11_winner_draws" ALTER COLUMN "exclude_prior_winners" DROP DEFAULT;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "top11_contests" ADD COLUMN "settings_exclude_prior_winners" boolean DEFAULT true;
  ALTER TABLE "top11_contests" ADD COLUMN "settings_prior_winner_lookback_contests" numeric DEFAULT 8;
  ALTER TABLE "top11_winner_draws" ALTER COLUMN "exclude_prior_winners" SET DEFAULT true;`);
}
