import React, { useState, useMemo } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { OrderProvider, useOrders } from './contexts/OrderContext'
import Header from './components/Header'
import Menu from './components/Menu'
import CartSummary from './components/CartSummary'
import PaymentScreen from './components/PaymentScreen'
import ReceiptScreen from './components/ReceiptScreen'
import OrderHistory from './components/OrderHistory'
import UserProfile from './components/UserProfile'
import LoginScreen from './components/LoginScreen'
import StaffApp from './StaffApp'
import SupabaseDebug from './components/SupabaseDebug'

// Main Menu Page Component
function MenuPage() {
  console.log('🔧 MenuPage: Component rendering...')
  const { user } = useAuth()
  const { addCompletedOrder } = useOrders()
  const [cart, setCart] = useState({})
  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  console.log('🔧 MenuPage: User state:', user)

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
    // Generate a simpler order ID: ORD + 6-digit number
    const orderNumber = Math.floor(Math.random() * 900000) + 100000; // 6-digit number
    const order = {
      id: `ORD${orderNumber}`,
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
    // Add the completed order to the context (which will also save to Firestore)
    if (currentOrder) {
      // Add payment details to the order
      const completedOrder = {
        ...currentOrder,
        paymentDetails: {
          transactionId: `TXN${Math.floor(Math.random() * 900000) + 100000}`, // 6-digit number
          paymentMethod: 'UPI',
          amount: getTotalPrice(),
          status: 'success',
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('App: Payment completed, adding order to context:', completedOrder);
      await addCompletedOrder(completedOrder);
    }
    
    setShowPayment(false)
    setShowReceipt(true)
  }

  const handlePaymentBack = () => {
    setShowPayment(false)
    setCurrentOrder(null)
  }

  const handleReceiptBack = () => {
    setShowReceipt(false)
    setCurrentOrder(null)
    setCart({})
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  // If user is not authenticated, show login screen
  if (!user) {
    return <LoginScreen />
  }

  // If showing payment screen
  if (showPayment) {
    return (
      <PaymentScreen
        order={currentOrder}
        onPaymentComplete={handlePaymentComplete}
        onBack={handlePaymentBack}
      />
    )
  }

  // If showing receipt screen
  if (showReceipt) {
    return (
      <ReceiptScreen
        order={currentOrder}
        onBack={handleReceiptBack}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        cartItemCount={getTotalItems()}
        onSearch={handleSearch}
      />
      
      {/* Temporary Supabase Debug Component */}
      <SupabaseDebug />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Menu Section */}
          <div className="lg:col-span-3">
            <Menu 
              addToCart={addToCart}
              cart={cart}
              updateQuantity={updateQuantity}
              searchQuery={searchQuery}
            />
          </div>
          
          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              cart={cart}
              updateQuantity={updateQuantity}
              totalItems={getTotalItems()}
              totalPrice={getTotalPrice()}
              onPlaceOrder={placeOrder}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  console.log('🔧 App: Component rendering...')
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <OrderProvider>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/staff/*" element={<StaffApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </OrderProvider>
    </Router>
  )
}

export default App 