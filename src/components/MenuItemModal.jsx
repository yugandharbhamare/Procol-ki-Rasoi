import { useState, useEffect } from 'react'
import ImageUpload from './ImageUpload'

const MenuItemModal = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    category: 'General',
    is_available: true
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Initialize form data when item prop changes
  useEffect(() => {
    if (item) {
      console.log('MenuItemModal: Editing item with image:', item.image);
      setFormData({
        name: item.name || '',
        price: item.price?.toString() || '',
        description: item.description || '',
        image: item.image || '',
        category: item.category || 'General',
        is_available: item.is_available !== false
      })
    } else {
      console.log('MenuItemModal: Creating new item');
      setFormData({
        name: '',
        price: '',
        description: '',
        image: '',
        category: 'General',
        is_available: true
      })
    }
    setErrors({})
  }, [item])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required'
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required'
    } else {
      const price = parseFloat(formData.price)
      if (isNaN(price) || price < 0) {
        newErrors.price = 'Please enter a valid price'
      }
    }

    // Image validation is now handled by the ImageUpload component
    // No need to validate image URL here since it's either a valid URL or base64 data

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('MenuItemModal: Form submitted with data:', formData)
    
    if (!validateForm()) {
      console.log('MenuItemModal: Form validation failed:', errors)
      return
    }

    console.log('MenuItemModal: Form validation passed, calling onSave')
    setSaving(true)
    try {
      await onSave(formData)
      console.log('MenuItemModal: onSave completed successfully')
    } catch (error) {
      console.error('MenuItemModal: Error saving menu item:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const categories = [
    'General',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snacks',
    'Beverages',
    'Desserts',
    'Salads',
    'Soups',
    'Main Course',
    'Appetizers'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {item ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Item Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter item name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter item description (optional)"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Image
              </label>
              <ImageUpload
                value={formData.image}
                onChange={(imageUrl) => {
                  setFormData(prev => ({ ...prev, image: imageUrl }));
                }}
                onError={(error) => {
                  setErrors(prev => ({ ...prev, image: error }));
                }}
                disabled={saving}
                className="w-full"
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>

            {/* Availability */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_available"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700">
                Available for ordering
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MenuItemModal
