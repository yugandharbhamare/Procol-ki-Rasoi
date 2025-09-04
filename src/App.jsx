import React, { useState, useMemo } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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

// Main Menu Page Component - Now properly wrapped with OrderProvider
function MenuPageContent() {
  console.log('🔧 MenuPageContent: Component rendering...')
  const { user } = useAuth()
  const { addCompletedOrder, isSupabaseAvailable } = useOrders()
  const navigate = useNavigate()
  const [cart, setCart] = useState({})
  const [showPayment, setShowPayment] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  console.log('🔧 MenuPageContent: User state:', user)
  console.log('🔧 MenuPageContent: Supabase available:', isSupabaseAvailable)

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
    console.log('🔧 MenuPageContent: placeOrder called')
    console.log('🔧 MenuPageContent: Cart contents:', cart)
    console.log('🔧 MenuPageContent: User:', user)
    
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
    
    console.log('🔧 MenuPageContent: Order created:', order)
    setCurrentOrder(order)
    setShowPayment(true)
  }

  const handlePaymentComplete = async () => {
    console.log('🔧 MenuPageContent: Payment completed, processing order...')
    // Add the completed order to the context (which will also save to Supabase)
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
      
      console.log('🔧 MenuPageContent: Completed order with payment:', completedOrder);
      try {
        await addCompletedOrder(completedOrder);
        console.log('🔧 MenuPageContent: Order successfully added to context');
        
        // Store the order ID in sessionStorage to open receipt modal on order history page
        sessionStorage.setItem('showReceiptForOrder', completedOrder.id);
        
        // Clear cart and redirect to order history
        setCart({});
        setCurrentOrder(null);
        setShowPayment(false);
        
        // Navigate to order history page
        navigate('/orders');
      } catch (error) {
        console.error('🔧 MenuPageContent: Error adding order to context:', error);
      }
    }
  }

  const handlePaymentBack = () => {
    setShowPayment(false)
    setCurrentOrder(null)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        cartItemCount={getTotalItems()}
        onSearch={handleSearch}
      />
      
      {/* Supabase Connection Status */}
      {!isSupabaseAvailable && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Limited Functionality:</strong> Orders will be saved locally and to Google Sheets, but may not appear in the staff dashboard until the database connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="w-full">
          {/* Menu Section */}
          <div className="w-full">
            <Menu 
              addToCart={addToCart}
              cart={cart}
              updateQuantity={updateQuantity}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>
      
      {/* Cart Summary - Fixed Bottom */}
      <CartSummary
        cart={cart}
        updateQuantity={updateQuantity}
        totalItems={getTotalItems()}
        totalPrice={getTotalPrice()}
        onPlaceOrder={placeOrder}
      />
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

  // If user is not authenticated, show login screen
  if (!user) {
    return <LoginScreen />
  }

  return (
    <Router>
      <OrderProvider>
        <Routes>
          <Route path="/" element={<MenuPageContent />} />
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