import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "top11_contests" ADD COLUMN "settings_prior_winner_lookback_contests" numeric DEFAULT 8;

  -- Normalize the three mutually-exclusive voter identity columns into one
  -- generated key so a single unique index can enforce one vote per contest
  -- per voter at the database level (previously only enforced by a racy
  -- application-level find-then-create check).
  ALTER TABLE "top11_votes" ADD COLUMN "voter_key" varchar GENERATED ALWAYS AS (
    COALESCE("voter_auth0_id", "voter_user_id", "voter_email")
  ) STORED;

  CREATE UNIQUE INDEX "top11_votes_contest_voter_key_idx" ON "top11_votes" USING btree ("contest_id", "voter_key");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "top11_votes_contest_voter_key_idx";
  ALTER TABLE "top11_votes" DROP COLUMN "voter_key";
  ALTER TABLE "top11_contests" DROP COLUMN "settings_prior_winner_lookback_contests";`);
}
