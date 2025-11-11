-- Add check-in and check-out photo URL columns to attendance table
-- PostgreSQL compatible version

-- Add check_in_photo_url if missing
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

-- Add check_out_photo_url if missing
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