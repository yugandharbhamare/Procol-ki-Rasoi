import MenuItem from './MenuItem'

const menuItems = [
  {
    id: 1,
    name: "Ginger Chai",
    price: 10,
    description: "Hot ginger tea with aromatic spices",
    image: "☕"
  },
  {
    id: 2,
    name: "Masala Chai",
    price: 10,
    description: "Traditional Indian spiced tea",
    image: "🫖"
  },
  {
    id: 3,
    name: "Masala Oats",
    price: 20,
    description: "Healthy oats with Indian spices",
    image: "🥣"
  },
  {
    id: 4,
    name: "Plain Maggi",
    price: 20,
    description: "Classic instant noodles",
    image: "🍜"
  },
  {
    id: 5,
    name: "Veg Butter Maggi",
    price: 30,
    description: "Maggi with vegetables and butter",
    image: "🍜"
  },
  {
    id: 6,
    name: "Cheese Maggi",
    price: 30,
    description: "Maggi topped with melted cheese",
    image: "🧀"
  },
  {
    id: 7,
    name: "Butter Atta Maggi",
    price: 30,
    description: "Whole wheat Maggi with butter",
    image: "🍜"
  },
  {
    id: 8,
    name: "Veg Cheese Maggi",
    price: 40,
    description: "Maggi with vegetables and cheese",
    image: "🧀"
  },
  {
    id: 9,
    name: "Cheese Atta Maggi",
    price: 45,
    description: "Whole wheat Maggi with cheese",
    image: "🧀"
  },
  {
    id: 10,
    name: "MTR Poha",
    price: 30,
    description: "Flattened rice breakfast dish",
    image: "🍚"
  },
  {
    id: 11,
    name: "MTR Upma",
    price: 30,
    description: "Semolina breakfast porridge",
    image: "🥣"
  },
  {
    id: 12,
    name: "Veg Cheese Sandwich",
    price: 40,
    description: "Vegetable and cheese sandwich",
    image: "🥪"
  },
  {
    id: 13,
    name: "Aloo Sandwich",
    price: 30,
    description: "Potato sandwich with spices",
    image: "🥪"
  },
  {
    id: 14,
    name: "Aloo Cheese Sandwich",
    price: 45,
    description: "Potato and cheese sandwich",
    image: "🥪"
  },
  {
    id: 15,
    name: "Besan Chila",
    price: 30,
    description: "Gram flour savory pancake",
    image: "🥞"
  },
  {
    id: 16,
    name: "Bhel Puri",
    price: 30,
    description: "Tangy street food snack",
    image: "🥗"
  },
  {
    id: 17,
    name: "Biscuits",
    price: "MRP",
    description: "Assorted biscuits and cookies",
    image: "🍪"
  },
  {
    id: 18,
    name: "Namkeen",
    price: "MRP",
    description: "Traditional Indian snacks",
    image: "🥨"
  },
  {
    id: 19,
    name: "Protein Bars",
    price: "MRP",
    description: "Healthy protein bars",
    image: "🍫"
  },
  {
    id: 20,
    name: "Onion",
    price: 10,
    description: "Fresh onions",
    image: "🧅"
  },
  {
    id: 21,
    name: "Cucumber",
    price: 10,
    description: "Fresh cucumbers",
    image: "🥒"
  },
  {
    id: 22,
    name: "Mix",
    price: 20,
    description: "Mixed fresh vegetables",
    image: "🥬"
  },
  {
    id: 23,
    name: "Gud",
    price: 5,
    description: "Jaggery for natural sweetness",
    image: "🍯"
  },
  {
    id: 24,
    name: "Saunf",
    price: 5,
    description: "Fennel seeds for digestion",
    image: "🌿"
  }
]

const Menu = ({ addToCart, cart, updateQuantity }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Menu</h2>
        <p className="text-gray-600">Choose from our delicious selection</p>
      </div>
      
      <div className="grid gap-4">
        {menuItems.map(item => (
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
  )
}

export default Menu 