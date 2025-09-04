const CartSummary = ({ cart, updateQuantity, totalItems, totalPrice, onPlaceOrder }) => {
  console.log('🔧 CartSummary: Rendering with props:', { cart, totalItems, totalPrice, onPlaceOrder })
  
  // Don't render anything if cart is empty
  if (totalItems === 0) {
    return null
  }
  
  const handlePlaceOrder = () => {
    console.log('🔧 CartSummary: Place order button clicked')
    console.log('🔧 CartSummary: Cart contents:', cart)
    console.log('🔧 CartSummary: Total items:', totalItems)
    console.log('🔧 CartSummary: Total price:', totalPrice)
    
    if (totalItems === 0) {
      console.warn('🔧 CartSummary: Cannot place order - cart is empty')
      return
    }
    
    if (onPlaceOrder && typeof onPlaceOrder === 'function') {
      console.log('🔧 CartSummary: Calling onPlaceOrder function')
      onPlaceOrder()
    } else {
      console.error('🔧 CartSummary: onPlaceOrder is not a function or is undefined')
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {totalPrice > 0 ? `₹${totalPrice.toFixed(2)}` : 'MRP Items'}
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handlePlaceOrder}
            className="font-semibold px-8 py-3 text-lg rounded-lg transition-colors duration-200 bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
          >
            Place Order
          </button>
        </div>
        
        {/* Cart Items Preview */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {Object.entries(cart).map(([itemId, item]) => (
              <div
                key={itemId}
                className="bg-gray-50 rounded-full px-3 py-1 text-sm text-gray-700 flex items-center space-x-2"
              >
                <span>{item.name} × {item.quantity}</span>
                <button
                  onClick={() => updateQuantity && updateQuantity(itemId, item.quantity - 1)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartSummary 