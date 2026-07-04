import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Create enums (one per execute to avoid multi-statement issues on some drivers)
  await db.execute(sql`
    CREATE TYPE "public"."enum_year_end_polls_status" AS ENUM('draft', 'open', 'closed', 'archived');
  `);
  await db.execute(sql`
    CREATE TYPE "public"."enum_year_end_poll_categories_category_type" AS ENUM('songs', 'albums', 'artists', 'concerts', 'custom');
  `);

  // Create year_end_polls table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "year_end_polls" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "year" numeric NOT NULL,
      "slug" varchar NOT NULL,
      "status" "enum_year_end_polls_status" DEFAULT 'draft' NOT NULL,
      "voting_opens_at" timestamp(3) with time zone,
      "voting_closes_at" timestamp(3) with time zone,
      "banner_image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `);

  // Create year_end_poll_categories table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "year_end_poll_categories" (
      "id" serial PRIMARY KEY NOT NULL,
      "poll_id" integer NOT NULL,
      "name" varchar NOT NULL,
      "display_name" varchar NOT NULL,
      "category_type" "enum_year_end_poll_categories_category_type" NOT NULL,
      "max_picks" numeric DEFAULT 3 NOT NULL,
      "sort_order" numeric DEFAULT 0,
      "voting_opens_at" timestamp(3) with time zone,
      "voting_closes_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `);

  // Create year_end_poll_categories_nominees table (nominees array)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "year_end_poll_categories_nominees" (
      "id" serial PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "song_id" integer,
      "record_id" integer,
      "artist_id" integer,
      "concert_id" integer,
      "custom_label" varchar,
      "vote_count" numeric DEFAULT 0
    );
  `);

  // Create year_end_poll_votes table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "year_end_poll_votes" (
      "id" serial PRIMARY KEY NOT NULL,
      "poll_id" integer NOT NULL,
      "category_id" integer NOT NULL,
      "nominee_id" varchar NOT NULL,
      "user_id" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `);

  // Add YEP columns to payload_locked_documents_rels
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "year_end_polls_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "year_end_poll_categories_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "year_end_poll_votes_id" integer;
  `);

  // Add unique constraint on year_end_polls.slug
  await db.execute(sql`
    ALTER TABLE "year_end_polls" ADD CONSTRAINT "year_end_polls_slug_unique" UNIQUE("slug");
  `);

  // Add unique constraint on (poll_id, name) for categories — prevents ambiguous lookup
  await db.execute(sql`
    ALTER TABLE "year_end_poll_categories" ADD CONSTRAINT "year_end_poll_categories_poll_id_name_unique" UNIQUE("poll_id", "name");
  `);

  // Add indexes for year_end_polls
  await db.execute(sql`
    CREATE INDEX "year_end_polls_year_idx" ON "year_end_polls" USING btree ("year");
    CREATE INDEX "year_end_polls_status_idx" ON "year_end_polls" USING btree ("status");
    CREATE INDEX "year_end_polls_banner_image_idx" ON "year_end_polls" USING btree ("banner_image_id");
    CREATE INDEX "year_end_polls_updated_at_idx" ON "year_end_polls" USING btree ("updated_at");
    CREATE INDEX "year_end_polls_created_at_idx" ON "year_end_polls" USING btree ("created_at");
  `);

  // Add indexes for year_end_poll_categories
  await db.execute(sql`
    CREATE INDEX "year_end_poll_categories_poll_idx" ON "year_end_poll_categories" USING btree ("poll_id");
    CREATE INDEX "year_end_poll_categories_updated_at_idx" ON "year_end_poll_categories" USING btree ("updated_at");
    CREATE INDEX "year_end_poll_categories_created_at_idx" ON "year_end_poll_categories" USING btree ("created_at");
  `);

  // Add indexes for year_end_poll_categories_nominees
  await db.execute(sql`
    CREATE INDEX "year_end_poll_categories_nominees_order_idx" ON "year_end_poll_categories_nominees" USING btree ("_order");
    CREATE INDEX "year_end_poll_categories_nominees_parent_idx" ON "year_end_poll_categories_nominees" USING btree ("_parent_id");
  `);

  // Add indexes for year_end_poll_votes
  await db.execute(sql`
    CREATE INDEX "year_end_poll_votes_poll_idx" ON "year_end_poll_votes" USING btree ("poll_id");
    CREATE INDEX "year_end_poll_votes_category_idx" ON "year_end_poll_votes" USING btree ("category_id");
    CREATE INDEX "year_end_poll_votes_nominee_id_idx" ON "year_end_poll_votes" USING btree ("nominee_id");
    CREATE INDEX "year_end_poll_votes_user_id_idx" ON "year_end_poll_votes" USING btree ("user_id");
    CREATE INDEX "year_end_poll_votes_updated_at_idx" ON "year_end_poll_votes" USING btree ("updated_at");
    CREATE INDEX "year_end_poll_votes_created_at_idx" ON "year_end_poll_votes" USING btree ("created_at");
  `);

  // Unique index on (category_id, nominee_id, user_id) — hard duplicate prevention at DB level
  await db.execute(sql`
    CREATE UNIQUE INDEX "year_end_poll_votes_category_nominee_user_unique" ON "year_end_poll_votes" USING btree ("category_id", "nominee_id", "user_id");
  `);

  // Add foreign key constraints
  await db.execute(sql`
    ALTER TABLE "year_end_polls" ADD CONSTRAINT "year_end_polls_banner_image_id_media_id_fk" FOREIGN KEY ("banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "year_end_poll_categories" ADD CONSTRAINT "year_end_poll_categories_poll_id_year_end_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."year_end_polls"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "year_end_poll_categories_nominees" ADD CONSTRAINT "year_end_poll_categories_nominees_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_poll_categories"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "year_end_poll_categories_nominees" ADD CONSTRAINT "year_end_poll_categories_nominees_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "year_end_poll_categories_nominees" ADD CONSTRAINT "year_end_poll_categories_nominees_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "year_end_poll_categories_nominees" ADD CONSTRAINT "year_end_poll_categories_nominees_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "year_end_poll_categories_nominees" ADD CONSTRAINT "year_end_poll_categories_nominees_concert_id_concerts_id_fk" FOREIGN KEY ("concert_id") REFERENCES "public"."concerts"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "year_end_poll_votes" ADD CONSTRAINT "year_end_poll_votes_poll_id_year_end_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."year_end_polls"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "year_end_poll_votes" ADD CONSTRAINT "year_end_poll_votes_category_id_year_end_poll_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."year_end_poll_categories"("id") ON DELETE cascade ON UPDATE no action;
  `);

  // Add locked_documents_rels foreign keys and indexes
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_year_end_polls_fk" FOREIGN KEY ("year_end_polls_id") REFERENCES "public"."year_end_polls"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_year_end_poll_categories_fk" FOREIGN KEY ("year_end_poll_categories_id") REFERENCES "public"."year_end_poll_categories"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_year_end_poll_votes_fk" FOREIGN KEY ("year_end_poll_votes_id") REFERENCES "public"."year_end_poll_votes"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_year_end_polls_id_idx" ON "payload_locked_documents_rels" USING btree ("year_end_polls_id");
    CREATE INDEX "payload_locked_documents_rels_year_end_poll_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("year_end_poll_categories_id");
    CREATE INDEX "payload_locked_documents_rels_year_end_poll_votes_id_idx" ON "payload_locked_documents_rels" USING btree ("year_end_poll_votes_id");
  `);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Drop FK constraints on payload_locked_documents_rels before dropping columns
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_year_end_polls_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_year_end_poll_categories_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_year_end_poll_votes_fk";
  `);

  await db.execute(sql`
    DROP TABLE IF EXISTS "year_end_poll_votes" CASCADE;
    DROP TABLE IF EXISTS "year_end_poll_categories_nominees" CASCADE;
    DROP TABLE IF EXISTS "year_end_poll_categories" CASCADE;
    DROP TABLE IF EXISTS "year_end_polls" CASCADE;
    DROP TYPE IF EXISTS "enum_year_end_polls_status";
    DROP TYPE IF EXISTS "enum_year_end_poll_categories_category_type";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "year_end_polls_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "year_end_poll_categories_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "year_end_poll_votes_id";
  `);
}
