import { supabase } from '../supabase/config';

export const menuService = {
  // Get all menu items
  async getAllMenuItems() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching all menu items:', error);
      return { success: false, error: error.message };
    }
  },

  // Get available menu items only
  async getAvailableMenuItems() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching available menu items:', error);
      return { success: false, error: error.message };
    }
  },

  // Get menu items by category
  async getMenuItemsByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category', category)
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      return { success: false, error: error.message };
    }
  },

  // Get menu item by ID
  async getMenuItemById(id) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching menu item by ID:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('category')
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (error) throw error;
      
      // Remove duplicates and return unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      return { success: true, data: uniqueCategories };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { success: false, error: error.message };
    }
  },

  // Search menu items
  async searchMenuItems(query) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error searching menu items:', error);
      return { success: false, error: error.message };
    }
  },

  // Create new menu item (staff only)
  async createMenuItem(menuItem) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([menuItem])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating menu item:', error);
      return { success: false, error: error.message };
    }
  },

  // Update menu item (staff only)
  async updateMenuItem(id, updates) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating menu item:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete menu item (staff only)
  async deleteMenuItem(id) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return { success: false, error: error.message };
    }
  },

  // Toggle menu item availability (staff only)
  async toggleMenuItemAvailability(id) {
    try {
      // First get the current availability
      const { data: currentItem, error: fetchError } = await supabase
        .from('menu_items')
        .select('is_available')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle the availability
      const newAvailability = !currentItem.is_available;
      
      const { data, error } = await supabase
        .from('menu_items')
        .update({ is_available: newAvailability })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error toggling menu item availability:', error);
      return { success: false, error: error.message };
    }
  }
};

export default menuService;
