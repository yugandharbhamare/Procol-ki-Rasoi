import { useState } from 'react'
import Menu from './components/Menu'
import CartSummary from './components/CartSummary'
import Header from './components/Header'

function App() {
  const [cart, setCart] = useState({})

  const addToCart = (itemId, itemName, price) => {
    setCart(prev => ({
      ...prev,
      [itemId]: {
        name: itemName,
        price: price,
        quantity: (prev[itemId]?.quantity || 0) + 1
      }
    }))
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      const newCart = { ...cart }
      delete newCart[itemId]
      setCart(newCart)
    } else {
      setCart(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: newQuantity
        }
      }))
    }
  }

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return Object.values(cart).reduce((total, item) => {
      if (typeof item.price === 'number') {
        return total + (item.price * item.quantity)
      }
      return total // MRP items don't contribute to total calculation
    }, 0)
  }

  const placeOrder = () => {
    const totalPrice = getTotalPrice()
    const hasMRPItems = Object.values(cart).some(item => typeof item.price !== 'number')
    
    let message = 'Order placed successfully!'
    if (totalPrice > 0) {
      message += ` Total: ₹${totalPrice.toFixed(2)}`
    }
    if (hasMRPItems) {
      message += ' (MRP items will be charged as marked)'
    }
    
    alert(message)
    setCart({})
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <Menu 
          addToCart={addToCart} 
          cart={cart}
          updateQuantity={updateQuantity}
        />
      </div>
      {getTotalItems() > 0 && (
        <CartSummary 
          cart={cart}
          totalItems={getTotalItems()}
          totalPrice={getTotalPrice()}
          placeOrder={placeOrder}
        />
      )}
    </div>
  )
}

export default App 