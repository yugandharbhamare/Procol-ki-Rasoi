const MenuItem = ({ item, addToCart, cartItem, updateQuantity }) => {
  const isInCart = cartItem && cartItem.quantity > 0

  return (
    <div className="card p-4">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
            {item.image}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {item.description}
              </p>
              <p className="text-lg font-bold text-primary-600 mt-2">
                {typeof item.price === 'number' ? `₹${item.price}` : item.price}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            {!isInCart ? (
              <button
                onClick={() => addToCart(item.id, item.name, item.price)}
                className="btn-primary w-full"
              >
                Add to Cart
              </button>
            ) : (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                <button
                  onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                
                <span className="text-lg font-semibold text-gray-900 px-4">
                  {cartItem.quantity}
                </span>
                
                <button
                  onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MenuItem 