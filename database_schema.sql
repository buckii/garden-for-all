-- Garden For All Database Schema
-- This file contains the complete database schema for the Supabase backend

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE produce_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE produce_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES produce_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit_type TEXT NOT NULL CHECK (unit_type IN ('pounds', 'pints', 'bunches')),
    conversion_factor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE food_pantries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_info JSONB,
    commitment_amounts JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE harvest_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    produce_type_id UUID REFERENCES produce_types(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    harvest_date DATE NOT NULL,
    harvester_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE pantry_distributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pantry_id UUID REFERENCES food_pantries(id) ON DELETE CASCADE,
    harvest_entry_id UUID REFERENCES harvest_entries(id) ON DELETE CASCADE,
    quantity_distributed DECIMAL(10,2) NOT NULL,
    distribution_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_produce_types_category_id ON produce_types(category_id);
CREATE INDEX idx_harvest_entries_produce_type_id ON harvest_entries(produce_type_id);
CREATE INDEX idx_harvest_entries_harvest_date ON harvest_entries(harvest_date);
CREATE INDEX idx_pantry_distributions_pantry_id ON pantry_distributions(pantry_id);
CREATE INDEX idx_pantry_distributions_harvest_entry_id ON pantry_distributions(harvest_entry_id);
CREATE INDEX idx_pantry_distributions_date ON pantry_distributions(distribution_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_produce_categories_updated_at
    BEFORE UPDATE ON produce_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produce_types_updated_at
    BEFORE UPDATE ON produce_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_pantries_updated_at
    BEFORE UPDATE ON food_pantries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_entries_updated_at
    BEFORE UPDATE ON harvest_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE produce_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_pantries ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_distributions ENABLE ROW LEVEL SECURITY;

-- Updated RLS Policies: Authenticated users can read all tables, appropriate write permissions

-- Produce Categories: Read for all authenticated, Write for admins
CREATE POLICY "Allow authenticated read produce categories" ON produce_categories
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin write produce categories" ON produce_categories
    FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'app_metadata')::json ->> 'role' = 'admin');

CREATE POLICY "Allow admin update produce categories" ON produce_categories
    FOR UPDATE
    USING ((auth.jwt() ->> 'app_metadata')::json ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete produce categories" ON produce_categories
    FOR DELETE
    USING ((auth.jwt() ->> 'app_metadata')::json ->> 'role' = 'admin');

-- Produce Types: Read for all authenticated, Write for admins
CREATE POLICY "Allow authenticated read produce types" ON produce_types
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin write produce types" ON produce_types
    FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'app_metadata')::json ->> 'role' = 'admin');

CREATE POLICY "Allow admin update produce types" ON produce_types
    FOR UPDATE
    USING ((auth.jwt() ->> 'app_metadata')::json ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete produce types" ON produce_types
    FOR DELETE
    USING ((auth.jwt() ->> 'app_metadata')::json ->> 'role' = 'admin');

-- Food Pantries: Read for all authenticated, Write for admins
CREATE POLICY "Allow authenticated read food pantries" ON food_pantries
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin write food pantries" ON food_pantries
    FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'app_metadata')::json ->> 'role' = 'admin');

