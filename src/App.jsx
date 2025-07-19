import { useState } from 'react'
import Menu from './components/Menu'
import CartSummary from './components/CartSummary'
import Header from './components/Header'
import PaymentScreen from './components/PaymentScreen'

function App() {
  const [cart, setCart] = useState({})
  const [showPayment, setShowPayment] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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
    const order = {
      id: `ORD${Date.now()}`,
      items: cart,
      total: getTotalPrice(),
      timestamp: new Date().toISOString()
    }
    setCurrentOrder(order)
    setShowPayment(true)
  }

  const handlePaymentComplete = () => {
    setShowPayment(false)
    setCurrentOrder(null)
    setCart({})
    alert('Order completed successfully! Thank you for your purchase.')
  }

  const handlePaymentBack = () => {
    setShowPayment(false)
    setCurrentOrder(null)
  }

  if (showPayment && currentOrder) {
    return (
      <PaymentScreen
        order={currentOrder}
        onPaymentComplete={handlePaymentComplete}
        onBack={handlePaymentBack}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="container mx-auto px-4 py-6 max-w-md">
        <Menu 
          addToCart={addToCart} 
          cart={cart}
          updateQuantity={updateQuantity}
          searchQuery={searchQuery}
        />
      </div>
      {/* Extra padding to prevent footer overlap */}
      <div className="pb-32"></div>
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