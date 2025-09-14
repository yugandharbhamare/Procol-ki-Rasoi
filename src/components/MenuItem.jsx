import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'

const MenuItem = ({ item, addToCart, cartItem, updateQuantity }) => {
  const isInCart = cartItem && cartItem.quantity > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transform transition-all duration-200 hover:scale-[1.01] hover:shadow-lg">
      <div className="flex items-start space-x-5">
        {/* Enhanced Image Container */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-gray-200">
            {item.image.startsWith('/') ? (
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center text-3xl ${item.image.startsWith('/') ? 'hidden' : ''}`}>
              {item.image}
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">
                {typeof item.price === 'number' ? `₹${item.price}` : item.price}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-5">
            {!isInCart ? (
              <button
                onClick={() => addToCart(item.id, item.name, item.price, item.image)}
                className="w-full border-2 border-orange-500 text-orange-600 font-semibold h-12 rounded-xl"
              >
                Add to Cart
              </button>
            ) : (
              <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl h-12 px-3 border border-orange-200">
                <button
                  onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-orange-600 border border-orange-200 shadow-sm"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                
                <span className="text-lg font-bold text-gray-900 px-4">
                  {cartItem.quantity}
                </span>
                
                <button
                  onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-orange-600 border border-orange-200 shadow-sm"
                  disabled={cartItem.quantity >= 10}
                >
                  <PlusIcon className="w-4 h-4" />
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