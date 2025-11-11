-- Fix the column name in leave_requests table to match the entity mapping
-- Rename employee_id column to user_id (PostgreSQL version)

DO $$
BEGIN
    -- Check if employee_id column exists and user_id column doesn't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' 
        AND column_name = 'employee_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE leave_requests RENAME COLUMN employee_id TO user_id;
    END IF;
END $$;