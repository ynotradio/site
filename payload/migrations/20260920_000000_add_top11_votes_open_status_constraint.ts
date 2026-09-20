import { sql } from '@payloadcms/db-postgres';
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION top11_votes_check_contest_is_open() RETURNS trigger AS $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM "top11_contests"
        WHERE "id" = NEW."contest_id" AND "status" = 'open'
      ) THEN
        RAISE EXCEPTION 'Top 11 voting is not currently open for contest %', NEW."contest_id";
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER top11_votes_contest_is_open
      BEFORE INSERT OR UPDATE OF "contest_id" ON "top11_votes"
      FOR EACH ROW EXECUTE FUNCTION top11_votes_check_contest_is_open();
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TRIGGER IF EXISTS top11_votes_contest_is_open ON "top11_votes";
    DROP FUNCTION IF EXISTS top11_votes_check_contest_is_open();
  `);
}
