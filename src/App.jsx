import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useOrders } from './contexts/OrderContext'
import Menu from './components/Menu'
import CartSummary from './components/CartSummary'
import Header from './components/Header'
import PaymentScreen from './components/PaymentScreen'
import ReceiptScreen from './components/ReceiptScreen'
import LoginScreen from './components/LoginScreen'
import OrderHistory from './components/OrderHistory'
import AdminPanel from './components/AdminPanel'

import { OrderProvider } from './contexts/OrderContext'

// Main Menu Page Component
function MenuPage() {
  const { user } = useAuth()
  const { addCompletedOrder } = useOrders()
  const [cart, setCart] = useState({})
  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const addToCart = (itemId, itemName, price, image) => {
    setCart(prev => {
      const currentQty = prev[itemId]?.quantity || 0;
      if (currentQty >= 10) return prev; // Restrict to max 10
      return {
        ...prev,
        [itemId]: {
          name: itemName,
          price: price,
          image: image,
          quantity: currentQty + 1
        }
      };
    });
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      const newCart = { ...cart }
      delete newCart[itemId]
      setCart(newCart)
    } else if (newQuantity <= 10) { // Restrict to max 10
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
      timestamp: new Date().toISOString(),
      user: {
        uid: user.uid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName
      }
    }
    setCurrentOrder(order)
    setShowPayment(true)
  }

  const handlePaymentComplete = async () => {
    // The order is already saved to Google Sheets and order history by the payment service
    // when payment is confirmed via webhook
    setShowPayment(false)
    setShowReceipt(true)
  }

  const handlePaymentBack = () => {
    setShowPayment(false)
    setCurrentOrder(null)
  }

  const handleNewOrder = () => {
    setShowReceipt(false)
    setCurrentOrder(null)
    setCart({})
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

  if (showReceipt && currentOrder) {
    return (
      <ReceiptScreen
        order={currentOrder}
        onNewOrder={handleNewOrder}
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
      <AdminPanel />
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login screen if user is not authenticated
  if (!user) {
    return <LoginScreen />
  }

  return (
    <OrderProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/order-history" element={<OrderHistory />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </OrderProvider>
  )
}

export default App 