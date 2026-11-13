import { sql } from '@payloadcms/db-postgres';
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

const statementsUp = [
  sql`
    CREATE TABLE IF NOT EXISTS "year_end_poll_write_ins" (
      "id" serial PRIMARY KEY NOT NULL,
      "poll_id" integer NOT NULL,
      "category_id" integer NOT NULL,
      "write_in" varchar NOT NULL,
      "user_id" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `,
  sql`
    DO $$ BEGIN
      ALTER TABLE "year_end_poll_write_ins" ADD CONSTRAINT "year_end_poll_write_ins_poll_id_year_end_polls_id_fk"
        FOREIGN KEY ("poll_id") REFERENCES "public"."year_end_polls"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `,
  sql`
    DO $$ BEGIN
      ALTER TABLE "year_end_poll_write_ins" ADD CONSTRAINT "year_end_poll_write_ins_category_id_year_end_poll_categories_id_fk"
        FOREIGN KEY ("category_id") REFERENCES "public"."year_end_poll_categories"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_write_ins_poll_idx" ON "year_end_poll_write_ins" USING btree ("poll_id");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_write_ins_category_idx" ON "year_end_poll_write_ins" USING btree ("category_id");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_write_ins_user_id_idx" ON "year_end_poll_write_ins" USING btree ("user_id");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_write_ins_updated_at_idx" ON "year_end_poll_write_ins" USING btree ("updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_write_ins_created_at_idx" ON "year_end_poll_write_ins" USING btree ("created_at");`,

  sql`
    CREATE TABLE IF NOT EXISTS "year_end_poll_contestants" (
      "id" serial PRIMARY KEY NOT NULL,
      "poll_id" integer NOT NULL,
      "name" varchar NOT NULL,
      "hometown" varchar,
      "email" varchar NOT NULL,
      "phone" varchar,
      "newsletter_opt_in" boolean DEFAULT false,
      "user_id" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `,
  sql`
    DO $$ BEGIN
      ALTER TABLE "year_end_poll_contestants" ADD CONSTRAINT "year_end_poll_contestants_poll_id_year_end_polls_id_fk"
        FOREIGN KEY ("poll_id") REFERENCES "public"."year_end_polls"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_contestants_poll_idx" ON "year_end_poll_contestants" USING btree ("poll_id");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_contestants_email_idx" ON "year_end_poll_contestants" USING btree ("email");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_contestants_phone_idx" ON "year_end_poll_contestants" USING btree ("phone");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_contestants_user_id_idx" ON "year_end_poll_contestants" USING btree ("user_id");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_contestants_updated_at_idx" ON "year_end_poll_contestants" USING btree ("updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "year_end_poll_contestants_created_at_idx" ON "year_end_poll_contestants" USING btree ("created_at");`,

  sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "year_end_poll_write_ins_id" integer;`,
  sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "year_end_poll_contestants_id" integer;`,
  sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_year_end_poll_write_ins_fk"
        FOREIGN KEY ("year_end_poll_write_ins_id") REFERENCES "public"."year_end_poll_write_ins"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `,
  sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_year_end_poll_contestants_fk"
        FOREIGN KEY ("year_end_poll_contestants_id") REFERENCES "public"."year_end_poll_contestants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `,
  sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_year_end_poll_write_ins_id_idx" ON "payload_locked_documents_rels" USING btree ("year_end_poll_write_ins_id");`,
  sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_year_end_poll_contestants_id_idx" ON "payload_locked_documents_rels" USING btree ("year_end_poll_contestants_id");`,
];

const statementsDown = [
  sql`ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_year_end_poll_write_ins_fk";`,
  sql`ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_year_end_poll_contestants_fk";`,
  sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "year_end_poll_write_ins_id";`,
  sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "year_end_poll_contestants_id";`,
  sql`DROP TABLE IF EXISTS "year_end_poll_write_ins" CASCADE;`,
  sql`DROP TABLE IF EXISTS "year_end_poll_contestants" CASCADE;`,
];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of statementsUp) {
    // eslint-disable-next-line no-await-in-loop
    await db.execute(statement);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const statement of statementsDown) {
    // eslint-disable-next-line no-await-in-loop
    await db.execute(statement);
  }
}
