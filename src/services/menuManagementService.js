import { supabase } from './supabaseService'

// Menu Management Service for Staff Portal
export const menuManagementService = {
  // Get all menu items
  async getAllMenuItems() {
    try {
      console.log('MenuManagementService: Fetching all menu items')

      const { data, error } = await supabase
        .from('menu_items')
        .select('*, menu_item_ingredients(id, inventory_item_id, quantity, inventory:inventory_item_id(id, item_code, item_name, available_quantity, uom))')
        .order('created_at', { ascending: false })

      if (error) {
        // Fallback: menu_item_ingredients table may not exist yet — fetch without join
        console.warn('MenuManagementService: Ingredients join failed, falling back:', error.message)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('menu_items')
          .select('*')
          .order('created_at', { ascending: false })

        if (fallbackError) {
          console.error('MenuManagementService: Error fetching menu items:', fallbackError)
          return { success: false, error: fallbackError.message }
        }
        return { success: true, menuItems: (fallbackData || []).map(item => ({ ...item, menu_item_ingredients: [] })) }
      }

      console.log('MenuManagementService: Successfully fetched menu items:', data?.length || 0)
      return { success: true, menuItems: data || [] }
    } catch (error) {
      console.error('MenuManagementService: Exception fetching menu items:', error)
      return { success: false, error: error.message }
    }
  },

  // Get ingredients for a menu item
  async getIngredients(menuItemId) {
    try {
      const { data, error } = await supabase
        .from('menu_item_ingredients')
        .select('id, inventory_item_id, quantity, inventory:inventory_item_id(id, item_code, item_name, available_quantity, uom)')
        .eq('menu_item_id', menuItemId)

      if (error) return { success: false, error: error.message }
      return { success: true, ingredients: data || [] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Save ingredients for a menu item (replace all existing)
  async saveIngredients(menuItemId, ingredients) {
    try {
      await supabase.from('menu_item_ingredients').delete().eq('menu_item_id', menuItemId)

      const valid = (ingredients || []).filter(
        ing => ing.inventory_item_id && parseFloat(ing.quantity) > 0
      )
      if (valid.length > 0) {
        const rows = valid.map(ing => ({
          menu_item_id: menuItemId,
          inventory_item_id: parseInt(ing.inventory_item_id),
          quantity: parseFloat(ing.quantity)
        }))
        const { error } = await supabase.from('menu_item_ingredients').insert(rows)
        if (error) return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error) {
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
          is_available: menuItem.is_available !== false,
          is_inventory_item: menuItem.is_inventory_item || false
        }])
        .select()

      if (error) {
        console.error('MenuManagementService: Error adding menu item:', error)
        return { success: false, error: error.message }
      }

      const newItem = data?.[0]
      if (newItem && menuItem.is_inventory_item && menuItem.ingredients?.length > 0) {
        await this.saveIngredients(newItem.id, menuItem.ingredients)
      }

      const fullItem = newItem ? (await this._fetchFullItem(newItem.id) || newItem) : newItem
      console.log('MenuManagementService: Successfully added menu item:', fullItem)
      return { success: true, menuItem: { ...fullItem, menu_item_ingredients: fullItem?.menu_item_ingredients || [] } }
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

      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.price !== undefined) updateData.price = parseFloat(updates.price)
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.image !== undefined) updateData.image = updates.image
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.is_available !== undefined) updateData.is_available = updates.is_available
      if (updates.is_inventory_item !== undefined) updateData.is_inventory_item = updates.is_inventory_item
      // Leave inventory_item_id column untouched — ingredients are in menu_item_ingredients table

      const { data, error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) {
        console.error('MenuManagementService: Error updating menu item:', error)
        return { success: false, error: error.message }
      }

      const updatedItem = data?.[0]
      if (updatedItem) {
        const ingredientsToSave = updates.is_inventory_item ? (updates.ingredients || []) : []
        await this.saveIngredients(id, ingredientsToSave)
      }

      const fullItem = updatedItem ? (await this._fetchFullItem(id) || updatedItem) : updatedItem
      console.log('MenuManagementService: Successfully updated menu item:', fullItem)
      return { success: true, menuItem: { ...fullItem, menu_item_ingredients: fullItem?.menu_item_ingredients || [] } }
    } catch (error) {
      console.error('MenuManagementService: Exception updating menu item:', error)
      return { success: false, error: error.message }
    }
  },

  // Fetch a single menu item with ingredients joined (internal helper)
  async _fetchFullItem(id) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, menu_item_ingredients(id, inventory_item_id, quantity, inventory:inventory_item_id(id, item_code, item_name, available_quantity, uom))')
        .eq('id', id)
        .single()
      if (error) {
        // Fallback without join
        const { data: bare } = await supabase.from('menu_items').select('*').eq('id', id).single()
        return bare ? { ...bare, menu_item_ingredients: [] } : null
      }
      return data
    } catch {
      return null
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