CREATE POLICY "Allow admin update food pantries" ON food_pantries
    FOR UPDATE
    USING ((auth.jwt() ->> 'app_metadata')::json ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete food pantries" ON food_pantries
    FOR DELETE
    USING ((auth.jwt() ->> 'app_metadata')::json ->> 'role' = 'admin');

-- Harvest Entries: Read for authenticated, Insert for anyone, Update/Delete for authenticated only
CREATE POLICY "Allow authenticated read harvest entries" ON harvest_entries
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow anyone insert harvest entries" ON harvest_entries
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update harvest entries" ON harvest_entries
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete harvest entries" ON harvest_entries
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Pantry Distributions: Read for all authenticated, Write for all authenticated
CREATE POLICY "Allow authenticated access pantry distributions" ON pantry_distributions
    FOR ALL
    USING (auth.uid() IS NOT NULL);

-- Insert sample data
INSERT INTO produce_categories (name, description, display_order) VALUES
    ('Vegetables', 'Fresh vegetables from the garden', 1),
    ('Fruits', 'Fresh fruits and berries', 2),
    ('Herbs', 'Fresh herbs and seasonings', 3),
    ('Flowers', 'Cut flowers for distribution', 4);

INSERT INTO produce_types (category_id, name, unit_type, conversion_factor) VALUES
    ((SELECT id FROM produce_categories WHERE name = 'Vegetables'), 'Tomatoes', 'pounds', 3.50),
    ((SELECT id FROM produce_categories WHERE name = 'Vegetables'), 'Carrots', 'pounds', 2.00),
    ((SELECT id FROM produce_categories WHERE name = 'Vegetables'), 'Lettuce', 'bunches', 2.50),
    ((SELECT id FROM produce_categories WHERE name = 'Vegetables'), 'Bell Peppers', 'pounds', 4.00),
    ((SELECT id FROM produce_categories WHERE name = 'Vegetables'), 'Cucumbers', 'pounds', 2.50),
    ((SELECT id FROM produce_categories WHERE name = 'Vegetables'), 'Zucchini', 'pounds', 2.00),
    ((SELECT id FROM produce_categories WHERE name = 'Fruits'), 'Strawberries', 'pints', 5.00),
    ((SELECT id FROM produce_categories WHERE name = 'Fruits'), 'Blueberries', 'pints', 6.00),
    ((SELECT id FROM produce_categories WHERE name = 'Herbs'), 'Basil', 'bunches', 3.00),
    ((SELECT id FROM produce_categories WHERE name = 'Herbs'), 'Parsley', 'bunches', 2.50),
    ((SELECT id FROM produce_categories WHERE name = 'Flowers'), 'Sunflowers', 'bunches', 4.00),
    ((SELECT id FROM produce_categories WHERE name = 'Flowers'), 'Zinnias', 'bunches', 3.00);

INSERT INTO food_pantries (name, contact_info, commitment_amounts) VALUES
    ('New Albany Food Pantry', 
     '{"phone": "614-555-0101", "email": "contact@nafoodpantry.org", "address": "123 Main St, New Albany, OH"}',
     '{"total": 5000, "vegetables": 3000, "fruits": 1500, "herbs": 300, "flowers": 200}'),
    ('Licking County Food Pantry',
     '{"phone": "614-555-0202", "email": "info@lickingcountyfood.org", "address": "456 Oak Ave, Newark, OH"}',
     '{"total": 3500, "vegetables": 2500, "fruits": 800, "herbs": 150, "flowers": 50}'),
    ('Community Kitchen',
     '{"phone": "614-555-0303", "email": "help@communitykitchen.org", "address": "789 Pine St, Granville, OH"}',
     '{"total": 2500, "vegetables": 2000, "fruits": 400, "herbs": 100, "flowers": 0}');

-- Create database functions for reporting
CREATE OR REPLACE FUNCTION get_daily_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_quantity DECIMAL,
    total_value DECIMAL,
    produce_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(he.quantity), 0) as total_quantity,
        COALESCE(SUM(he.quantity * pt.conversion_factor), 0) as total_value,
        COUNT(he.id) as produce_count
    FROM harvest_entries he
    JOIN produce_types pt ON he.produce_type_id = pt.id
    WHERE he.harvest_date = target_date;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_weekly_summary(week_start DATE DEFAULT DATE_TRUNC('week', CURRENT_DATE))
RETURNS TABLE (
    total_quantity DECIMAL,
    total_value DECIMAL,
    produce_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(he.quantity), 0) as total_quantity,
        COALESCE(SUM(he.quantity * pt.conversion_factor), 0) as total_value,
        COUNT(he.id) as produce_count
    FROM harvest_entries he
    JOIN produce_types pt ON he.produce_type_id = pt.id
    WHERE he.harvest_date >= week_start 
    AND he.harvest_date < week_start + INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_monthly_summary(month_start DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE))
RETURNS TABLE (
    total_quantity DECIMAL,
    total_value DECIMAL,
    produce_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(he.quantity), 0) as total_quantity,
        COALESCE(SUM(he.quantity * pt.conversion_factor), 0) as total_value,
        COUNT(he.id) as produce_count
    FROM harvest_entries he
    JOIN produce_types pt ON he.produce_type_id = pt.id
    WHERE he.harvest_date >= month_start 
    AND he.harvest_date < (month_start + INTERVAL '1 month');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pantry_progress()
RETURNS TABLE (
    pantry_id UUID,
    pantry_name TEXT,
    committed DECIMAL,
    delivered DECIMAL,
    remaining DECIMAL,
    percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fp.id as pantry_id,
        fp.name as pantry_name,
        COALESCE((fp.commitment_amounts->>'total')::DECIMAL, 0) as committed,
        COALESCE(SUM(pd.quantity_distributed * pt.conversion_factor), 0) as delivered,
        GREATEST(0, COALESCE((fp.commitment_amounts->>'total')::DECIMAL, 0) - COALESCE(SUM(pd.quantity_distributed * pt.conversion_factor), 0)) as remaining,
        CASE 
            WHEN COALESCE((fp.commitment_amounts->>'total')::DECIMAL, 0) > 0 
            THEN LEAST(100, (COALESCE(SUM(pd.quantity_distributed * pt.conversion_factor), 0) / (fp.commitment_amounts->>'total')::DECIMAL) * 100)
            ELSE 0 
        END as percentage
    FROM food_pantries fp
    LEFT JOIN pantry_distributions pd ON fp.id = pd.pantry_id
    LEFT JOIN harvest_entries he ON pd.harvest_entry_id = he.id
    LEFT JOIN produce_types pt ON he.produce_type_id = pt.id
    WHERE pd.distribution_date IS NULL OR pd.distribution_date >= DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY fp.id, fp.name, fp.commitment_amounts;
END;
$$ LANGUAGE plpgsql;