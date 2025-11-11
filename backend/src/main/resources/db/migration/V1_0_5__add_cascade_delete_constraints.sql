-- Add cascade delete constraints to ensure related records are deleted when a user is deleted
-- PostgreSQL version

-- Drop existing foreign key constraints if they exist
DO $$
DECLARE
    fk_leave_requests_name text;
    fk_attendance_name text;
BEGIN
    -- Get foreign key constraint names
    SELECT conname INTO fk_leave_requests_name
    FROM pg_constraint 
    WHERE conrelid = 'leave_requests'::regclass 
    AND confrelid = 'users'::regclass 
    AND contype = 'f';
    
    SELECT conname INTO fk_attendance_name
    FROM pg_constraint 
    WHERE conrelid = 'attendance'::regclass 
    AND confrelid = 'users'::regclass 
    AND contype = 'f';
    
    -- Drop existing constraints
    IF fk_leave_requests_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE leave_requests DROP CONSTRAINT ' || fk_leave_requests_name;
    END IF;
    
    IF fk_attendance_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE attendance DROP CONSTRAINT ' || fk_attendance_name;
    END IF;
END $$;

-- Add foreign key constraints with cascade delete
ALTER TABLE leave_requests 
ADD CONSTRAINT fk_leave_requests_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE attendance 
ADD CONSTRAINT fk_attendance_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;