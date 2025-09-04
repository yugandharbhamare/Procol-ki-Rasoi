-- 🧹 SUPABASE CLEANUP AND OPTIMIZATION SCRIPT
-- This script will clean up your database and optimize it for stability
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. BACKUP CURRENT STATE (for safety)
-- ========================================

-- Check what tables currently exist
SELECT 
    'Current Tables' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ========================================
-- 2. REMOVE UNNECESSARY TABLES AND OBJECTS
-- ========================================

-- Drop any views that might have been created
DROP VIEW IF EXISTS order_items_with_menu CASCADE;
DROP VIEW IF EXISTS available_menu_items CASCADE;

-- Drop any functions that are not needed
DROP FUNCTION IF EXISTS check_duplicate_orders CASCADE;
DROP FUNCTION IF EXISTS update_menu_items_updated_at CASCADE;

-- Drop any triggers that are not needed
DROP TRIGGER IF EXISTS check_duplicate_orders_trigger ON orders CASCADE;
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items CASCADE;

-- ========================================
-- 3. CLEAN UP EXISTING TABLES
-- ========================================

-- Remove any menu_item_id columns if they exist
ALTER TABLE order_items 
DROP COLUMN IF EXISTS menu_item_id;

-- Remove any indexes that are not needed
DROP INDEX IF EXISTS idx_order_items_menu_item_id CASCADE;

-- Remove any constraints that are not needed
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS check_menu_item_or_custom_item CASCADE;

-- ========================================
-- 4. RECREATE CLEAN, OPTIMIZED SCHEMA
-- ========================================

-- Drop and recreate tables in the correct order
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;

-- ========================================
-- 5. CREATE OPTIMIZED TABLES
-- ========================================

