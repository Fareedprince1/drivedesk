-- =====================================================================
-- GEM DRIVING SCHOOL / DRIVEDESK - MIGRATION
-- Add instructor_id to expenses table for instructor salary management
-- Run this in your Supabase Dashboard > SQL Editor > Click "Run"
-- =====================================================================

-- 1. Add instructor_id column if not exists
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL;

-- 2. Create index for fast instructor salary aggregations
CREATE INDEX IF NOT EXISTS idx_expenses_instructor_id ON expenses(instructor_id);

-- 3. Verify column exists
COMMENT ON COLUMN expenses.instructor_id IS 'Associated instructor for salary expenses';
