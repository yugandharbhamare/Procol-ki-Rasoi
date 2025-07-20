import MenuItem from './MenuItem'
import { useMemo } from 'react'

const menuItems = [
  // Hot Beverages
  {
    id: 1,
    name: "Ginger Chai",
    price: 10,
    description: "Hot ginger tea with aromatic spices",
    image: "/optimized/Ginger Tea.png",
    category: "Hot Beverages"
  },
  {
    id: 2,
    name: "Masala Chai",
    price: 10,
    description: "Traditional Indian spiced tea",
    image: "/optimized/Ginger Tea.png",
    category: "Hot Beverages"
  },
  
  // Cold Beverages
  {
    id: 35,
    name: "Amul Chaas",
    price: 15,
    description: "Refreshing buttermilk drink",
    image: "/optimized/Amul Chaas.png",
    category: "Cold Beverages"
  },
  {
    id: 36,
    name: "Amul Lassi",
    price: 20,
    description: "Sweet and creamy yogurt drink",
    image: "/optimized/Amul Lassi.png",
    category: "Cold Beverages"
  },
  {
    id: 37,
    name: "Coca Cola",
    price: 40,
    description: "Classic carbonated soft drink",
    image: "/optimized/Coca Cola.png",
    category: "Cold Beverages"
  },

  // Breakfast Items
  {
    id: 3,
    name: "Masala Oats",
    price: 20,
    description: "Healthy oats with Indian spices",
    image: "/optimized/Masala Oats.png",
    category: "Breakfast Items"
  },
  {
    id: 10,
    name: "MTR Poha",
    price: 30,
    description: "Flattened rice breakfast dish",
    image: "/optimized/MTR Poha.png",
    category: "Breakfast Items"
  },
  {
    id: 11,
    name: "MTR Upma",
    price: 30,
    description: "Semolina breakfast porridge",
    image: "/optimized/MTR Upma.png",
    category: "Breakfast Items"
  },
  {
    id: 15,
    name: "Besan Chila",
    price: 30,
    description: "Gram flour savory pancake",
    image: "/optimized/Besan Chila.png",
    category: "Breakfast Items"
  },

  // Maggi Varieties
  {
    id: 4,
    name: "Plain Maggi",
    price: 20,
    description: "Classic instant noodles",
    image: "/optimized/Plain Maggi.png",
    category: "Maggi Varieties"
  },
  {
    id: 5,
    name: "Veg Butter Maggi",
    price: 30,
    description: "Maggi with vegetables and butter",
    image: "/optimized/Veg butter maggi.png",
    category: "Maggi Varieties"
  },
  {
    id: 6,
    name: "Cheese Maggi",
    price: 30,
    description: "Maggi topped with melted cheese",
    image: "/optimized/Cheese Maggi.png",
    category: "Maggi Varieties"
  },
  {
    id: 7,
    name: "Butter Atta Maggi",
    price: 30,
    description: "Whole wheat Maggi with butter",
    image: "/optimized/Butter Atta Maggi.png",
    category: "Maggi Varieties"
  },
  {
    id: 8,
    name: "Veg Cheese Maggi",
    price: 40,
    description: "Maggi with vegetables and cheese",
    image: "/optimized/Veg cheese maggi.png",
    category: "Maggi Varieties"
  },
  {
    id: 9,
    name: "Cheese Atta Maggi",
    price: 45,
    description: "Whole wheat Maggi with cheese",
    image: "/optimized/Cheese Atta Maggi.png",
    category: "Maggi Varieties"
  },

  // Sandwiches
  {
    id: 12,
    name: "Veg Cheese Sandwich",
    price: 40,
    description: "Vegetable and cheese sandwich",
    image: "/optimized/Veg Cheese Sandwich.png",
    category: "Sandwiches"
  },
  {
    id: 13,
    name: "Aloo Sandwich",
    price: 30,
    description: "Potato sandwich with spices",
    image: "/optimized/Aloo sandwich.png",
    category: "Sandwiches"
  },
  {
    id: 14,
    name: "Aloo Cheese Sandwich",
    price: 45,
    description: "Potato and cheese sandwich",
    image: "/optimized/Aloo cheese sandwich.png",
    category: "Sandwiches"
  },

  // Main Course
  {
    id: 22,
    name: "Pasta",
    price: 40,
    description: "Delicious Italian pasta with rich tomato sauce",
    image: "/optimized/Pasta.png",
    category: "Main Course"
  },

  // Street Food
  {
    id: 16,
    name: "Bhel Puri",
    price: 30,
    description: "Tangy street food snack",
    image: "/optimized/Bhel Puri.png",
    category: "Street Food"
  },
  {
    id: 30,
    name: "Fatafat Bhel",
    price: 10,
    description: "Quick and tangy bhel mixture",
    image: "/optimized/Fatafat Bhel.png",
    category: "Street Food"
  },

  // Snacks & Namkeen
  {
    id: 27,
    name: "Aloo Bhujiya",
    price: 10,
    description: "Crispy potato sev for snacking",
    image: "/optimized/Aloo Bhujia.png",
    category: "Snacks & Namkeen"
  },
  {
    id: 31,
    name: "Lite Mixture",
    price: 10,
    description: "Light and crispy namkeen mixture",
    image: "/optimized/Lite Mixture.png",
    category: "Snacks & Namkeen"
  },
  {
    id: 32,
    name: "Moong Dal",
    price: 10,
    description: "Roasted yellow moong dal",
    image: "/optimized/Moong Dal.png",
    category: "Snacks & Namkeen"
  },
  {
    id: 33,
    name: "Hing Chana",
    price: 10,
    description: "Asafoetida flavored roasted chickpeas",
    image: "/optimized/Heeng Chana.png",
    category: "Snacks & Namkeen"
  },
  {
    id: 28,
    name: "Salted Peanut",
    price: 10,
    description: "Roasted and salted peanuts",
    image: "/optimized/Salted Peanuts.png",
    category: "Snacks & Namkeen"
  },
  {
    id: 29,
    name: "Popcorn",
    price: 10,
    description: "Freshly popped corn kernels",
    image: "/optimized/Popcorn.png",
    category: "Snacks & Namkeen"
  },

  // Biscuits & Cookies
  {
    id: 24,
    name: "Bourbon Biscuit",
    price: 10,
    description: "Classic chocolate cream filled biscuits",
    image: "/optimized/Bourbon Biscuits.png",
    category: "Biscuits & Cookies"
  },
  {
    id: 25,
    name: "Good Day Biscuit",
    price: 10,
    description: "Crunchy butter cookies with a delightful taste",
    image: "/optimized/Good Day Biscuit.png",
    category: "Biscuits & Cookies"
  },
  {
    id: 26,
    name: "Parle G Biscuit",
    price: 10,
    description: "India's favorite glucose biscuits",
    image: "/optimized/Parle G Biscuit.png",
    category: "Biscuits & Cookies"
  },

  // Fresh Items
  {
    id: 17,
    name: "Onion",
    price: 10,
    description: "Fresh onions",
    image: "/optimized/Onion.png",
    category: "Fresh Items"
  },
  {
    id: 18,
    name: "Cucumber",
    price: 10,
    description: "Fresh cucumbers",
    image: "/optimized/Cucumber.png",
    category: "Fresh Items"
  },
  {
    id: 19,
    name: "Mix Salad",
    price: 20,
    description: "Fresh cut Cucumbers & Onion",
    image: "/optimized/Mix Salad.png",
    category: "Fresh Items"
  },
  {
    id: 23,
    name: "Cheese",
    price: 15,
    description: "Fresh cheese cubes for snacking",
    image: "/optimized/Cheese.png",
    category: "Fresh Items"
  },

  // Add-ons & Extras
  {
    id: 20,
    name: "Gud",
    price: 5,
    description: "Jaggery for natural sweetness",
    image: "/optimized/Gud.png",
    category: "Add-ons & Extras"
  },
  {
    id: 21,
    name: "Saunf",
    price: 5,
    description: "Fennel seeds for digestion",
    image: "/optimized/Sauf.png",
    category: "Add-ons & Extras"
  },
  {
    id: 34,
    name: "Pass Pass",
    price: 2,
    description: "Small candy for instant refreshment",
    image: "/optimized/Pass Pass.png",
    category: "Add-ons & Extras"
  }
]

