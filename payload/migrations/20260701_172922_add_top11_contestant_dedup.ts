import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- Enforce one contestant entry per contest per email at the database level
  -- (previously only enforced by a racy application-level find-then-create
  -- check, same class of bug as the top11_votes duplicate-vote race).
  CREATE UNIQUE INDEX "top11_contestants_contest_email_idx" ON "top11_contestants" USING btree ("contest_id", lower("email"));`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "top11_contestants_contest_email_idx";`);
}
