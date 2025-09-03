-- Script to remove public access to menu items
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. REMOVE PUBLIC VIEW
-- ========================================

-- Drop the public view that allows anonymous access
DROP VIEW IF EXISTS available_menu_items;

-- ========================================
-- 2. UPDATE RLS POLICIES
-- ========================================

-- Drop existing public policies
DROP POLICY IF EXISTS "Anyone can view available menu items" ON menu_items;

-- Create new policy for authenticated users only
CREATE POLICY "Authenticated users can view menu items" ON menu_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- 3. VERIFY CHANGES
-- ========================================

-- Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'menu_items';

-- Check that no public views exist
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'available_menu_items';

-- ========================================
-- 4. TEST ACCESS
-- ========================================

-- This should now fail for anonymous users (good!)
-- SELECT * FROM menu_items LIMIT 1;

-- This should work for authenticated users
-- SELECT * FROM menu_items LIMIT 1;
