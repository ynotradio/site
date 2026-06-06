import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_top11_contests_status" AS ENUM('draft', 'open', 'closed', 'published', 'archived');
  CREATE TYPE "public"."enum_top11_votes_vote_source" AS ENUM('web', 'legacy-import', 'admin-import');
  -- Keep Top11 query preset values grouped ahead of MRM values for stable enum ordering.
  ALTER TYPE "public"."enum_payload_query_presets_related_collection" ADD VALUE 'top11-contests' BEFORE 'modern-rock-madness-tournaments';
  ALTER TYPE "public"."enum_payload_query_presets_related_collection" ADD VALUE 'top11-votes' BEFORE 'modern-rock-madness-tournaments';
  ALTER TYPE "public"."enum_payload_query_presets_related_collection" ADD VALUE 'top11-write-ins' BEFORE 'modern-rock-madness-tournaments';
  ALTER TYPE "public"."enum_payload_query_presets_related_collection" ADD VALUE 'top11-contestants' BEFORE 'modern-rock-madness-tournaments';
  ALTER TYPE "public"."enum_payload_query_presets_related_collection" ADD VALUE 'top11-winner-draws' BEFORE 'modern-rock-madness-tournaments';
  CREATE TABLE "top11_contests_message_snapshot_band_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"band_name" varchar NOT NULL,
  	"website_url" varchar NOT NULL
  );
  
  CREATE TABLE "top11_contests_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"display_order" numeric NOT NULL,
  	"song_id" integer NOT NULL,
  	"weekly_note" jsonb
  );
  
  CREATE TABLE "top11_contests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"week_of" timestamp(3) with time zone NOT NULL,
  	"status" "enum_top11_contests_status" DEFAULT 'draft' NOT NULL,
  	"external_template_url" varchar,
  	"voting_opens_at" timestamp(3) with time zone,
  	"voting_closes_at" timestamp(3) with time zone,
  	"message_snapshot_headline" varchar,
  	"message_snapshot_body" jsonb,
  	"settings_exclude_prior_winners" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "top11_votes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contest_id" integer NOT NULL,
  	"song_id" integer NOT NULL,
  	"voter_email" varchar,
  	"voter_user_id" varchar,
  	"voter_auth0_id" varchar,
  	"vote_source" "enum_top11_votes_vote_source" DEFAULT 'web' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "top11_write_ins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contest_id" integer NOT NULL,
  	"write_in" varchar NOT NULL,
  	"voter_email" varchar,
  	"display" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "top11_contestants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contest_id" integer NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"entered_contest" boolean DEFAULT true,
  	"newsletter_opt_in" boolean DEFAULT false,
  	"display" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "top11_winner_draws" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contest_id" integer NOT NULL,
  	"contestant_id" integer NOT NULL,
  	"contestant_email" varchar NOT NULL,
  	"drawn_by_id" integer,
  	"exclude_prior_winners" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "top11_contests_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "top11_votes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "top11_write_ins_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "top11_contestants_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "top11_winner_draws_id" integer;
  ALTER TABLE "top11_contests_message_snapshot_band_links" ADD CONSTRAINT "top11_contests_message_snapshot_band_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."top11_contests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "top11_contests_entries" ADD CONSTRAINT "top11_contests_entries_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "top11_contests_entries" ADD CONSTRAINT "top11_contests_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."top11_contests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "top11_votes" ADD CONSTRAINT "top11_votes_contest_id_top11_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."top11_contests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "top11_votes" ADD CONSTRAINT "top11_votes_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "top11_write_ins" ADD CONSTRAINT "top11_write_ins_contest_id_top11_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."top11_contests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "top11_contestants" ADD CONSTRAINT "top11_contestants_contest_id_top11_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."top11_contests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "top11_winner_draws" ADD CONSTRAINT "top11_winner_draws_contest_id_top11_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."top11_contests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "top11_winner_draws" ADD CONSTRAINT "top11_winner_draws_contestant_id_top11_contestants_id_fk" FOREIGN KEY ("contestant_id") REFERENCES "public"."top11_contestants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "top11_winner_draws" ADD CONSTRAINT "top11_winner_draws_drawn_by_id_users_id_fk" FOREIGN KEY ("drawn_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "top11_contests_message_snapshot_band_links_order_idx" ON "top11_contests_message_snapshot_band_links" USING btree ("_order");
  CREATE INDEX "top11_contests_message_snapshot_band_links_parent_id_idx" ON "top11_contests_message_snapshot_band_links" USING btree ("_parent_id");
  CREATE INDEX "top11_contests_entries_order_idx" ON "top11_contests_entries" USING btree ("_order");
  CREATE INDEX "top11_contests_entries_parent_id_idx" ON "top11_contests_entries" USING btree ("_parent_id");
  CREATE INDEX "top11_contests_entries_song_idx" ON "top11_contests_entries" USING btree ("song_id");
  CREATE UNIQUE INDEX "top11_contests_slug_idx" ON "top11_contests" USING btree ("slug");
  CREATE INDEX "top11_contests_week_of_idx" ON "top11_contests" USING btree ("week_of");
  CREATE INDEX "top11_contests_status_idx" ON "top11_contests" USING btree ("status");
  CREATE INDEX "top11_contests_updated_at_idx" ON "top11_contests" USING btree ("updated_at");
  CREATE INDEX "top11_contests_created_at_idx" ON "top11_contests" USING btree ("created_at");
  CREATE INDEX "top11_votes_contest_idx" ON "top11_votes" USING btree ("contest_id");
  CREATE INDEX "top11_votes_song_idx" ON "top11_votes" USING btree ("song_id");
  CREATE INDEX "top11_votes_voter_email_idx" ON "top11_votes" USING btree ("voter_email");
  CREATE INDEX "top11_votes_voter_user_id_idx" ON "top11_votes" USING btree ("voter_user_id");
  CREATE INDEX "top11_votes_voter_auth0_id_idx" ON "top11_votes" USING btree ("voter_auth0_id");
  CREATE INDEX "top11_votes_updated_at_idx" ON "top11_votes" USING btree ("updated_at");
  CREATE INDEX "top11_votes_created_at_idx" ON "top11_votes" USING btree ("created_at");
  CREATE INDEX "top11_write_ins_contest_idx" ON "top11_write_ins" USING btree ("contest_id");
  CREATE INDEX "top11_write_ins_updated_at_idx" ON "top11_write_ins" USING btree ("updated_at");
  CREATE INDEX "top11_write_ins_created_at_idx" ON "top11_write_ins" USING btree ("created_at");
  CREATE INDEX "top11_contestants_contest_idx" ON "top11_contestants" USING btree ("contest_id");
  CREATE INDEX "top11_contestants_email_idx" ON "top11_contestants" USING btree ("email");
  CREATE INDEX "top11_contestants_updated_at_idx" ON "top11_contestants" USING btree ("updated_at");
  CREATE INDEX "top11_contestants_created_at_idx" ON "top11_contestants" USING btree ("created_at");
  CREATE INDEX "top11_winner_draws_contest_idx" ON "top11_winner_draws" USING btree ("contest_id");
  CREATE INDEX "top11_winner_draws_contestant_idx" ON "top11_winner_draws" USING btree ("contestant_id");
  CREATE INDEX "top11_winner_draws_contestant_email_idx" ON "top11_winner_draws" USING btree ("contestant_email");
  CREATE INDEX "top11_winner_draws_drawn_by_idx" ON "top11_winner_draws" USING btree ("drawn_by_id");
  CREATE INDEX "top11_winner_draws_updated_at_idx" ON "top11_winner_draws" USING btree ("updated_at");
  CREATE INDEX "top11_winner_draws_created_at_idx" ON "top11_winner_draws" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_top11_contests_fk" FOREIGN KEY ("top11_contests_id") REFERENCES "public"."top11_contests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_top11_votes_fk" FOREIGN KEY ("top11_votes_id") REFERENCES "public"."top11_votes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_top11_write_ins_fk" FOREIGN KEY ("top11_write_ins_id") REFERENCES "public"."top11_write_ins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_top11_contestants_fk" FOREIGN KEY ("top11_contestants_id") REFERENCES "public"."top11_contestants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_top11_winner_draws_fk" FOREIGN KEY ("top11_winner_draws_id") REFERENCES "public"."top11_winner_draws"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_top11_contests_id_idx" ON "payload_locked_documents_rels" USING btree ("top11_contests_id");
  CREATE INDEX "payload_locked_documents_rels_top11_votes_id_idx" ON "payload_locked_documents_rels" USING btree ("top11_votes_id");
  CREATE INDEX "payload_locked_documents_rels_top11_write_ins_id_idx" ON "payload_locked_documents_rels" USING btree ("top11_write_ins_id");
  CREATE INDEX "payload_locked_documents_rels_top11_contestants_id_idx" ON "payload_locked_documents_rels" USING btree ("top11_contestants_id");
  CREATE INDEX "payload_locked_documents_rels_top11_winner_draws_id_idx" ON "payload_locked_documents_rels" USING btree ("top11_winner_draws_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "top11_contests_message_snapshot_band_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "top11_contests_entries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "top11_contests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "top11_votes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "top11_write_ins" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "top11_contestants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "top11_winner_draws" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "top11_contests_message_snapshot_band_links" CASCADE;
  DROP TABLE "top11_contests_entries" CASCADE;
  DROP TABLE "top11_contests" CASCADE;
  DROP TABLE "top11_votes" CASCADE;
  DROP TABLE "top11_write_ins" CASCADE;
  DROP TABLE "top11_contestants" CASCADE;
  DROP TABLE "top11_winner_draws" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_top11_contests_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_top11_votes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_top11_write_ins_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_top11_contestants_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_top11_winner_draws_fk";
  
  ALTER TABLE "payload_query_presets" ALTER COLUMN "related_collection" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_query_presets_related_collection";
  CREATE TYPE "public"."enum_payload_query_presets_related_collection" AS ENUM('users', 'media', 'people', 'djs', 'artists', 'venues', 'ads', 'songs', 'records', 'concerts', 'ondemand', 'shows', 'posts', 'cdoftheweek', 'year-end-poll-results', 'modern-rock-madness-tournaments', 'modern-rock-madness-groups', 'modern-rock-madness-matches', 'modern-rock-madness-votes', 'modern-rock-madness-match-events');
  ALTER TABLE "payload_query_presets" ALTER COLUMN "related_collection" SET DATA TYPE "public"."enum_payload_query_presets_related_collection" USING "related_collection"::"public"."enum_payload_query_presets_related_collection";
  DROP INDEX "payload_locked_documents_rels_top11_contests_id_idx";
  DROP INDEX "payload_locked_documents_rels_top11_votes_id_idx";
  DROP INDEX "payload_locked_documents_rels_top11_write_ins_id_idx";
  DROP INDEX "payload_locked_documents_rels_top11_contestants_id_idx";
  DROP INDEX "payload_locked_documents_rels_top11_winner_draws_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "top11_contests_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "top11_votes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "top11_write_ins_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "top11_contestants_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "top11_winner_draws_id";
  DROP TYPE "public"."enum_top11_contests_status";
  DROP TYPE "public"."enum_top11_votes_vote_source";`)
}
