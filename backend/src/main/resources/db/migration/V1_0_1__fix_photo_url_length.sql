-- Fix photo URL column lengths to accommodate base64 images
ALTER TABLE attendance 
ALTER COLUMN check_in_photo_url TYPE TEXT,
ALTER COLUMN check_out_photo_url TYPE TEXT;

