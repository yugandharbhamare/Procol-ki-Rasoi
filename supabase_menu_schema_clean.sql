-- Clean Menu Migration Script for Procol ki Rasoi
-- This script can be run multiple times safely

-- ========================================
-- 1. DROP EXISTING OBJECTS (if they exist)
-- ========================================

-- Drop triggers first
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;

-- Drop functions
DROP FUNCTION IF EXISTS update_menu_items_updated_at();

-- Drop views
DROP VIEW IF EXISTS available_menu_items;

-- Drop table (this will also drop indexes and RLS policies)
DROP TABLE IF EXISTS menu_items CASCADE;

-- ========================================
-- 2. CREATE TABLE AND INDEXES
-- ========================================

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

-- Create indexes for better performance
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_name ON menu_items(name);

-- ========================================
-- 3. CREATE TRIGGER FUNCTION AND TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_items_updated_at();

-- ========================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. CREATE RLS POLICIES
-- ========================================

-- Anyone can view available menu items
CREATE POLICY "Anyone can view available menu items" ON menu_items
    FOR SELECT USING (is_available = true);

-- Staff can view all menu items
CREATE POLICY "Staff can view all menu items" ON menu_items
    FOR SELECT USING (true);

-- Staff can insert menu items
CREATE POLICY "Staff can insert menu items" ON menu_items
    FOR INSERT WITH CHECK (true);

-- Staff can update menu items
CREATE POLICY "Staff can update menu items" ON menu_items
    FOR UPDATE USING (true);

-- Staff can delete menu items
CREATE POLICY "Staff can delete menu items" ON menu_items
    FOR DELETE USING (true);

-- ========================================
-- 6. INSERT ORIGINAL MENU ITEMS
-- ========================================

INSERT INTO menu_items (id, name, price, description, image, category) VALUES
-- Hot Beverages
(1, 'Ginger Chai', 10.00, 'Hot ginger tea with aromatic spices', '/optimized/Ginger Tea.png', 'Hot Beverages'),
(2, 'Masala Chai', 10.00, 'Traditional Indian spiced tea', '/optimized/Ginger Tea.png', 'Hot Beverages'),

-- Cold Beverages
(35, 'Amul Chaas', 15.00, 'Refreshing buttermilk drink', '/optimized/Amul Chaas.png', 'Cold Beverages'),
(36, 'Amul Lassi', 20.00, 'Sweet and creamy yogurt drink', '/optimized/Amul Lassi.png', 'Cold Beverages'),
(37, 'Coca Cola', 40.00, 'Classic carbonated soft drink', '/optimized/Coca Cola.png', 'Cold Beverages'),

-- Breakfast Items
(3, 'Masala Oats', 20.00, 'Healthy oats with Indian spices', '/optimized/Masala Oats.png', 'Breakfast Items'),
(10, 'MTR Poha', 30.00, 'Flattened rice breakfast dish', '/optimized/MTR Poha.png', 'Breakfast Items'),
(11, 'MTR Upma', 30.00, 'Semolina breakfast porridge', '/optimized/MTR Upma.png', 'Breakfast Items'),
(15, 'Besan Chila', 30.00, 'Gram flour savory pancake', '/optimized/Besan Chila.png', 'Breakfast Items'),

-- Maggi Varieties
(4, 'Plain Maggi', 20.00, 'Classic instant noodles', '/optimized/Plain Maggi.png', 'Maggi Varieties'),
(5, 'Veg Butter Maggi', 30.00, 'Maggi with vegetables and butter', '/optimized/Veg butter maggi.png', 'Maggi Varieties'),
(6, 'Cheese Maggi', 30.00, 'Maggi topped with melted cheese', '/optimized/Cheese Maggi.png', 'Maggi Varieties'),
(7, 'Butter Atta Maggi', 30.00, 'Whole wheat Maggi with butter', '/optimized/Butter Atta Maggi.png', 'Maggi Varieties'),
(8, 'Veg Cheese Maggi', 40.00, 'Maggi with vegetables and cheese', '/optimized/Veg cheese maggi.png', 'Maggi Varieties'),
(9, 'Cheese Atta Maggi', 45.00, 'Whole wheat Maggi with cheese', '/optimized/Cheese Atta Maggi.png', 'Maggi Varieties'),

