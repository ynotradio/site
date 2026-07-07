import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

// Legacy MySQL lets one voter pick up to 3 songs per week (independent
// per-song counters, no per-voter-per-song row). The original
// (contest_id, voter_key) unique index only allowed one vote row per voter
// per contest at all -- correct for "has this voter voted" dedup, but it
// silently prevented a voter from ever casting more than one of their three
// picks. Relaxing to (contest_id, voter_key, song_id) keeps a voter from
// voting for the same song twice while allowing up to 3 distinct songs.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "top11_votes_contest_voter_key_idx";
    CREATE UNIQUE INDEX "top11_votes_contest_voter_key_song_idx" ON "top11_votes" USING btree ("contest_id", "voter_key", "song_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "top11_votes_contest_voter_key_song_idx";
    CREATE UNIQUE INDEX "top11_votes_contest_voter_key_idx" ON "top11_votes" USING btree ("contest_id", "voter_key");
  `)
}
