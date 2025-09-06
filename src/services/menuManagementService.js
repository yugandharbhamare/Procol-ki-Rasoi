import { supabase } from '../firebase/config'

// Menu Management Service for Staff Portal
export const menuManagementService = {
  // Get all menu items
  async getAllMenuItems() {
    try {
      console.log('MenuManagementService: Fetching all menu items')
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('MenuManagementService: Error fetching menu items:', error)
        return { success: false, error: error.message }
      }

      console.log('MenuManagementService: Successfully fetched menu items:', data?.length || 0)
      return { success: true, menuItems: data || [] }
    } catch (error) {
      console.error('MenuManagementService: Exception fetching menu items:', error)
      return { success: false, error: error.message }
    }
  },

  // Add new menu item
  async addMenuItem(menuItem) {
    try {
      console.log('MenuManagementService: Adding new menu item:', menuItem)
      
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          name: menuItem.name,
          price: parseFloat(menuItem.price),
          description: menuItem.description || '',
          image: menuItem.image || '',
          category: menuItem.category || 'General',
          is_available: menuItem.is_available !== false
        }])
        .select()

      if (error) {
        console.error('MenuManagementService: Error adding menu item:', error)
        return { success: false, error: error.message }
      }

      console.log('MenuManagementService: Successfully added menu item:', data?.[0])
      return { success: true, menuItem: data?.[0] }
    } catch (error) {
      console.error('MenuManagementService: Exception adding menu item:', error)
      return { success: false, error: error.message }
    }
  },

  // Update menu item
  async updateMenuItem(id, updates) {
    try {
      console.log('MenuManagementService: Updating menu item:', id, updates)
      
      const updateData = {
        updated_at: new Date().toISOString()
      }

      // Only include fields that are provided
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.price !== undefined) updateData.price = parseFloat(updates.price)
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.image !== undefined) updateData.image = updates.image
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.is_available !== undefined) updateData.is_available = updates.is_available

      const { data, error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) {
        console.error('MenuManagementService: Error updating menu item:', error)
        return { success: false, error: error.message }
      }

      console.log('MenuManagementService: Successfully updated menu item:', data?.[0])
      return { success: true, menuItem: data?.[0] }
    } catch (error) {
      console.error('MenuManagementService: Exception updating menu item:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete menu item
  async deleteMenuItem(id) {
    try {
      console.log('MenuManagementService: Deleting menu item:', id)
      
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('MenuManagementService: Error deleting menu item:', error)
        return { success: false, error: error.message }
      }

      console.log('MenuManagementService: Successfully deleted menu item:', id)
      return { success: true }
    } catch (error) {
      console.error('MenuManagementService: Exception deleting menu item:', error)
      return { success: false, error: error.message }
    }
  },

  // Get menu item by ID
  async getMenuItemById(id) {
    try {
      console.log('MenuManagementService: Fetching menu item by ID:', id)
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('MenuManagementService: Error fetching menu item:', error)
        return { success: false, error: error.message }
      }

      console.log('MenuManagementService: Successfully fetched menu item:', data)
      return { success: true, menuItem: data }
    } catch (error) {
      console.error('MenuManagementService: Exception fetching menu item:', error)
      return { success: false, error: error.message }
    }
  }
}
