import MenuItem from './MenuItem'
import { useMemo } from 'react'

const menuItems = [
  {
    id: 1,
    name: "Ginger Chai",
    price: 10,
    description: "Hot ginger tea with aromatic spices",
    image: "/optimized/Ginger Tea.png"
  },
  {
    id: 2,
    name: "Masala Chai",
    price: 10,
    description: "Traditional Indian spiced tea",
    image: "/optimized/Ginger Tea.png"
  },
  {
    id: 3,
    name: "Masala Oats",
    price: 20,
    description: "Healthy oats with Indian spices",
    image: "/optimized/Masala Oats.png"
  },
  {
    id: 4,
    name: "Plain Maggi",
    price: 20,
    description: "Classic instant noodles",
    image: "/optimized/Plain Maggi.png"
  },
  {
    id: 5,
    name: "Veg Butter Maggi",
    price: 30,
    description: "Maggi with vegetables and butter",
    image: "/optimized/Veg butter maggi.png"
  },
  {
    id: 6,
    name: "Cheese Maggi",
    price: 30,
    description: "Maggi topped with melted cheese",
    image: "/optimized/Cheese Maggi.png"
  },
  {
    id: 7,
    name: "Butter Atta Maggi",
    price: 30,
    description: "Whole wheat Maggi with butter",
    image: "/optimized/Butter Atta Maggi.png"
  },
  {
    id: 8,
    name: "Veg Cheese Maggi",
    price: 40,
    description: "Maggi with vegetables and cheese",
    image: "/optimized/Veg cheese maggi.png"
  },
  {
    id: 9,
    name: "Cheese Atta Maggi",
    price: 45,
    description: "Whole wheat Maggi with cheese",
    image: "/optimized/Cheese Atta Maggi.png"
  },
  {
    id: 10,
    name: "MTR Poha",
    price: 30,
    description: "Flattened rice breakfast dish",
    image: "/optimized/MTR Poha.png"
  },
  {
    id: 11,
    name: "MTR Upma",
    price: 30,
    description: "Semolina breakfast porridge",
    image: "/optimized/MTR Upma.png"
  },
  {
    id: 12,
    name: "Veg Cheese Sandwich",
    price: 40,
    description: "Vegetable and cheese sandwich",
    image: "/optimized/Veg Cheese Sandwich.png"
  },
  {
    id: 13,
    name: "Aloo Sandwich",
    price: 30,
    description: "Potato sandwich with spices",
    image: "/optimized/Aloo sandwich.png"
  },
  {
    id: 14,
    name: "Aloo Cheese Sandwich",
    price: 45,
    description: "Potato and cheese sandwich",
    image: "/optimized/Aloo cheese sandwich.png"
  },
  {
    id: 15,
    name: "Besan Chila",
    price: 30,
    description: "Gram flour savory pancake",
    image: "/optimized/Besan Chila.png"
  },
  {
    id: 16,
    name: "Bhel Puri",
    price: 30,
    description: "Tangy street food snack",
    image: "/optimized/Bhel Puri.png"
  },

  {
    id: 17,
    name: "Onion",
    price: 10,
    description: "Fresh onions",
    image: "/optimized/Onion.png"
  },
  {
    id: 18,
    name: "Cucumber",
    price: 10,
    description: "Fresh cucumbers",
    image: "/optimized/Cucumber.png"
  },
  {
    id: 19,
    name: "Mix Salad",
    price: 20,
    description: "Fresh cut Cucumbers & Onion",
    image: "/optimized/Mix Salad.png"
  },
  {
    id: 20,
    name: "Gud",
    price: 5,
    description: "Jaggery for natural sweetness",
    image: "/optimized/Gud.png"
  },
  {
    id: 21,
    name: "Saunf",
    price: 5,
    description: "Fennel seeds for digestion",
    image: "/optimized/Sauf.png"
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

  return (
    <div className="space-y-6">
      
      <div className="grid gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <MenuItem
              key={item.id}
              item={item}
              addToCart={addToCart}
              cartItem={cart[item.id]}
              updateQuantity={updateQuantity}
            />
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
    </div>
  )
}

export default Menu 