/**
 * Centralized service for menu item image mappings
 * This ensures consistency across all components and makes it easy to update mappings
 */

// Complete mapping of all menu items to their image paths
export const MENU_ITEM_IMAGES = {
  // Hot Beverages
  'Ginger Chai': '/optimized/Ginger Tea.png',
  'Masala Chai': '/optimized/Ginger Tea.png',
  
  // Cold Beverages
  'Amul Chaas': '/optimized/Amul Chaas.png',
  'Amul Lassi': '/optimized/Amul Lassi.png',
  'Coca Cola': '/optimized/Coca Cola.png',
  
  // Breakfast Items
  'Masala Oats': '/optimized/Masala Oats.png',
  'MTR Poha': '/optimized/MTR Poha.png',
  'MTR Upma': '/optimized/MTR Upma.png',
  'Besan Chila': '/optimized/Besan Chila.png',
  'Uttapam': '/optimized/Besan Chila.png', // Using similar breakfast item as fallback
  
  // Maggi Varieties
  'Plain Maggi': '/optimized/Plain Maggi.png',
  'Veg Butter Maggi': '/optimized/Veg butter maggi.png',
  'Cheese Maggi': '/optimized/Cheese Maggi.png',
  'Veg Cheese Maggi': '/optimized/Veg cheese maggi.png',
  'Butter Atta Maggi': '/optimized/Butter Atta Maggi.png',
  'Cheese Atta Maggi': '/optimized/Cheese Atta Maggi.png',
  
  // Sandwiches
  'Aloo Sandwich': '/optimized/Aloo sandwich.png',
  'Veg Cheese Sandwich': '/optimized/Veg Cheese Sandwich.png',
  'Aloo Cheese Sandwich': '/optimized/Aloo cheese sandwich.png',
  
  // Main Course
  'Pasta': '/optimized/Pasta.png',
  
  // Street Food
  'Bhel Puri': '/optimized/Bhel Puri.png',
  'Fatafat Bhel': '/optimized/Fatafat Bhel.png',
  
  // Snacks & Namkeen
  'Aloo Bhujia': '/optimized/Aloo Bhujia.png',
  'Aloo Bhujiya': '/optimized/Aloo Bhujia.png', // Handle spelling variation
  'Lite Mixture': '/optimized/Lite Mixture.png',
  'Moong Dal': '/optimized/Moong Dal.png',
  'Hing Chana': '/optimized/Heeng Chana.png',
  'Heeng Chana': '/optimized/Heeng Chana.png', // Handle spelling variation
  'Salted Peanut': '/optimized/Salted Peanuts.png', // Note: singular form in DB
  'Salted Peanuts': '/optimized/Salted Peanuts.png', // Plural form
  'Popcorn': '/optimized/Popcorn.png',
  
  // Biscuits & Cookies
  'Bourbon Biscuit': '/optimized/Bourbon Biscuits.png',
  'Bourbon Biscuits': '/optimized/Bourbon Biscuits.png', // Handle spelling variation
  'Good Day Biscuit': '/optimized/Good Day Biscuit.png',
  'Parle G Biscuit': '/optimized/Parle G Biscuit.png',
  
  // Fresh Items
  'Onion': '/optimized/Onion.png',
  'Cucumber': '/optimized/Cucumber.png',
  'Mix Salad': '/optimized/Mix Salad.png',
  'Cheese': '/optimized/Cheese.png',
  
  // Add-ons & Extras
  'Gud': '/optimized/Gud.png',
  'Saunf': '/optimized/Sauf.png',
  'Sauf': '/optimized/Sauf.png', // Handle spelling variation
  'Pass Pass': '/optimized/Pass Pass.png'
}

/**
 * Get the image path for a menu item
 * @param {string} itemName - The name of the menu item
 * @returns {string|null} - The image path or null if not found
 */
export const getMenuItemImage = (itemName) => {
  if (!itemName || typeof itemName !== 'string') return null;
  
  // Normalize the item name for better matching
  const normalizedName = itemName.trim();
  
  // Try exact match first
  let imagePath = MENU_ITEM_IMAGES[normalizedName];
  
  // If not found, try case-insensitive match
  if (!imagePath) {
    const lowerName = normalizedName.toLowerCase();
    for (const [key, value] of Object.entries(MENU_ITEM_IMAGES)) {
      if (key.toLowerCase() === lowerName) {
        imagePath = value;
        break;
      }
    }
  }
  
  // Debug logging for missing mappings
  if (!imagePath) {
    console.warn('MenuItemImageService: No image found for item:', normalizedName);
  }
  
  return imagePath || null;
}

/**
 * Check if an image path is valid (starts with / or data:image)
 * @param {string} imagePath - The image path to validate
 * @returns {boolean} - True if the image path is valid
 */
export const isValidImagePath = (imagePath) => {
  return imagePath && (imagePath.startsWith('/') || imagePath.startsWith('data:image'));
}

/**
 * Get all menu item names that have image mappings
 * @returns {string[]} - Array of menu item names
 */
export const getAllMappedItemNames = () => {
  return Object.keys(MENU_ITEM_IMAGES);
}

/**
 * Add a new menu item image mapping
 * @param {string} itemName - The name of the menu item
 * @param {string} imagePath - The image path
 */
export const addMenuItemImage = (itemName, imagePath) => {
  if (itemName && imagePath) {
    MENU_ITEM_IMAGES[itemName] = imagePath;
    console.log(`Added image mapping for ${itemName}: ${imagePath}`);
  }
}

/**
 * Update an existing menu item image mapping
 * @param {string} itemName - The name of the menu item
 * @param {string} imagePath - The new image path
 */
export const updateMenuItemImage = (itemName, imagePath) => {
  if (itemName && imagePath && MENU_ITEM_IMAGES[itemName]) {
    MENU_ITEM_IMAGES[itemName] = imagePath;
    console.log(`Updated image mapping for ${itemName}: ${imagePath}`);
  }
}
