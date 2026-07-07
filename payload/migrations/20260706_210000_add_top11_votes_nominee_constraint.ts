import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

// A CHECK constraint can't do a cross-table lookup, so the "song must be on
// the contest's ballot" rule is enforced with a trigger. This is the real
// source of truth; the Payload beforeChange hook in Top11Votes.ts is just a
// friendlier error message in front of it -- if the two ever drift, the
// failure mode is a worse error, not a bad vote.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION top11_votes_check_song_is_nominee() RETURNS trigger AS $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM "top11_contests_nominees"
        WHERE "_parent_id" = NEW."contest_id" AND "song_id" = NEW."song_id"
      ) THEN
        RAISE EXCEPTION 'song % is not a nominee for contest %', NEW."song_id", NEW."contest_id";
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER top11_votes_song_is_nominee
      BEFORE INSERT OR UPDATE OF "contest_id", "song_id" ON "top11_votes"
      FOR EACH ROW EXECUTE FUNCTION top11_votes_check_song_is_nominee();
  `);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TRIGGER IF EXISTS top11_votes_song_is_nominee ON "top11_votes";
    DROP FUNCTION IF EXISTS top11_votes_check_song_is_nominee();
  `);
}
