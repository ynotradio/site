import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'readonly');
  CREATE TYPE "public"."enum_djs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__djs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_ads_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__ads_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_concerts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__concerts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_ondemand_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__ondemand_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_cdoftheweek_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cdoftheweek_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_year_end_poll_results_page_type" AS ENUM('countdown', 'poll-results', 'staff-picks');
  CREATE TYPE "public"."enum_year_end_poll_results_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__year_end_poll_results_v_version_page_type" AS ENUM('countdown', 'poll-results', 'staff-picks');
  CREATE TYPE "public"."enum__year_end_poll_results_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"last_logged_in" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"_verified" boolean,
  	"_verificationtoken" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"cloudinary_public_id" varchar,
  	"legacy_url" varchar,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "people" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"bio" jsonb,
  	"photo_id" integer,
  	"dj_record_id" integer,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "djs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar,
  	"description" jsonb,
  	"email" varchar,
  	"external_connect_text" varchar,
  	"external_connect_url" varchar,
  	"photo_id" integer,
  	"on_air" boolean DEFAULT true,
  	"sort_order" numeric,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_djs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "djs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  CREATE TABLE "_djs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_display_name" varchar,
  	"version_description" jsonb,
  	"version_email" varchar,
  	"version_external_connect_text" varchar,
  	"version_external_connect_url" varchar,
  	"version_photo_id" integer,
  	"version_on_air" boolean DEFAULT true,
  	"version_sort_order" numeric,
  	"version_legacy_id" numeric,
  	"version_migrated_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__djs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_djs_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  CREATE TABLE "artists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"bio" jsonb,
  	"photo_id" integer,
  	"website" varchar,
  	"musicbrainz_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "artists_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  CREATE TABLE "venues" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"address" varchar,
  	"city" varchar,
  	"website" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"image_id" integer,
  	"image_url" varchar,
  	"web_url" varchar,
  	"priority" numeric DEFAULT 0,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_ads_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_ads_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_start_date" timestamp(3) with time zone,
  	"version_end_date" timestamp(3) with time zone,
  	"version_image_id" integer,
  	"version_image_url" varchar,
  	"version_web_url" varchar,
  	"version_priority" numeric DEFAULT 0,
  	"version_legacy_id" numeric,
  	"version_migrated_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__ads_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "songs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"artist_id" integer,
  	"stream_url" varchar,
  	"release_date" timestamp(3) with time zone,
  	"feature_on_new_music" boolean DEFAULT false,
  	"musicbrainz_id" varchar,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "records" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"artist_id" integer NOT NULL,
  	"label" varchar,
  	"release_date" timestamp(3) with time zone,
  	"cover_image_id" integer,
  	"musicbrainz_id" varchar,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "concerts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"date" timestamp(3) with time zone,
  	"venue_id" integer,
  	"ticket_info" varchar,
  	"ticket_url" varchar,
  	"featured" boolean DEFAULT false,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_concerts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "concerts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"artists_id" integer
  );
  
  CREATE TABLE "_concerts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_date" timestamp(3) with time zone,
  	"version_venue_id" integer,
  	"version_ticket_info" varchar,
  	"version_ticket_url" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_legacy_id" numeric,
  	"version_migrated_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__concerts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_concerts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"artists_id" integer
  );
  
  CREATE TABLE "ondemand" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"image_id" integer,
  	"headline" varchar,
  	"description" jsonb,
  	"audio_url" varchar,
  	"source" varchar,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_ondemand_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "ondemand_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"djs_id" integer,
  	"artists_id" integer,
  	"songs_id" integer
  );
  
  CREATE TABLE "_ondemand_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_date" timestamp(3) with time zone,
  	"version_image_id" integer,
  	"version_headline" varchar,
  	"version_description" jsonb,
  	"version_audio_url" varchar,
  	"version_source" varchar,
  	"version_legacy_id" numeric,
  	"version_migrated_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__ondemand_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_ondemand_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"djs_id" integer,
  	"artists_id" integer,
  	"songs_id" integer
  );
  
  CREATE TABLE "shows" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"name" varchar,
  	"host_id" integer,
  	"note" jsonb,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"slug" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"content" jsonb,
  	"image_id" integer,
  	"image_url" varchar,
  	"priority" numeric DEFAULT 0,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_headline" varchar,
  	"version_slug" varchar,
  	"version_start_date" timestamp(3) with time zone,
  	"version_end_date" timestamp(3) with time zone,
  	"version_content" jsonb,
  	"version_image_id" integer,
  	"version_image_url" varchar,
  	"version_priority" numeric DEFAULT 0,
  	"version_legacy_id" numeric,
  	"version_migrated_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "cdoftheweek" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"record_id" integer,
  	"review" jsonb,
  	"reviewer_id" integer,
  	"date" timestamp(3) with time zone,
  	"legacy_id" numeric,
  	"migrated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_cdoftheweek_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_cdoftheweek_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_record_id" integer,
  	"version_review" jsonb,
  	"version_reviewer_id" integer,
  	"version_date" timestamp(3) with time zone,
  	"version_legacy_id" numeric,
  	"version_migrated_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__cdoftheweek_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "year_end_poll_results_blocks_ranked_songs_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rank" numeric,
  	"song_id" integer,
  	"note" varchar
  );
  
  CREATE TABLE "year_end_poll_results_blocks_ranked_songs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_name" varchar DEFAULT 'Top Songs',
  	"block_name" varchar
  );
  
  CREATE TABLE "year_end_poll_results_blocks_ranked_records_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rank" numeric,
  	"record_id" integer,
  	"note" varchar
  );
  
  CREATE TABLE "year_end_poll_results_blocks_ranked_records" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_name" varchar DEFAULT 'Top Albums',
  	"block_name" varchar
  );
  
  CREATE TABLE "year_end_poll_results_blocks_staff_picks_on_demand_shows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"on_demand_id" integer
  );
  
  CREATE TABLE "year_end_poll_results_blocks_staff_picks_song_picks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"song_id" integer,
  	"comment" varchar
  );
  
  CREATE TABLE "year_end_poll_results_blocks_staff_picks_record_picks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"record_id" integer,
  	"comment" varchar
  );
  
  CREATE TABLE "year_end_poll_results_blocks_staff_picks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dj_id" integer,
  	"introduction" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "year_end_poll_results_blocks_text_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "year_end_poll_results" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"year" numeric,
  	"slug" varchar,
  	"page_type" "enum_year_end_poll_results_page_type",
  	"published_at" timestamp(3) with time zone,
  	"featured_image_id" integer,
  	"introduction" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_year_end_poll_results_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_year_end_poll_results_v_blocks_ranked_songs_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rank" numeric,
  	"song_id" integer,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_year_end_poll_results_v_blocks_ranked_songs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"category_name" varchar DEFAULT 'Top Songs',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_year_end_poll_results_v_blocks_ranked_records_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rank" numeric,
  	"record_id" integer,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_year_end_poll_results_v_blocks_ranked_records" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"category_name" varchar DEFAULT 'Top Albums',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"on_demand_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_year_end_poll_results_v_blocks_staff_picks_song_picks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"song_id" integer,
  	"comment" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_year_end_poll_results_v_blocks_staff_picks_record_picks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"record_id" integer,
  	"comment" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_year_end_poll_results_v_blocks_staff_picks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dj_id" integer,
  	"introduction" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_year_end_poll_results_v_blocks_text_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_year_end_poll_results_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_year" numeric,
  	"version_slug" varchar,
  	"version_page_type" "enum__year_end_poll_results_v_version_page_type",
  	"version_published_at" timestamp(3) with time zone,
  	"version_featured_image_id" integer,
  	"version_introduction" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__year_end_poll_results_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"people_id" integer,
  	"djs_id" integer,
  	"artists_id" integer,
  	"venues_id" integer,
  	"ads_id" integer,
  	"songs_id" integer,
  	"records_id" integer,
  	"concerts_id" integer,
  	"ondemand_id" integer,
  	"shows_id" integer,
  	"posts_id" integer,
  	"cdoftheweek_id" integer,
  	"year_end_poll_results_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_dj_record_id_djs_id_fk" FOREIGN KEY ("dj_record_id") REFERENCES "public"."djs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "djs" ADD CONSTRAINT "djs_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "djs_rels" ADD CONSTRAINT "djs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."djs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "djs_rels" ADD CONSTRAINT "djs_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_djs_v" ADD CONSTRAINT "_djs_v_parent_id_djs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."djs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_djs_v" ADD CONSTRAINT "_djs_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_djs_v_rels" ADD CONSTRAINT "_djs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_djs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_djs_v_rels" ADD CONSTRAINT "_djs_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artists" ADD CONSTRAINT "artists_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artists_rels" ADD CONSTRAINT "artists_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artists_rels" ADD CONSTRAINT "artists_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ads" ADD CONSTRAINT "ads_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ads_v" ADD CONSTRAINT "_ads_v_parent_id_ads_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ads_v" ADD CONSTRAINT "_ads_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "songs" ADD CONSTRAINT "songs_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "records" ADD CONSTRAINT "records_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "records" ADD CONSTRAINT "records_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "concerts" ADD CONSTRAINT "concerts_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "concerts_rels" ADD CONSTRAINT "concerts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."concerts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "concerts_rels" ADD CONSTRAINT "concerts_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_concerts_v" ADD CONSTRAINT "_concerts_v_parent_id_concerts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."concerts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_concerts_v" ADD CONSTRAINT "_concerts_v_version_venue_id_venues_id_fk" FOREIGN KEY ("version_venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_concerts_v_rels" ADD CONSTRAINT "_concerts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_concerts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_concerts_v_rels" ADD CONSTRAINT "_concerts_v_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ondemand" ADD CONSTRAINT "ondemand_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ondemand_rels" ADD CONSTRAINT "ondemand_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ondemand"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ondemand_rels" ADD CONSTRAINT "ondemand_rels_djs_fk" FOREIGN KEY ("djs_id") REFERENCES "public"."djs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ondemand_rels" ADD CONSTRAINT "ondemand_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ondemand_rels" ADD CONSTRAINT "ondemand_rels_songs_fk" FOREIGN KEY ("songs_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ondemand_v" ADD CONSTRAINT "_ondemand_v_parent_id_ondemand_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ondemand"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ondemand_v" ADD CONSTRAINT "_ondemand_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ondemand_v_rels" ADD CONSTRAINT "_ondemand_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_ondemand_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ondemand_v_rels" ADD CONSTRAINT "_ondemand_v_rels_djs_fk" FOREIGN KEY ("djs_id") REFERENCES "public"."djs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ondemand_v_rels" ADD CONSTRAINT "_ondemand_v_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ondemand_v_rels" ADD CONSTRAINT "_ondemand_v_rels_songs_fk" FOREIGN KEY ("songs_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shows" ADD CONSTRAINT "shows_host_id_djs_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."djs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cdoftheweek" ADD CONSTRAINT "cdoftheweek_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cdoftheweek" ADD CONSTRAINT "cdoftheweek_reviewer_id_people_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cdoftheweek_v" ADD CONSTRAINT "_cdoftheweek_v_parent_id_cdoftheweek_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cdoftheweek"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cdoftheweek_v" ADD CONSTRAINT "_cdoftheweek_v_version_record_id_records_id_fk" FOREIGN KEY ("version_record_id") REFERENCES "public"."records"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cdoftheweek_v" ADD CONSTRAINT "_cdoftheweek_v_version_reviewer_id_people_id_fk" FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_ranked_songs_items" ADD CONSTRAINT "year_end_poll_results_blocks_ranked_songs_items_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_ranked_songs_items" ADD CONSTRAINT "year_end_poll_results_blocks_ranked_songs_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_poll_results_blocks_ranked_songs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_ranked_songs" ADD CONSTRAINT "year_end_poll_results_blocks_ranked_songs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_poll_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_ranked_records_items" ADD CONSTRAINT "year_end_poll_results_blocks_ranked_records_items_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_ranked_records_items" ADD CONSTRAINT "year_end_poll_results_blocks_ranked_records_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_poll_results_blocks_ranked_records"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_ranked_records" ADD CONSTRAINT "year_end_poll_results_blocks_ranked_records_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_poll_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_staff_picks_on_demand_shows" ADD CONSTRAINT "year_end_poll_results_blocks_staff_picks_on_demand_shows_on_demand_id_ondemand_id_fk" FOREIGN KEY ("on_demand_id") REFERENCES "public"."ondemand"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_staff_picks_on_demand_shows" ADD CONSTRAINT "year_end_poll_results_blocks_staff_picks_on_demand_shows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_poll_results_blocks_staff_picks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_staff_picks_song_picks" ADD CONSTRAINT "year_end_poll_results_blocks_staff_picks_song_picks_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_staff_picks_song_picks" ADD CONSTRAINT "year_end_poll_results_blocks_staff_picks_song_picks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_poll_results_blocks_staff_picks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_staff_picks_record_picks" ADD CONSTRAINT "year_end_poll_results_blocks_staff_picks_record_picks_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_staff_picks_record_picks" ADD CONSTRAINT "year_end_poll_results_blocks_staff_picks_record_picks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_poll_results_blocks_staff_picks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_staff_picks" ADD CONSTRAINT "year_end_poll_results_blocks_staff_picks_dj_id_djs_id_fk" FOREIGN KEY ("dj_id") REFERENCES "public"."djs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_staff_picks" ADD CONSTRAINT "year_end_poll_results_blocks_staff_picks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_poll_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "year_end_poll_results_blocks_text_content" ADD CONSTRAINT "year_end_poll_results_blocks_text_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."year_end_poll_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "year_end_poll_results" ADD CONSTRAINT "year_end_poll_results_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_ranked_songs_items" ADD CONSTRAINT "_year_end_poll_results_v_blocks_ranked_songs_items_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_ranked_songs_items" ADD CONSTRAINT "_year_end_poll_results_v_blocks_ranked_songs_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_year_end_poll_results_v_blocks_ranked_songs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_ranked_songs" ADD CONSTRAINT "_year_end_poll_results_v_blocks_ranked_songs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_year_end_poll_results_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_ranked_records_items" ADD CONSTRAINT "_year_end_poll_results_v_blocks_ranked_records_items_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_ranked_records_items" ADD CONSTRAINT "_year_end_poll_results_v_blocks_ranked_records_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_year_end_poll_results_v_blocks_ranked_records"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_ranked_records" ADD CONSTRAINT "_year_end_poll_results_v_blocks_ranked_records_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_year_end_poll_results_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows" ADD CONSTRAINT "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows_on_demand_id_ondemand_id_fk" FOREIGN KEY ("on_demand_id") REFERENCES "public"."ondemand"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows" ADD CONSTRAINT "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_year_end_poll_results_v_blocks_staff_picks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_staff_picks_song_picks" ADD CONSTRAINT "_year_end_poll_results_v_blocks_staff_picks_song_picks_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_staff_picks_song_picks" ADD CONSTRAINT "_year_end_poll_results_v_blocks_staff_picks_song_picks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_year_end_poll_results_v_blocks_staff_picks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_staff_picks_record_picks" ADD CONSTRAINT "_year_end_poll_results_v_blocks_staff_picks_record_picks_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_staff_picks_record_picks" ADD CONSTRAINT "_year_end_poll_results_v_blocks_staff_picks_record_picks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_year_end_poll_results_v_blocks_staff_picks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_staff_picks" ADD CONSTRAINT "_year_end_poll_results_v_blocks_staff_picks_dj_id_djs_id_fk" FOREIGN KEY ("dj_id") REFERENCES "public"."djs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_staff_picks" ADD CONSTRAINT "_year_end_poll_results_v_blocks_staff_picks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_year_end_poll_results_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v_blocks_text_content" ADD CONSTRAINT "_year_end_poll_results_v_blocks_text_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_year_end_poll_results_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v" ADD CONSTRAINT "_year_end_poll_results_v_parent_id_year_end_poll_results_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."year_end_poll_results"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_year_end_poll_results_v" ADD CONSTRAINT "_year_end_poll_results_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_djs_fk" FOREIGN KEY ("djs_id") REFERENCES "public"."djs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_venues_fk" FOREIGN KEY ("venues_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ads_fk" FOREIGN KEY ("ads_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_songs_fk" FOREIGN KEY ("songs_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_records_fk" FOREIGN KEY ("records_id") REFERENCES "public"."records"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_concerts_fk" FOREIGN KEY ("concerts_id") REFERENCES "public"."concerts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ondemand_fk" FOREIGN KEY ("ondemand_id") REFERENCES "public"."ondemand"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shows_fk" FOREIGN KEY ("shows_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cdoftheweek_fk" FOREIGN KEY ("cdoftheweek_id") REFERENCES "public"."cdoftheweek"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_year_end_poll_results_fk" FOREIGN KEY ("year_end_poll_results_id") REFERENCES "public"."year_end_poll_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "media_legacy_id_idx" ON "media" USING btree ("legacy_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "people_name_idx" ON "people" USING btree ("name");
  CREATE UNIQUE INDEX "people_slug_idx" ON "people" USING btree ("slug");
  CREATE INDEX "people_photo_idx" ON "people" USING btree ("photo_id");
  CREATE INDEX "people_dj_record_idx" ON "people" USING btree ("dj_record_id");
  CREATE UNIQUE INDEX "people_legacy_id_idx" ON "people" USING btree ("legacy_id");
  CREATE INDEX "people_updated_at_idx" ON "people" USING btree ("updated_at");
  CREATE INDEX "people_created_at_idx" ON "people" USING btree ("created_at");
  CREATE INDEX "djs_photo_idx" ON "djs" USING btree ("photo_id");
  CREATE UNIQUE INDEX "djs_legacy_id_idx" ON "djs" USING btree ("legacy_id");
  CREATE INDEX "djs_updated_at_idx" ON "djs" USING btree ("updated_at");
  CREATE INDEX "djs_created_at_idx" ON "djs" USING btree ("created_at");
  CREATE INDEX "djs__status_idx" ON "djs" USING btree ("_status");
  CREATE INDEX "djs_rels_order_idx" ON "djs_rels" USING btree ("order");
  CREATE INDEX "djs_rels_parent_idx" ON "djs_rels" USING btree ("parent_id");
  CREATE INDEX "djs_rels_path_idx" ON "djs_rels" USING btree ("path");
  CREATE INDEX "djs_rels_people_id_idx" ON "djs_rels" USING btree ("people_id");
  CREATE INDEX "_djs_v_parent_idx" ON "_djs_v" USING btree ("parent_id");
  CREATE INDEX "_djs_v_version_version_photo_idx" ON "_djs_v" USING btree ("version_photo_id");
  CREATE INDEX "_djs_v_version_version_legacy_id_idx" ON "_djs_v" USING btree ("version_legacy_id");
  CREATE INDEX "_djs_v_version_version_updated_at_idx" ON "_djs_v" USING btree ("version_updated_at");
  CREATE INDEX "_djs_v_version_version_created_at_idx" ON "_djs_v" USING btree ("version_created_at");
  CREATE INDEX "_djs_v_version_version__status_idx" ON "_djs_v" USING btree ("version__status");
  CREATE INDEX "_djs_v_created_at_idx" ON "_djs_v" USING btree ("created_at");
  CREATE INDEX "_djs_v_updated_at_idx" ON "_djs_v" USING btree ("updated_at");
  CREATE INDEX "_djs_v_latest_idx" ON "_djs_v" USING btree ("latest");
  CREATE INDEX "_djs_v_rels_order_idx" ON "_djs_v_rels" USING btree ("order");
  CREATE INDEX "_djs_v_rels_parent_idx" ON "_djs_v_rels" USING btree ("parent_id");
  CREATE INDEX "_djs_v_rels_path_idx" ON "_djs_v_rels" USING btree ("path");
  CREATE INDEX "_djs_v_rels_people_id_idx" ON "_djs_v_rels" USING btree ("people_id");
  CREATE INDEX "artists_name_idx" ON "artists" USING btree ("name");
  CREATE UNIQUE INDEX "artists_slug_idx" ON "artists" USING btree ("slug");
  CREATE INDEX "artists_photo_idx" ON "artists" USING btree ("photo_id");
  CREATE UNIQUE INDEX "artists_musicbrainz_id_idx" ON "artists" USING btree ("musicbrainz_id");
  CREATE INDEX "artists_updated_at_idx" ON "artists" USING btree ("updated_at");
  CREATE INDEX "artists_created_at_idx" ON "artists" USING btree ("created_at");
  CREATE INDEX "artists_rels_order_idx" ON "artists_rels" USING btree ("order");
  CREATE INDEX "artists_rels_parent_idx" ON "artists_rels" USING btree ("parent_id");
  CREATE INDEX "artists_rels_path_idx" ON "artists_rels" USING btree ("path");
  CREATE INDEX "artists_rels_people_id_idx" ON "artists_rels" USING btree ("people_id");
  CREATE INDEX "venues_name_idx" ON "venues" USING btree ("name");
  CREATE UNIQUE INDEX "venues_slug_idx" ON "venues" USING btree ("slug");
  CREATE INDEX "venues_city_idx" ON "venues" USING btree ("city");
  CREATE INDEX "venues_updated_at_idx" ON "venues" USING btree ("updated_at");
  CREATE INDEX "venues_created_at_idx" ON "venues" USING btree ("created_at");
  CREATE INDEX "ads_image_idx" ON "ads" USING btree ("image_id");
  CREATE UNIQUE INDEX "ads_legacy_id_idx" ON "ads" USING btree ("legacy_id");
  CREATE INDEX "ads_updated_at_idx" ON "ads" USING btree ("updated_at");
  CREATE INDEX "ads_created_at_idx" ON "ads" USING btree ("created_at");
  CREATE INDEX "ads__status_idx" ON "ads" USING btree ("_status");
  CREATE INDEX "_ads_v_parent_idx" ON "_ads_v" USING btree ("parent_id");
  CREATE INDEX "_ads_v_version_version_image_idx" ON "_ads_v" USING btree ("version_image_id");
  CREATE INDEX "_ads_v_version_version_legacy_id_idx" ON "_ads_v" USING btree ("version_legacy_id");
  CREATE INDEX "_ads_v_version_version_updated_at_idx" ON "_ads_v" USING btree ("version_updated_at");
  CREATE INDEX "_ads_v_version_version_created_at_idx" ON "_ads_v" USING btree ("version_created_at");
  CREATE INDEX "_ads_v_version_version__status_idx" ON "_ads_v" USING btree ("version__status");
  CREATE INDEX "_ads_v_created_at_idx" ON "_ads_v" USING btree ("created_at");
  CREATE INDEX "_ads_v_updated_at_idx" ON "_ads_v" USING btree ("updated_at");
  CREATE INDEX "_ads_v_latest_idx" ON "_ads_v" USING btree ("latest");
  CREATE INDEX "songs_title_idx" ON "songs" USING btree ("title");
  CREATE UNIQUE INDEX "songs_slug_idx" ON "songs" USING btree ("slug");
  CREATE INDEX "songs_artist_idx" ON "songs" USING btree ("artist_id");
  CREATE UNIQUE INDEX "songs_musicbrainz_id_idx" ON "songs" USING btree ("musicbrainz_id");
  CREATE UNIQUE INDEX "songs_legacy_id_idx" ON "songs" USING btree ("legacy_id");
  CREATE INDEX "songs_updated_at_idx" ON "songs" USING btree ("updated_at");
  CREATE INDEX "songs_created_at_idx" ON "songs" USING btree ("created_at");
  CREATE INDEX "records_title_idx" ON "records" USING btree ("title");
  CREATE UNIQUE INDEX "records_slug_idx" ON "records" USING btree ("slug");
  CREATE INDEX "records_artist_idx" ON "records" USING btree ("artist_id");
  CREATE INDEX "records_cover_image_idx" ON "records" USING btree ("cover_image_id");
  CREATE UNIQUE INDEX "records_musicbrainz_id_idx" ON "records" USING btree ("musicbrainz_id");
  CREATE UNIQUE INDEX "records_legacy_id_idx" ON "records" USING btree ("legacy_id");
  CREATE INDEX "records_updated_at_idx" ON "records" USING btree ("updated_at");
  CREATE INDEX "records_created_at_idx" ON "records" USING btree ("created_at");
  CREATE INDEX "concerts_date_idx" ON "concerts" USING btree ("date");
  CREATE INDEX "concerts_venue_idx" ON "concerts" USING btree ("venue_id");
  CREATE UNIQUE INDEX "concerts_legacy_id_idx" ON "concerts" USING btree ("legacy_id");
  CREATE INDEX "concerts_updated_at_idx" ON "concerts" USING btree ("updated_at");
  CREATE INDEX "concerts_created_at_idx" ON "concerts" USING btree ("created_at");
  CREATE INDEX "concerts__status_idx" ON "concerts" USING btree ("_status");
  CREATE INDEX "concerts_rels_order_idx" ON "concerts_rels" USING btree ("order");
  CREATE INDEX "concerts_rels_parent_idx" ON "concerts_rels" USING btree ("parent_id");
  CREATE INDEX "concerts_rels_path_idx" ON "concerts_rels" USING btree ("path");
  CREATE INDEX "concerts_rels_artists_id_idx" ON "concerts_rels" USING btree ("artists_id");
  CREATE INDEX "_concerts_v_parent_idx" ON "_concerts_v" USING btree ("parent_id");
  CREATE INDEX "_concerts_v_version_version_date_idx" ON "_concerts_v" USING btree ("version_date");
  CREATE INDEX "_concerts_v_version_version_venue_idx" ON "_concerts_v" USING btree ("version_venue_id");
  CREATE INDEX "_concerts_v_version_version_legacy_id_idx" ON "_concerts_v" USING btree ("version_legacy_id");
  CREATE INDEX "_concerts_v_version_version_updated_at_idx" ON "_concerts_v" USING btree ("version_updated_at");
  CREATE INDEX "_concerts_v_version_version_created_at_idx" ON "_concerts_v" USING btree ("version_created_at");
  CREATE INDEX "_concerts_v_version_version__status_idx" ON "_concerts_v" USING btree ("version__status");
  CREATE INDEX "_concerts_v_created_at_idx" ON "_concerts_v" USING btree ("created_at");
  CREATE INDEX "_concerts_v_updated_at_idx" ON "_concerts_v" USING btree ("updated_at");
  CREATE INDEX "_concerts_v_latest_idx" ON "_concerts_v" USING btree ("latest");
  CREATE INDEX "_concerts_v_rels_order_idx" ON "_concerts_v_rels" USING btree ("order");
  CREATE INDEX "_concerts_v_rels_parent_idx" ON "_concerts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_concerts_v_rels_path_idx" ON "_concerts_v_rels" USING btree ("path");
  CREATE INDEX "_concerts_v_rels_artists_id_idx" ON "_concerts_v_rels" USING btree ("artists_id");
  CREATE INDEX "ondemand_date_idx" ON "ondemand" USING btree ("date");
  CREATE INDEX "ondemand_image_idx" ON "ondemand" USING btree ("image_id");
  CREATE INDEX "ondemand_headline_idx" ON "ondemand" USING btree ("headline");
  CREATE UNIQUE INDEX "ondemand_legacy_id_idx" ON "ondemand" USING btree ("legacy_id");
  CREATE INDEX "ondemand_updated_at_idx" ON "ondemand" USING btree ("updated_at");
  CREATE INDEX "ondemand_created_at_idx" ON "ondemand" USING btree ("created_at");
  CREATE INDEX "ondemand__status_idx" ON "ondemand" USING btree ("_status");
  CREATE INDEX "ondemand_rels_order_idx" ON "ondemand_rels" USING btree ("order");
  CREATE INDEX "ondemand_rels_parent_idx" ON "ondemand_rels" USING btree ("parent_id");
  CREATE INDEX "ondemand_rels_path_idx" ON "ondemand_rels" USING btree ("path");
  CREATE INDEX "ondemand_rels_djs_id_idx" ON "ondemand_rels" USING btree ("djs_id");
  CREATE INDEX "ondemand_rels_artists_id_idx" ON "ondemand_rels" USING btree ("artists_id");
  CREATE INDEX "ondemand_rels_songs_id_idx" ON "ondemand_rels" USING btree ("songs_id");
  CREATE INDEX "_ondemand_v_parent_idx" ON "_ondemand_v" USING btree ("parent_id");
  CREATE INDEX "_ondemand_v_version_version_date_idx" ON "_ondemand_v" USING btree ("version_date");
  CREATE INDEX "_ondemand_v_version_version_image_idx" ON "_ondemand_v" USING btree ("version_image_id");
  CREATE INDEX "_ondemand_v_version_version_headline_idx" ON "_ondemand_v" USING btree ("version_headline");
  CREATE INDEX "_ondemand_v_version_version_legacy_id_idx" ON "_ondemand_v" USING btree ("version_legacy_id");
  CREATE INDEX "_ondemand_v_version_version_updated_at_idx" ON "_ondemand_v" USING btree ("version_updated_at");
  CREATE INDEX "_ondemand_v_version_version_created_at_idx" ON "_ondemand_v" USING btree ("version_created_at");
  CREATE INDEX "_ondemand_v_version_version__status_idx" ON "_ondemand_v" USING btree ("version__status");
  CREATE INDEX "_ondemand_v_created_at_idx" ON "_ondemand_v" USING btree ("created_at");
  CREATE INDEX "_ondemand_v_updated_at_idx" ON "_ondemand_v" USING btree ("updated_at");
  CREATE INDEX "_ondemand_v_latest_idx" ON "_ondemand_v" USING btree ("latest");
  CREATE INDEX "_ondemand_v_rels_order_idx" ON "_ondemand_v_rels" USING btree ("order");
  CREATE INDEX "_ondemand_v_rels_parent_idx" ON "_ondemand_v_rels" USING btree ("parent_id");
  CREATE INDEX "_ondemand_v_rels_path_idx" ON "_ondemand_v_rels" USING btree ("path");
  CREATE INDEX "_ondemand_v_rels_djs_id_idx" ON "_ondemand_v_rels" USING btree ("djs_id");
  CREATE INDEX "_ondemand_v_rels_artists_id_idx" ON "_ondemand_v_rels" USING btree ("artists_id");
  CREATE INDEX "_ondemand_v_rels_songs_id_idx" ON "_ondemand_v_rels" USING btree ("songs_id");
  CREATE INDEX "shows_date_idx" ON "shows" USING btree ("date");
  CREATE INDEX "shows_host_idx" ON "shows" USING btree ("host_id");
  CREATE UNIQUE INDEX "shows_legacy_id_idx" ON "shows" USING btree ("legacy_id");
  CREATE INDEX "shows_updated_at_idx" ON "shows" USING btree ("updated_at");
  CREATE INDEX "shows_created_at_idx" ON "shows" USING btree ("created_at");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_image_idx" ON "posts" USING btree ("image_id");
  CREATE UNIQUE INDEX "posts_legacy_id_idx" ON "posts" USING btree ("legacy_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_image_idx" ON "_posts_v" USING btree ("version_image_id");
  CREATE INDEX "_posts_v_version_version_legacy_id_idx" ON "_posts_v" USING btree ("version_legacy_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "cdoftheweek_record_idx" ON "cdoftheweek" USING btree ("record_id");
  CREATE INDEX "cdoftheweek_reviewer_idx" ON "cdoftheweek" USING btree ("reviewer_id");
  CREATE INDEX "cdoftheweek_date_idx" ON "cdoftheweek" USING btree ("date");
  CREATE UNIQUE INDEX "cdoftheweek_legacy_id_idx" ON "cdoftheweek" USING btree ("legacy_id");
  CREATE INDEX "cdoftheweek_updated_at_idx" ON "cdoftheweek" USING btree ("updated_at");
  CREATE INDEX "cdoftheweek_created_at_idx" ON "cdoftheweek" USING btree ("created_at");
  CREATE INDEX "cdoftheweek__status_idx" ON "cdoftheweek" USING btree ("_status");
  CREATE INDEX "_cdoftheweek_v_parent_idx" ON "_cdoftheweek_v" USING btree ("parent_id");
  CREATE INDEX "_cdoftheweek_v_version_version_record_idx" ON "_cdoftheweek_v" USING btree ("version_record_id");
  CREATE INDEX "_cdoftheweek_v_version_version_reviewer_idx" ON "_cdoftheweek_v" USING btree ("version_reviewer_id");
  CREATE INDEX "_cdoftheweek_v_version_version_date_idx" ON "_cdoftheweek_v" USING btree ("version_date");
  CREATE INDEX "_cdoftheweek_v_version_version_legacy_id_idx" ON "_cdoftheweek_v" USING btree ("version_legacy_id");
  CREATE INDEX "_cdoftheweek_v_version_version_updated_at_idx" ON "_cdoftheweek_v" USING btree ("version_updated_at");
  CREATE INDEX "_cdoftheweek_v_version_version_created_at_idx" ON "_cdoftheweek_v" USING btree ("version_created_at");
  CREATE INDEX "_cdoftheweek_v_version_version__status_idx" ON "_cdoftheweek_v" USING btree ("version__status");
  CREATE INDEX "_cdoftheweek_v_created_at_idx" ON "_cdoftheweek_v" USING btree ("created_at");
  CREATE INDEX "_cdoftheweek_v_updated_at_idx" ON "_cdoftheweek_v" USING btree ("updated_at");
  CREATE INDEX "_cdoftheweek_v_latest_idx" ON "_cdoftheweek_v" USING btree ("latest");
  CREATE INDEX "year_end_poll_results_blocks_ranked_songs_items_order_idx" ON "year_end_poll_results_blocks_ranked_songs_items" USING btree ("_order");
  CREATE INDEX "year_end_poll_results_blocks_ranked_songs_items_parent_id_idx" ON "year_end_poll_results_blocks_ranked_songs_items" USING btree ("_parent_id");
  CREATE INDEX "year_end_poll_results_blocks_ranked_songs_items_song_idx" ON "year_end_poll_results_blocks_ranked_songs_items" USING btree ("song_id");
  CREATE INDEX "year_end_poll_results_blocks_ranked_songs_order_idx" ON "year_end_poll_results_blocks_ranked_songs" USING btree ("_order");
  CREATE INDEX "year_end_poll_results_blocks_ranked_songs_parent_id_idx" ON "year_end_poll_results_blocks_ranked_songs" USING btree ("_parent_id");
  CREATE INDEX "year_end_poll_results_blocks_ranked_songs_path_idx" ON "year_end_poll_results_blocks_ranked_songs" USING btree ("_path");
  CREATE INDEX "year_end_poll_results_blocks_ranked_records_items_order_idx" ON "year_end_poll_results_blocks_ranked_records_items" USING btree ("_order");
  CREATE INDEX "year_end_poll_results_blocks_ranked_records_items_parent_id_idx" ON "year_end_poll_results_blocks_ranked_records_items" USING btree ("_parent_id");
  CREATE INDEX "year_end_poll_results_blocks_ranked_records_items_record_idx" ON "year_end_poll_results_blocks_ranked_records_items" USING btree ("record_id");
  CREATE INDEX "year_end_poll_results_blocks_ranked_records_order_idx" ON "year_end_poll_results_blocks_ranked_records" USING btree ("_order");
  CREATE INDEX "year_end_poll_results_blocks_ranked_records_parent_id_idx" ON "year_end_poll_results_blocks_ranked_records" USING btree ("_parent_id");
  CREATE INDEX "year_end_poll_results_blocks_ranked_records_path_idx" ON "year_end_poll_results_blocks_ranked_records" USING btree ("_path");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_on_demand_shows_order_idx" ON "year_end_poll_results_blocks_staff_picks_on_demand_shows" USING btree ("_order");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_on_demand_shows_parent_id_idx" ON "year_end_poll_results_blocks_staff_picks_on_demand_shows" USING btree ("_parent_id");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_on_demand_shows_idx" ON "year_end_poll_results_blocks_staff_picks_on_demand_shows" USING btree ("on_demand_id");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_song_picks_order_idx" ON "year_end_poll_results_blocks_staff_picks_song_picks" USING btree ("_order");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_song_picks_parent_id_idx" ON "year_end_poll_results_blocks_staff_picks_song_picks" USING btree ("_parent_id");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_song_picks_song_idx" ON "year_end_poll_results_blocks_staff_picks_song_picks" USING btree ("song_id");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_record_picks_order_idx" ON "year_end_poll_results_blocks_staff_picks_record_picks" USING btree ("_order");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_record_picks_parent_id_idx" ON "year_end_poll_results_blocks_staff_picks_record_picks" USING btree ("_parent_id");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_record_picks_re_idx" ON "year_end_poll_results_blocks_staff_picks_record_picks" USING btree ("record_id");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_order_idx" ON "year_end_poll_results_blocks_staff_picks" USING btree ("_order");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_parent_id_idx" ON "year_end_poll_results_blocks_staff_picks" USING btree ("_parent_id");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_path_idx" ON "year_end_poll_results_blocks_staff_picks" USING btree ("_path");
  CREATE INDEX "year_end_poll_results_blocks_staff_picks_dj_idx" ON "year_end_poll_results_blocks_staff_picks" USING btree ("dj_id");
  CREATE INDEX "year_end_poll_results_blocks_text_content_order_idx" ON "year_end_poll_results_blocks_text_content" USING btree ("_order");
  CREATE INDEX "year_end_poll_results_blocks_text_content_parent_id_idx" ON "year_end_poll_results_blocks_text_content" USING btree ("_parent_id");
  CREATE INDEX "year_end_poll_results_blocks_text_content_path_idx" ON "year_end_poll_results_blocks_text_content" USING btree ("_path");
  CREATE UNIQUE INDEX "year_end_poll_results_slug_idx" ON "year_end_poll_results" USING btree ("slug");
  CREATE INDEX "year_end_poll_results_featured_image_idx" ON "year_end_poll_results" USING btree ("featured_image_id");
  CREATE INDEX "year_end_poll_results_updated_at_idx" ON "year_end_poll_results" USING btree ("updated_at");
  CREATE INDEX "year_end_poll_results_created_at_idx" ON "year_end_poll_results" USING btree ("created_at");
  CREATE INDEX "year_end_poll_results__status_idx" ON "year_end_poll_results" USING btree ("_status");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_songs_items_order_idx" ON "_year_end_poll_results_v_blocks_ranked_songs_items" USING btree ("_order");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_songs_items_parent_id_idx" ON "_year_end_poll_results_v_blocks_ranked_songs_items" USING btree ("_parent_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_songs_items_song_idx" ON "_year_end_poll_results_v_blocks_ranked_songs_items" USING btree ("song_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_songs_order_idx" ON "_year_end_poll_results_v_blocks_ranked_songs" USING btree ("_order");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_songs_parent_id_idx" ON "_year_end_poll_results_v_blocks_ranked_songs" USING btree ("_parent_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_songs_path_idx" ON "_year_end_poll_results_v_blocks_ranked_songs" USING btree ("_path");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_records_items_order_idx" ON "_year_end_poll_results_v_blocks_ranked_records_items" USING btree ("_order");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_records_items_parent_id_idx" ON "_year_end_poll_results_v_blocks_ranked_records_items" USING btree ("_parent_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_records_items_rec_idx" ON "_year_end_poll_results_v_blocks_ranked_records_items" USING btree ("record_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_records_order_idx" ON "_year_end_poll_results_v_blocks_ranked_records" USING btree ("_order");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_records_parent_id_idx" ON "_year_end_poll_results_v_blocks_ranked_records" USING btree ("_parent_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_ranked_records_path_idx" ON "_year_end_poll_results_v_blocks_ranked_records" USING btree ("_path");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows_order_idx" ON "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows" USING btree ("_order");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows_parent_id_idx" ON "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows" USING btree ("_parent_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_on_demand_sh_idx" ON "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows" USING btree ("on_demand_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_song_picks_order_idx" ON "_year_end_poll_results_v_blocks_staff_picks_song_picks" USING btree ("_order");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_song_picks_parent_id_idx" ON "_year_end_poll_results_v_blocks_staff_picks_song_picks" USING btree ("_parent_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_song_picks_s_idx" ON "_year_end_poll_results_v_blocks_staff_picks_song_picks" USING btree ("song_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_record_picks_order_idx" ON "_year_end_poll_results_v_blocks_staff_picks_record_picks" USING btree ("_order");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_record_picks_parent_id_idx" ON "_year_end_poll_results_v_blocks_staff_picks_record_picks" USING btree ("_parent_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_record_picks_idx" ON "_year_end_poll_results_v_blocks_staff_picks_record_picks" USING btree ("record_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_order_idx" ON "_year_end_poll_results_v_blocks_staff_picks" USING btree ("_order");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_parent_id_idx" ON "_year_end_poll_results_v_blocks_staff_picks" USING btree ("_parent_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_path_idx" ON "_year_end_poll_results_v_blocks_staff_picks" USING btree ("_path");
  CREATE INDEX "_year_end_poll_results_v_blocks_staff_picks_dj_idx" ON "_year_end_poll_results_v_blocks_staff_picks" USING btree ("dj_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_text_content_order_idx" ON "_year_end_poll_results_v_blocks_text_content" USING btree ("_order");
  CREATE INDEX "_year_end_poll_results_v_blocks_text_content_parent_id_idx" ON "_year_end_poll_results_v_blocks_text_content" USING btree ("_parent_id");
  CREATE INDEX "_year_end_poll_results_v_blocks_text_content_path_idx" ON "_year_end_poll_results_v_blocks_text_content" USING btree ("_path");
  CREATE INDEX "_year_end_poll_results_v_parent_idx" ON "_year_end_poll_results_v" USING btree ("parent_id");
  CREATE INDEX "_year_end_poll_results_v_version_version_slug_idx" ON "_year_end_poll_results_v" USING btree ("version_slug");
  CREATE INDEX "_year_end_poll_results_v_version_version_featured_image_idx" ON "_year_end_poll_results_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_year_end_poll_results_v_version_version_updated_at_idx" ON "_year_end_poll_results_v" USING btree ("version_updated_at");
  CREATE INDEX "_year_end_poll_results_v_version_version_created_at_idx" ON "_year_end_poll_results_v" USING btree ("version_created_at");
  CREATE INDEX "_year_end_poll_results_v_version_version__status_idx" ON "_year_end_poll_results_v" USING btree ("version__status");
  CREATE INDEX "_year_end_poll_results_v_created_at_idx" ON "_year_end_poll_results_v" USING btree ("created_at");
  CREATE INDEX "_year_end_poll_results_v_updated_at_idx" ON "_year_end_poll_results_v" USING btree ("updated_at");
  CREATE INDEX "_year_end_poll_results_v_latest_idx" ON "_year_end_poll_results_v" USING btree ("latest");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_people_id_idx" ON "payload_locked_documents_rels" USING btree ("people_id");
  CREATE INDEX "payload_locked_documents_rels_djs_id_idx" ON "payload_locked_documents_rels" USING btree ("djs_id");
  CREATE INDEX "payload_locked_documents_rels_artists_id_idx" ON "payload_locked_documents_rels" USING btree ("artists_id");
  CREATE INDEX "payload_locked_documents_rels_venues_id_idx" ON "payload_locked_documents_rels" USING btree ("venues_id");
  CREATE INDEX "payload_locked_documents_rels_ads_id_idx" ON "payload_locked_documents_rels" USING btree ("ads_id");
  CREATE INDEX "payload_locked_documents_rels_songs_id_idx" ON "payload_locked_documents_rels" USING btree ("songs_id");
  CREATE INDEX "payload_locked_documents_rels_records_id_idx" ON "payload_locked_documents_rels" USING btree ("records_id");
  CREATE INDEX "payload_locked_documents_rels_concerts_id_idx" ON "payload_locked_documents_rels" USING btree ("concerts_id");
  CREATE INDEX "payload_locked_documents_rels_ondemand_id_idx" ON "payload_locked_documents_rels" USING btree ("ondemand_id");
  CREATE INDEX "payload_locked_documents_rels_shows_id_idx" ON "payload_locked_documents_rels" USING btree ("shows_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_cdoftheweek_id_idx" ON "payload_locked_documents_rels" USING btree ("cdoftheweek_id");
  CREATE INDEX "payload_locked_documents_rels_year_end_poll_results_id_idx" ON "payload_locked_documents_rels" USING btree ("year_end_poll_results_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "people" CASCADE;
  DROP TABLE "djs" CASCADE;
  DROP TABLE "djs_rels" CASCADE;
  DROP TABLE "_djs_v" CASCADE;
  DROP TABLE "_djs_v_rels" CASCADE;
  DROP TABLE "artists" CASCADE;
  DROP TABLE "artists_rels" CASCADE;
  DROP TABLE "venues" CASCADE;
  DROP TABLE "ads" CASCADE;
  DROP TABLE "_ads_v" CASCADE;
  DROP TABLE "songs" CASCADE;
  DROP TABLE "records" CASCADE;
  DROP TABLE "concerts" CASCADE;
  DROP TABLE "concerts_rels" CASCADE;
  DROP TABLE "_concerts_v" CASCADE;
  DROP TABLE "_concerts_v_rels" CASCADE;
  DROP TABLE "ondemand" CASCADE;
  DROP TABLE "ondemand_rels" CASCADE;
  DROP TABLE "_ondemand_v" CASCADE;
  DROP TABLE "_ondemand_v_rels" CASCADE;
  DROP TABLE "shows" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "cdoftheweek" CASCADE;
  DROP TABLE "_cdoftheweek_v" CASCADE;
  DROP TABLE "year_end_poll_results_blocks_ranked_songs_items" CASCADE;
  DROP TABLE "year_end_poll_results_blocks_ranked_songs" CASCADE;
  DROP TABLE "year_end_poll_results_blocks_ranked_records_items" CASCADE;
  DROP TABLE "year_end_poll_results_blocks_ranked_records" CASCADE;
  DROP TABLE "year_end_poll_results_blocks_staff_picks_on_demand_shows" CASCADE;
  DROP TABLE "year_end_poll_results_blocks_staff_picks_song_picks" CASCADE;
  DROP TABLE "year_end_poll_results_blocks_staff_picks_record_picks" CASCADE;
  DROP TABLE "year_end_poll_results_blocks_staff_picks" CASCADE;
  DROP TABLE "year_end_poll_results_blocks_text_content" CASCADE;
  DROP TABLE "year_end_poll_results" CASCADE;
  DROP TABLE "_year_end_poll_results_v_blocks_ranked_songs_items" CASCADE;
  DROP TABLE "_year_end_poll_results_v_blocks_ranked_songs" CASCADE;
  DROP TABLE "_year_end_poll_results_v_blocks_ranked_records_items" CASCADE;
  DROP TABLE "_year_end_poll_results_v_blocks_ranked_records" CASCADE;
  DROP TABLE "_year_end_poll_results_v_blocks_staff_picks_on_demand_shows" CASCADE;
  DROP TABLE "_year_end_poll_results_v_blocks_staff_picks_song_picks" CASCADE;
  DROP TABLE "_year_end_poll_results_v_blocks_staff_picks_record_picks" CASCADE;
  DROP TABLE "_year_end_poll_results_v_blocks_staff_picks" CASCADE;
  DROP TABLE "_year_end_poll_results_v_blocks_text_content" CASCADE;
  DROP TABLE "_year_end_poll_results_v" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_djs_status";
  DROP TYPE "public"."enum__djs_v_version_status";
  DROP TYPE "public"."enum_ads_status";
  DROP TYPE "public"."enum__ads_v_version_status";
  DROP TYPE "public"."enum_concerts_status";
  DROP TYPE "public"."enum__concerts_v_version_status";
  DROP TYPE "public"."enum_ondemand_status";
  DROP TYPE "public"."enum__ondemand_v_version_status";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_cdoftheweek_status";
  DROP TYPE "public"."enum__cdoftheweek_v_version_status";
  DROP TYPE "public"."enum_year_end_poll_results_page_type";
  DROP TYPE "public"."enum_year_end_poll_results_status";
  DROP TYPE "public"."enum__year_end_poll_results_v_version_page_type";
  DROP TYPE "public"."enum__year_end_poll_results_v_version_status";`)
}
