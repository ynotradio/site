import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ondemand_source" AS ENUM('opendrive', 'soundcloud', 'other');
  CREATE TYPE "public"."enum__ondemand_v_version_source" AS ENUM('opendrive', 'soundcloud', 'other');
  CREATE TYPE "public"."enum_modern_rock_madness_tournaments_status" AS ENUM('draft', 'active', 'complete');
  CREATE TYPE "public"."enum_modern_rock_madness_matches_round" AS ENUM('1', '2', '3', '4', '5', '6');
  CREATE TYPE "public"."enum_modern_rock_madness_match_events_event_type" AS ENUM('overtime_extended', 'rematch', 'admin_vote', 'match_closed');
  CREATE TABLE "modern_rock_madness_tournaments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"year" numeric NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"status" "enum_modern_rock_madness_tournaments_status" DEFAULT 'draft' NOT NULL,
  	"bracket_pdf_url" varchar,
  	"banner_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "modern_rock_madness_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tournament_id" integer NOT NULL,
  	"name" varchar,
  	"abbreviation" varchar,
  	"image_id" integer,
  	"seed" numeric NOT NULL,
  	"placement" numeric NOT NULL,
  	"url" varchar,
  	"sponsor" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "modern_rock_madness_groups_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"artists_id" integer
  );
  
  CREATE TABLE "modern_rock_madness_matches" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tournament_id" integer NOT NULL,
  	"match_number" numeric NOT NULL,
  	"round" "enum_modern_rock_madness_matches_round" NOT NULL,
  	"region" numeric,
  	"band1_id" integer,
  	"band2_id" integer,
  	"band1_votes" numeric DEFAULT 0,
  	"band2_votes" numeric DEFAULT 0,
  	"start_time" timestamp(3) with time zone NOT NULL,
  	"end_time" timestamp(3) with time zone NOT NULL,
  	"winner_id" integer,
  	"show_score" boolean DEFAULT false,
  	"next_match_id" integer,
  	"sponsor" varchar,
  	"sponsor_message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "modern_rock_madness_votes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"match_id" integer NOT NULL,
  	"group_id" integer NOT NULL,
  	"user_id" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "modern_rock_madness_match_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"match_id" integer NOT NULL,
  	"event_type" "enum_modern_rock_madness_match_events_event_type" NOT NULL,
  	"snapshot" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "ondemand" ALTER COLUMN "source" SET DATA TYPE "public"."enum_ondemand_source" USING "source"::"public"."enum_ondemand_source";
  ALTER TABLE "_ondemand_v" ALTER COLUMN "version_source" SET DATA TYPE "public"."enum__ondemand_v_version_source" USING "version_source"::"public"."enum__ondemand_v_version_source";
  ALTER TABLE "songs" ADD COLUMN "display_name" varchar;
  ALTER TABLE "records" ADD COLUMN "display_name" varchar;
  ALTER TABLE "posts" ADD COLUMN "link_url" varchar;
  ALTER TABLE "posts" ADD COLUMN "show_on_front_page" boolean DEFAULT true;
  ALTER TABLE "_posts_v" ADD COLUMN "version_link_url" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_show_on_front_page" boolean DEFAULT true;
  ALTER TABLE "cdoftheweek" ADD COLUMN "slug" varchar;
  ALTER TABLE "_cdoftheweek_v" ADD COLUMN "version_slug" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "modern_rock_madness_tournaments_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "modern_rock_madness_groups_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "modern_rock_madness_matches_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "modern_rock_madness_votes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "modern_rock_madness_match_events_id" integer;
  ALTER TABLE "modern_rock_madness_tournaments" ADD CONSTRAINT "modern_rock_madness_tournaments_banner_image_id_media_id_fk" FOREIGN KEY ("banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_groups" ADD CONSTRAINT "modern_rock_madness_groups_tournament_id_modern_rock_madness_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."modern_rock_madness_tournaments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_groups" ADD CONSTRAINT "modern_rock_madness_groups_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_groups_rels" ADD CONSTRAINT "modern_rock_madness_groups_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."modern_rock_madness_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_groups_rels" ADD CONSTRAINT "modern_rock_madness_groups_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_matches" ADD CONSTRAINT "modern_rock_madness_matches_tournament_id_modern_rock_madness_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."modern_rock_madness_tournaments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_matches" ADD CONSTRAINT "modern_rock_madness_matches_band1_id_modern_rock_madness_groups_id_fk" FOREIGN KEY ("band1_id") REFERENCES "public"."modern_rock_madness_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_matches" ADD CONSTRAINT "modern_rock_madness_matches_band2_id_modern_rock_madness_groups_id_fk" FOREIGN KEY ("band2_id") REFERENCES "public"."modern_rock_madness_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_matches" ADD CONSTRAINT "modern_rock_madness_matches_winner_id_modern_rock_madness_groups_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."modern_rock_madness_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_matches" ADD CONSTRAINT "modern_rock_madness_matches_next_match_id_modern_rock_madness_matches_id_fk" FOREIGN KEY ("next_match_id") REFERENCES "public"."modern_rock_madness_matches"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_votes" ADD CONSTRAINT "modern_rock_madness_votes_match_id_modern_rock_madness_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."modern_rock_madness_matches"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_votes" ADD CONSTRAINT "modern_rock_madness_votes_group_id_modern_rock_madness_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."modern_rock_madness_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modern_rock_madness_match_events" ADD CONSTRAINT "modern_rock_madness_match_events_match_id_modern_rock_madness_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."modern_rock_madness_matches"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "modern_rock_madness_tournaments_year_idx" ON "modern_rock_madness_tournaments" USING btree ("year");
  CREATE INDEX "modern_rock_madness_tournaments_status_idx" ON "modern_rock_madness_tournaments" USING btree ("status");
  CREATE INDEX "modern_rock_madness_tournaments_banner_image_idx" ON "modern_rock_madness_tournaments" USING btree ("banner_image_id");
  CREATE INDEX "modern_rock_madness_tournaments_updated_at_idx" ON "modern_rock_madness_tournaments" USING btree ("updated_at");
  CREATE INDEX "modern_rock_madness_tournaments_created_at_idx" ON "modern_rock_madness_tournaments" USING btree ("created_at");
  CREATE INDEX "modern_rock_madness_groups_tournament_idx" ON "modern_rock_madness_groups" USING btree ("tournament_id");
  CREATE INDEX "modern_rock_madness_groups_image_idx" ON "modern_rock_madness_groups" USING btree ("image_id");
  CREATE INDEX "modern_rock_madness_groups_placement_idx" ON "modern_rock_madness_groups" USING btree ("placement");
  CREATE INDEX "modern_rock_madness_groups_updated_at_idx" ON "modern_rock_madness_groups" USING btree ("updated_at");
  CREATE INDEX "modern_rock_madness_groups_created_at_idx" ON "modern_rock_madness_groups" USING btree ("created_at");
  CREATE INDEX "modern_rock_madness_groups_rels_order_idx" ON "modern_rock_madness_groups_rels" USING btree ("order");
  CREATE INDEX "modern_rock_madness_groups_rels_parent_idx" ON "modern_rock_madness_groups_rels" USING btree ("parent_id");
  CREATE INDEX "modern_rock_madness_groups_rels_path_idx" ON "modern_rock_madness_groups_rels" USING btree ("path");
  CREATE INDEX "modern_rock_madness_groups_rels_artists_id_idx" ON "modern_rock_madness_groups_rels" USING btree ("artists_id");
  CREATE INDEX "modern_rock_madness_matches_tournament_idx" ON "modern_rock_madness_matches" USING btree ("tournament_id");
  CREATE INDEX "modern_rock_madness_matches_match_number_idx" ON "modern_rock_madness_matches" USING btree ("match_number");
  CREATE INDEX "modern_rock_madness_matches_band1_idx" ON "modern_rock_madness_matches" USING btree ("band1_id");
  CREATE INDEX "modern_rock_madness_matches_band2_idx" ON "modern_rock_madness_matches" USING btree ("band2_id");
  CREATE INDEX "modern_rock_madness_matches_winner_idx" ON "modern_rock_madness_matches" USING btree ("winner_id");
  CREATE INDEX "modern_rock_madness_matches_next_match_idx" ON "modern_rock_madness_matches" USING btree ("next_match_id");
  CREATE INDEX "modern_rock_madness_matches_updated_at_idx" ON "modern_rock_madness_matches" USING btree ("updated_at");
  CREATE INDEX "modern_rock_madness_matches_created_at_idx" ON "modern_rock_madness_matches" USING btree ("created_at");
  CREATE INDEX "modern_rock_madness_votes_match_idx" ON "modern_rock_madness_votes" USING btree ("match_id");
  CREATE INDEX "modern_rock_madness_votes_group_idx" ON "modern_rock_madness_votes" USING btree ("group_id");
  CREATE INDEX "modern_rock_madness_votes_user_id_idx" ON "modern_rock_madness_votes" USING btree ("user_id");
  CREATE INDEX "modern_rock_madness_votes_updated_at_idx" ON "modern_rock_madness_votes" USING btree ("updated_at");
  CREATE INDEX "modern_rock_madness_votes_created_at_idx" ON "modern_rock_madness_votes" USING btree ("created_at");
  CREATE INDEX "modern_rock_madness_match_events_match_idx" ON "modern_rock_madness_match_events" USING btree ("match_id");
  CREATE INDEX "modern_rock_madness_match_events_event_type_idx" ON "modern_rock_madness_match_events" USING btree ("event_type");
  CREATE INDEX "modern_rock_madness_match_events_updated_at_idx" ON "modern_rock_madness_match_events" USING btree ("updated_at");
  CREATE INDEX "modern_rock_madness_match_events_created_at_idx" ON "modern_rock_madness_match_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_modern_rock_madness_tournam_fk" FOREIGN KEY ("modern_rock_madness_tournaments_id") REFERENCES "public"."modern_rock_madness_tournaments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_modern_rock_madness_groups_fk" FOREIGN KEY ("modern_rock_madness_groups_id") REFERENCES "public"."modern_rock_madness_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_modern_rock_madness_matches_fk" FOREIGN KEY ("modern_rock_madness_matches_id") REFERENCES "public"."modern_rock_madness_matches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_modern_rock_madness_votes_fk" FOREIGN KEY ("modern_rock_madness_votes_id") REFERENCES "public"."modern_rock_madness_votes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_modern_rock_madness_match_e_fk" FOREIGN KEY ("modern_rock_madness_match_events_id") REFERENCES "public"."modern_rock_madness_match_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "cdoftheweek_slug_idx" ON "cdoftheweek" USING btree ("slug");
  CREATE INDEX "_cdoftheweek_v_version_version_slug_idx" ON "_cdoftheweek_v" USING btree ("version_slug");
  CREATE INDEX "payload_locked_documents_rels_modern_rock_madness_tourna_idx" ON "payload_locked_documents_rels" USING btree ("modern_rock_madness_tournaments_id");
  CREATE INDEX "payload_locked_documents_rels_modern_rock_madness_groups_idx" ON "payload_locked_documents_rels" USING btree ("modern_rock_madness_groups_id");
  CREATE INDEX "payload_locked_documents_rels_modern_rock_madness_matche_idx" ON "payload_locked_documents_rels" USING btree ("modern_rock_madness_matches_id");
  CREATE INDEX "payload_locked_documents_rels_modern_rock_madness_votes__idx" ON "payload_locked_documents_rels" USING btree ("modern_rock_madness_votes_id");
  CREATE INDEX "payload_locked_documents_rels_modern_rock_madness_match__idx" ON "payload_locked_documents_rels" USING btree ("modern_rock_madness_match_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "modern_rock_madness_tournaments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "modern_rock_madness_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "modern_rock_madness_groups_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "modern_rock_madness_matches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "modern_rock_madness_votes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "modern_rock_madness_match_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "modern_rock_madness_tournaments" CASCADE;
  DROP TABLE "modern_rock_madness_groups" CASCADE;
  DROP TABLE "modern_rock_madness_groups_rels" CASCADE;
  DROP TABLE "modern_rock_madness_matches" CASCADE;
  DROP TABLE "modern_rock_madness_votes" CASCADE;
  DROP TABLE "modern_rock_madness_match_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_modern_rock_madness_tournam_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_modern_rock_madness_groups_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_modern_rock_madness_matches_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_modern_rock_madness_votes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_modern_rock_madness_match_e_fk";
  
  DROP INDEX "cdoftheweek_slug_idx";
  DROP INDEX "_cdoftheweek_v_version_version_slug_idx";
  DROP INDEX "payload_locked_documents_rels_modern_rock_madness_tourna_idx";
  DROP INDEX "payload_locked_documents_rels_modern_rock_madness_groups_idx";
  DROP INDEX "payload_locked_documents_rels_modern_rock_madness_matche_idx";
  DROP INDEX "payload_locked_documents_rels_modern_rock_madness_votes__idx";
  DROP INDEX "payload_locked_documents_rels_modern_rock_madness_match__idx";
  ALTER TABLE "ondemand" ALTER COLUMN "source" SET DATA TYPE varchar;
  ALTER TABLE "_ondemand_v" ALTER COLUMN "version_source" SET DATA TYPE varchar;
  ALTER TABLE "songs" DROP COLUMN "display_name";
  ALTER TABLE "records" DROP COLUMN "display_name";
  ALTER TABLE "posts" DROP COLUMN "link_url";
  ALTER TABLE "posts" DROP COLUMN "show_on_front_page";
  ALTER TABLE "_posts_v" DROP COLUMN "version_link_url";
  ALTER TABLE "_posts_v" DROP COLUMN "version_show_on_front_page";
  ALTER TABLE "cdoftheweek" DROP COLUMN "slug";
  ALTER TABLE "_cdoftheweek_v" DROP COLUMN "version_slug";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "modern_rock_madness_tournaments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "modern_rock_madness_groups_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "modern_rock_madness_matches_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "modern_rock_madness_votes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "modern_rock_madness_match_events_id";
  DROP TYPE "public"."enum_ondemand_source";
  DROP TYPE "public"."enum__ondemand_v_version_source";
  DROP TYPE "public"."enum_modern_rock_madness_tournaments_status";
  DROP TYPE "public"."enum_modern_rock_madness_matches_round";
  DROP TYPE "public"."enum_modern_rock_madness_match_events_event_type";`)
}
