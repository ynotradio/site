-- Migration: Add missing fields to ondemand table for PHP read model compatibility
-- Date: 2026-01-04
-- Purpose: Update ondemand table schema to match MySQL fields for PostgresOnDemand read model

-- Check if columns exist before adding them to make migration idempotent
DO $$ 
BEGIN
    -- Add date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ondemand' AND column_name='date') THEN
        ALTER TABLE ondemand ADD COLUMN date timestamp(3) with time zone;
    END IF;

    -- Add image column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ondemand' AND column_name='image') THEN
        ALTER TABLE ondemand ADD COLUMN image varchar(255);
    END IF;

    -- Add headline column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ondemand' AND column_name='headline') THEN
        ALTER TABLE ondemand ADD COLUMN headline varchar(255);
    END IF;

    -- Add note column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ondemand' AND column_name='note') THEN
        ALTER TABLE ondemand ADD COLUMN note text;
    END IF;

    -- Add songs column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ondemand' AND column_name='songs') THEN
        ALTER TABLE ondemand ADD COLUMN songs text;
    END IF;

    -- Add audio_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ondemand' AND column_name='audio_url') THEN
        ALTER TABLE ondemand ADD COLUMN audio_url varchar(255);
    END IF;

    -- Add source column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ondemand' AND column_name='source') THEN
        ALTER TABLE ondemand ADD COLUMN source varchar(10) DEFAULT 'opendrive';
    END IF;
END $$;

-- Note: The title, artist_id, stream_url columns from the original schema can remain
-- for backward compatibility, but they're not used by the PHP read model