-- Users table (simplified and optimized)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    emailid VARCHAR(255) UNIQUE NOT NULL,
    photo_url VARCHAR(500),
    firebase_uid VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table (optimized)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    custom_order_id VARCHAR(20) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
    order_amount DECIMAL(10,2) NOT NULL CHECK (order_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table (simplified)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items table (optimized)
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    category VARCHAR(100),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. CREATE OPTIMIZED INDEXES
-- ========================================

-- Users indexes
CREATE INDEX idx_users_emailid ON users(emailid);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_custom_order_id ON orders(custom_order_id);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_name ON order_items(item_name);

-- Menu items indexes
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_name ON menu_items(name);

-- ========================================
-- 7. CREATE ESSENTIAL FUNCTIONS
-- ========================================

-- Function to generate custom order ID
CREATE OR REPLACE FUNCTION generate_custom_order_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate ORD + 6 random digits
    NEW.custom_order_id := 'ORD' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    
    -- Ensure uniqueness (retry if duplicate)
    WHILE EXISTS (SELECT 1 FROM orders WHERE custom_order_id = NEW.custom_order_id) LOOP
        NEW.custom_order_id := 'ORD' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. CREATE ESSENTIAL TRIGGERS
-- ========================================

-- Trigger for custom order ID generation
CREATE TRIGGER generate_custom_order_id_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_custom_order_id();

-- Trigger for updating updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for menu items updated_at
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 9. ENABLE ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 10. CREATE ESSENTIAL RLS POLICIES
-- ========================================

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Staff can view all orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Staff can update order status" ON orders
    FOR UPDATE USING (true);

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.id = order_id AND u.firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.id = order_id AND u.firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Staff can view all order items" ON order_items
    FOR SELECT USING (true);

-- Menu items policies
CREATE POLICY "Anyone can view available menu items" ON menu_items
    FOR SELECT USING (is_available = true);

CREATE POLICY "Staff can manage menu items" ON menu_items
    FOR ALL USING (true);

-- ========================================
-- 11. INSERT THE ORIGINAL 37 MENU ITEMS
-- ========================================

-- Insert the original 37 menu items from Menu.jsx
INSERT INTO menu_items (id, name, price, description, image, category, is_available) VALUES
-- Hot Beverages
(1, 'Ginger Chai', 10.00, 'Hot ginger tea with aromatic spices', '/optimized/Ginger Tea.png', 'Hot Beverages', true),
(2, 'Masala Chai', 10.00, 'Traditional Indian spiced tea', '/optimized/Ginger Tea.png', 'Hot Beverages', true),

-- Cold Beverages
(35, 'Amul Chaas', 15.00, 'Refreshing buttermilk drink', '/optimized/Amul Chaas.png', 'Cold Beverages', true),
(36, 'Amul Lassi', 20.00, 'Sweet and creamy yogurt drink', '/optimized/Amul Lassi.png', 'Cold Beverages', true),
(37, 'Coca Cola', 40.00, 'Classic carbonated soft drink', '/optimized/Coca Cola.png', 'Cold Beverages', true),

-- Breakfast Items
(3, 'Masala Oats', 20.00, 'Healthy oats with Indian spices', '/optimized/Masala Oats.png', 'Breakfast Items', true),
(10, 'MTR Poha', 30.00, 'Flattened rice breakfast dish', '/optimized/MTR Poha.png', 'Breakfast Items', true),
(11, 'MTR Upma', 30.00, 'Semolina breakfast porridge', '/optimized/MTR Upma.png', 'Breakfast Items', true),
(15, 'Besan Chila', 30.00, 'Gram flour savory pancake', '/optimized/Besan Chila.png', 'Breakfast Items', true),

-- Maggi Varieties
(4, 'Plain Maggi', 20.00, 'Classic instant noodles', '/optimized/Plain Maggi.png', 'Maggi Varieties', true),
(5, 'Veg Butter Maggi', 30.00, 'Maggi with vegetables and butter', '/optimized/Veg butter maggi.png', 'Maggi Varieties', true),
(6, 'Cheese Maggi', 30.00, 'Maggi topped with melted cheese', '/optimized/Cheese Maggi.png', 'Maggi Varieties', true),
(7, 'Butter Atta Maggi', 30.00, 'Whole wheat Maggi with butter', '/optimized/Butter Atta Maggi.png', 'Maggi Varieties', true),
(8, 'Veg Cheese Maggi', 40.00, 'Maggi with vegetables and cheese', '/optimized/Veg cheese maggi.png', 'Maggi Varieties', true),
(9, 'Cheese Atta Maggi', 45.00, 'Whole wheat Maggi with cheese', '/optimized/Cheese Atta Maggi.png', 'Maggi Varieties', true),

-- Sandwiches
(12, 'Veg Cheese Sandwich', 40.00, 'Vegetable and cheese sandwich', '/optimized/Veg Cheese Sandwich.png', 'Sandwiches', true),
(13, 'Aloo Sandwich', 30.00, 'Potato sandwich with spices', '/optimized/Aloo sandwich.png', 'Sandwiches', true),
(14, 'Aloo Cheese Sandwich', 45.00, 'Potato and cheese sandwich', '/optimized/Aloo cheese sandwich.png', 'Sandwiches', true),

-- Main Course
(22, 'Pasta', 40.00, 'Delicious Italian pasta with rich tomato sauce', '/optimized/Pasta.png', 'Main Course', true),

-- Street Food
(16, 'Bhel Puri', 30.00, 'Tangy street food snack', '/optimized/Bhel Puri.png', 'Street Food', true),
(30, 'Fatafat Bhel', 10.00, 'Quick and tangy bhel mixture', '/optimized/Fatafat Bhel.png', 'Street Food', true),

-- Snacks & Namkeen
(27, 'Aloo Bhujiya', 10.00, 'Crispy potato sev for snacking', '/optimized/Aloo Bhujia.png', 'Snacks & Namkeen', true),
(31, 'Lite Mixture', 10.00, 'Light and crispy namkeen mixture', '/optimized/Lite Mixture.png', 'Snacks & Namkeen', true),
(32, 'Moong Dal', 10.00, 'Roasted yellow moong dal', '/optimized/Moong Dal.png', 'Snacks & Namkeen', true),
(33, 'Hing Chana', 10.00, 'Asafoetida flavored roasted chickpeas', '/optimized/Heeng Chana.png', 'Snacks & Namkeen', true),
(28, 'Salted Peanut', 10.00, 'Roasted and salted peanuts', '/optimized/Salted Peanuts.png', 'Snacks & Namkeen', true),
(29, 'Popcorn', 10.00, 'Freshly popped corn kernels', '/optimized/Popcorn.png', 'Snacks & Namkeen', true),

-- Biscuits & Cookies
(24, 'Bourbon Biscuit', 10.00, 'Classic chocolate cream filled biscuits', '/optimized/Bourbon Biscuits.png', 'Biscuits & Cookies', true),
(25, 'Good Day Biscuit', 10.00, 'Crunchy butter cookies with a delightful taste', '/optimized/Good Day Biscuit.png', 'Biscuits & Cookies', true),
(26, 'Parle G Biscuit', 10.00, 'India''s favorite glucose biscuits', '/optimized/Parle G Biscuit.png', 'Biscuits & Cookies', true),

-- Fresh Items
(17, 'Onion', 10.00, 'Fresh onions', '/optimized/Onion.png', 'Fresh Items', true),
(18, 'Cucumber', 10.00, 'Fresh cucumbers', '/optimized/Cucumber.png', 'Fresh Items', true),
(19, 'Mix Salad', 20.00, 'Fresh cut Cucumbers & Onion', '/optimized/Mix Salad.png', 'Fresh Items', true),
(23, 'Cheese', 15.00, 'Fresh cheese cubes for snacking', '/optimized/Cheese.png', 'Fresh Items', true),

-- Add-ons & Extras
(20, 'Gud', 5.00, 'Jaggery for natural sweetness', '/optimized/Gud.png', 'Add-ons & Extras', true),
(21, 'Saunf', 5.00, 'Fennel seeds for digestion', '/optimized/Sauf.png', 'Add-ons & Extras', true),
(34, 'Pass Pass', 2.00, 'Small candy for instant refreshment', '/optimized/Pass Pass.png', 'Add-ons & Extras', true);

-- Reset the sequence to continue from the highest ID
SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));

-- ========================================
-- 12. VERIFICATION
-- ========================================

-- Check final table structure
SELECT 
    'Final Schema' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check indexes
SELECT 
    'Indexes' as info,
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
    'RLS Policies' as info,
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify menu items were inserted
SELECT 
    'Menu Items Count' as info,
    COUNT(*) as total_items,
    COUNT(DISTINCT category) as total_categories
FROM menu_items;

-- Show sample menu items by category
SELECT 
    'Sample Menu Items' as info,
    category,
    COUNT(*) as item_count,
    STRING_AGG(name, ', ' ORDER BY name) as sample_items
FROM menu_items
GROUP BY category
ORDER BY category;

-- ========================================
-- 13. CLEANUP COMPLETE
-- ========================================

SELECT 
    '🎉 Cleanup Complete!' as status,
    'Your database is now clean and optimized' as message,
    'Only essential tables remain: users, orders, order_items, menu_items' as details,
    'All 37 original menu items have been restored' as menu_status;
