-- =====================================================================
-- ENQUIRIES TABLE SETUP & POLICIES (Stage 2 Lead Capture)
-- =====================================================================

CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    course_interest VARCHAR(100) NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'archived')),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- 1. Allow anonymous visitors to submit enquiries from landing page
DROP POLICY IF EXISTS "Public anonymous insert enquiries" ON enquiries;
CREATE POLICY "Public anonymous insert enquiries" ON enquiries
    FOR INSERT WITH CHECK (true);

-- 2. Allow authenticated admin / staff to view enquiries
DROP POLICY IF EXISTS "Authenticated users view enquiries" ON enquiries;
CREATE POLICY "Authenticated users view enquiries" ON enquiries
    FOR SELECT TO authenticated USING (true);

-- 3. Allow authenticated admin / staff to update enquiries (e.g. status, notes)
DROP POLICY IF EXISTS "Authenticated users update enquiries" ON enquiries;
CREATE POLICY "Authenticated users update enquiries" ON enquiries
    FOR UPDATE TO authenticated USING (true);

-- 4. Allow authenticated admin / staff to delete enquiries
DROP POLICY IF EXISTS "Authenticated users delete enquiries" ON enquiries;
CREATE POLICY "Authenticated users delete enquiries" ON enquiries
    FOR DELETE TO authenticated USING (true);