const Menu = ({ addToCart, cart, updateQuantity, searchQuery }) => {

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return menuItems
    }
    
    const query = searchQuery.toLowerCase().trim()
    return menuItems
      .filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        // Prioritize exact name matches
        const aNameMatch = a.name.toLowerCase().startsWith(query)
        const bNameMatch = b.name.toLowerCase().startsWith(query)
        
        if (aNameMatch && !bNameMatch) return -1
        if (!aNameMatch && bNameMatch) return 1
        
        // Then prioritize name matches over description matches
        const aNameContains = a.name.toLowerCase().includes(query)
        const bNameContains = b.name.toLowerCase().includes(query)
        
        if (aNameContains && !bNameContains) return -1
        if (!aNameContains && bNameContains) return 1
        
        return 0
      })
  }, [searchQuery])

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {}
    
    filteredItems.forEach(item => {
      const category = item.category || 'Other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
    })
    
    return groups
  }, [filteredItems])

  // Category order for consistent display
  const categoryOrder = [
    'Hot Beverages',
    'Cold Beverages', 
    'Breakfast Items',
    'Maggi Varieties',
    'Sandwiches',
    'Main Course',
    'Street Food',
    'Snacks & Namkeen',
    'Biscuits & Cookies',
    'Fresh Items',
    'Add-ons & Extras'
  ]

  return (
    <div className="space-y-8">
      {Object.keys(groupedItems).length > 0 ? (
        categoryOrder
          .filter(category => groupedItems[category])
          .map(category => (
            <div key={category} className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {groupedItems[category].length} item{groupedItems[category].length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="grid gap-4">
                {groupedItems[category].map(item => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    addToCart={addToCart}
                    cartItem={cart[item.id]}
                    updateQuantity={updateQuantity}
                  />
                ))}
              </div>
            </div>
          ))
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600">Try searching with different keywords</p>
        </div>
      )}
    </div>
  )
}

export default Menu 