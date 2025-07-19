import MenuItem from './MenuItem'

const menuItems = [
  {
    id: 1,
    name: "Ginger Chai",
    price: 10,
    description: "Hot ginger tea with aromatic spices",
    category: "Beverages",
    image: "☕"
  },
  {
    id: 2,
    name: "Masala Chai",
    price: 10,
    description: "Traditional Indian spiced tea",
    category: "Beverages",
    image: "🫖"
  },
  {
    id: 3,
    name: "Masala Oats",
    price: 20,
    description: "Healthy oats with Indian spices",
    category: "Breakfast",
    image: "🥣"
  },
  {
    id: 4,
    name: "Plain Maggi",
    price: 20,
    description: "Classic instant noodles",
    category: "Noodles",
    image: "🍜"
  },
  {
    id: 5,
    name: "Veg Butter Maggi",
    price: 30,
    description: "Maggi with vegetables and butter",
    category: "Noodles",
    image: "🍜"
  },
  {
    id: 6,
    name: "Cheese Maggi",
    price: 30,
    description: "Maggi topped with melted cheese",
    category: "Noodles",
    image: "🧀"
  },
  {
    id: 7,
    name: "Butter Atta Maggi",
    price: 30,
    description: "Whole wheat Maggi with butter",
    category: "Noodles",
    image: "🍜"
  },
  {
    id: 8,
    name: "Veg Cheese Maggi",
    price: 40,
    description: "Maggi with vegetables and cheese",
    category: "Noodles",
    image: "🧀"
  },
  {
    id: 9,
    name: "Cheese Atta Maggi",
    price: 45,
    description: "Whole wheat Maggi with cheese",
    category: "Noodles",
    image: "🧀"
  },
  {
    id: 10,
    name: "MTR Poha",
    price: 30,
    description: "Flattened rice breakfast dish",
    category: "Breakfast",
    image: "🍚"
  },
  {
    id: 11,
    name: "MTR Upma",
    price: 30,
    description: "Semolina breakfast porridge",
    category: "Breakfast",
    image: "🥣"
  },
  {
    id: 12,
    name: "Veg Cheese Sandwich",
    price: 40,
    description: "Vegetable and cheese sandwich",
    category: "Sandwiches",
    image: "🥪"
  },
  {
    id: 13,
    name: "Aloo Sandwich",
    price: 30,
    description: "Potato sandwich with spices",
    category: "Sandwiches",
    image: "🥪"
  },
  {
    id: 14,
    name: "Aloo Cheese Sandwich",
    price: 45,
    description: "Potato and cheese sandwich",
    category: "Sandwiches",
    image: "🥪"
  },
  {
    id: 15,
    name: "Besan Chila",
    price: 30,
    description: "Gram flour savory pancake",
    category: "Snacks",
    image: "🥞"
  },
  {
    id: 16,
    name: "Bhel Puri",
    price: 30,
    description: "Tangy street food snack",
    category: "Snacks",
    image: "🥗"
  },
  {
    id: 17,
    name: "Biscuits",
    price: "MRP",
    description: "Assorted biscuits and cookies",
    category: "Packaged",
    image: "🍪"
  },
  {
    id: 18,
    name: "Namkeen",
    price: "MRP",
    description: "Traditional Indian snacks",
    category: "Packaged",
    image: "🥨"
  },
  {
    id: 19,
    name: "Protein Bars",
    price: "MRP",
    description: "Healthy protein bars",
    category: "Packaged",
    image: "🍫"
  },
  {
    id: 20,
    name: "Onion",
    price: 10,
    description: "Fresh onions",
    category: "Fresh",
    image: "🧅"
  },
  {
    id: 21,
    name: "Cucumber",
    price: 10,
    description: "Fresh cucumbers",
    category: "Fresh",
    image: "🥒"
  },
  {
    id: 22,
    name: "Mix",
    price: 20,
    description: "Mixed fresh vegetables",
    category: "Fresh",
    image: "🥬"
  },
  {
    id: 23,
    name: "Gud",
    price: 5,
    description: "Jaggery for natural sweetness",
    category: "Fresh",
    image: "🍯"
  },
  {
    id: 24,
    name: "Saunf",
    price: 5,
    description: "Fennel seeds for digestion",
    category: "Fresh",
    image: "🌿"
  }
]

const Menu = ({ addToCart, cart, updateQuantity }) => {
  const categories = [...new Set(menuItems.map(item => item.category))]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Menu</h2>
        <p className="text-gray-600">Choose from our delicious selection</p>
      </div>
      
      {categories.map(category => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            {category}
          </h3>
          <div className="grid gap-4">
            {menuItems
              .filter(item => item.category === category)
              .map(item => (
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
      ))}
    </div>
  )
}

export default Menu 