-- Sandwiches
(12, 'Veg Cheese Sandwich', 40.00, 'Vegetable and cheese sandwich', '/optimized/Veg Cheese Sandwich.png', 'Sandwiches'),
(13, 'Aloo Sandwich', 30.00, 'Potato sandwich with spices', '/optimized/Aloo sandwich.png', 'Sandwiches'),
(14, 'Aloo Cheese Sandwich', 45.00, 'Potato and cheese sandwich', '/optimized/Aloo cheese sandwich.png', 'Sandwiches'),

-- Main Course (ORIGINAL - only Pasta)
(22, 'Pasta', 40.00, 'Delicious Italian pasta with rich tomato sauce', '/optimized/Pasta.png', 'Main Course'),

-- Snacks & Namkeen
(16, 'Bhel Puri', 30.00, 'Tangy street food snack', '/optimized/Bhel Puri.png', 'Snacks & Namkeen'),
(30, 'Fatafat Bhel', 10.00, 'Quick and tangy bhel mixture', '/optimized/Fatafat Bhel.png', 'Snacks & Namkeen'),
(27, 'Aloo Bhujiya', 10.00, 'Crispy potato sev for snacking', '/optimized/Aloo Bhujia.png', 'Snacks & Namkeen'),
(31, 'Lite Mixture', 10.00, 'Light and crispy namkeen mixture', '/optimized/Lite Mixture.png', 'Snacks & Namkeen'),
(32, 'Moong Dal', 10.00, 'Roasted yellow moong dal', '/optimized/Moong Dal.png', 'Snacks & Namkeen'),
(33, 'Hing Chana', 10.00, 'Asafoetida flavored roasted chickpeas', '/optimized/Heeng Chana.png', 'Snacks & Namkeen'),
(28, 'Salted Peanut', 10.00, 'Roasted and salted peanuts', '/optimized/Salted Peanuts.png', 'Snacks & Namkeen'),
(29, 'Popcorn', 10.00, 'Freshly popped corn kernels', '/optimized/Popcorn.png', 'Snacks & Namkeen'),

-- Biscuits & Cookies
(24, 'Bourbon Biscuit', 10.00, 'Classic chocolate cream filled biscuits', '/optimized/Bourbon Biscuits.png', 'Biscuits & Cookies'),
(25, 'Good Day Biscuit', 10.00, 'Crunchy butter cookies with a delightful taste', '/optimized/Good Day Biscuit.png', 'Biscuits & Cookies'),
(26, 'Parle G Biscuit', 10.00, 'India''s favorite glucose biscuits', '/optimized/Parle G Biscuit.png', 'Biscuits & Cookies'),

-- Fresh Items
(17, 'Onion', 10.00, 'Fresh onions', '/optimized/Onion.png', 'Fresh Items'),
(18, 'Cucumber', 10.00, 'Fresh cucumbers', '/optimized/Cucumber.png', 'Fresh Items'),
(19, 'Mix Salad', 20.00, 'Fresh cut Cucumbers & Onion', '/optimized/Mix Salad.png', 'Fresh Items'),
(23, 'Cheese', 15.00, 'Fresh cheese cubes for snacking', '/optimized/Cheese.png', 'Fresh Items'),

-- Add-ons & Extras
(20, 'Gud', 5.00, 'Jaggery for natural sweetness', '/optimized/Gud.png', 'Add-ons & Extras'),
(21, 'Saunf', 5.00, 'Fennel seeds for digestion', '/optimized/Sauf.png', 'Add-ons & Extras'),
(34, 'Pass Pass', 2.00, 'Small candy for instant refreshment', '/optimized/Pass Pass.png', 'Add-ons & Extras');

-- ========================================
-- 7. FINAL SETUP
-- ========================================

-- Reset the sequence to continue from the highest ID
SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));

-- Create a view for available menu items
CREATE OR REPLACE VIEW available_menu_items AS
SELECT * FROM menu_items WHERE is_available = true;

-- Grant permissions
GRANT ALL ON menu_items TO authenticated;
GRANT SELECT ON available_menu_items TO anon;
GRANT SELECT ON available_menu_items TO authenticated;

-- ========================================
-- 8. VERIFICATION
-- ========================================

-- Verify the table was created successfully
SELECT 
    'Menu migration completed successfully!' as status,
    COUNT(*) as total_items,
    COUNT(DISTINCT category) as total_categories
FROM menu_items;
