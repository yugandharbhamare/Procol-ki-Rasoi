import { ShoppingCartIcon } from '@heroicons/react/24/outline'

const CartSummary = ({ cart, updateQuantity, totalItems, totalPrice, onPlaceOrder, orderNotes, onNotesChange }) => {
  // Don't render anything if cart is empty
  if (totalItems === 0) {
    return null
  }

  const handlePlaceOrder = () => {
    if (totalItems === 0) return

    if (onPlaceOrder && typeof onPlaceOrder === 'function') {
      onPlaceOrder()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <ShoppingCartIcon className="w-6 h-6 text-gray-600" />
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
          <div className="flex flex-wrap gap-2 mb-3">
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
          
          {/* Notes Input */}
          <div className="mb-2">
            <label htmlFor="order-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions for Chef (Optional)
            </label>
            <textarea
              id="order-notes"
              value={orderNotes || ''}
              onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
              placeholder="e.g., Extra spicy, No onions, Well done..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
              rows={2}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {orderNotes ? orderNotes.length : 0}/200 characters
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartSummary 