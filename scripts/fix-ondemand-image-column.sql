-- Migration to change ondemand.image from text to integer (media relationship)
-- This script handles the column type change for the image field

BEGIN;

-- Drop the old text column (data will be lost, but it was just URLs)
ALTER TABLE ondemand DROP COLUMN IF EXISTS image;

-- Add the new integer column for media relationship
ALTER TABLE ondemand ADD COLUMN image_id INTEGER;

-- Add foreign key constraint
ALTER TABLE ondemand 
  ADD CONSTRAINT ondemand_image_id_media_id_fk 
  FOREIGN KEY (image_id) 
  REFERENCES media(id) 
  ON DELETE SET NULL 
  ON UPDATE NO ACTION;

-- Make it nullable since we're dropping old data
-- If you want it required, you'll need to populate data first

COMMIT;
