-- Repair script to ensure the attendance table has the correct schema
-- PostgreSQL compatible version

-- Add check_in_photo_url column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
        AND column_name = 'check_in_photo_url'
    ) THEN
        ALTER TABLE attendance ADD COLUMN check_in_photo_url VARCHAR(500) NULL;
    END IF;
END $$;

-- Add check_out_photo_url column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
        AND column_name = 'check_out_photo_url'
    ) THEN
        ALTER TABLE attendance ADD COLUMN check_out_photo_url VARCHAR(500) NULL;
    END IF;
END $$;

-- Drop the old photo column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' 
        AND column_name = 'photo'
    ) THEN
        ALTER TABLE attendance DROP COLUMN photo;
    END IF;
END $$;