import { memo } from 'react'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'

const MenuItem = memo(({ item, addToCart, cartItem, updateQuantity }) => {
  const isInCart = cartItem && cartItem.quantity > 0

  // Inventory stock logic
  const isInventoryItem = item.is_inventory_item && item.inventory_item_id
  const inventoryData = item.inventory // joined from supabase
  const stockQty = isInventoryItem && inventoryData ? parseFloat(inventoryData.available_quantity) : null
  const isOutOfStock = isInventoryItem && stockQty !== null && stockQty <= 0

  const stockDisplay = isInventoryItem && inventoryData
    ? `${stockQty % 1 === 0 ? parseInt(stockQty) : stockQty.toFixed(1)} ${inventoryData.uom}`
    : null

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 transform transition-all duration-200 ${
      isOutOfStock
        ? 'border-gray-200 opacity-60 cursor-not-allowed'
        : 'border-gray-100 hover:scale-[1.01] hover:shadow-lg'
    }`}>
      <div className="flex items-start space-x-5">
        {/* Image */}
        <div className="flex-shrink-0 relative">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-gray-200">
            {(item.image && (item.image.startsWith('/') || item.image.startsWith('data:image'))) ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center text-3xl ${(item.image && (item.image.startsWith('/') || item.image.startsWith('data:image'))) ? 'hidden' : ''}`}>
              {item.image}
            </div>
          </div>
          {isOutOfStock && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-70 rounded-lg flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-500 text-center leading-tight px-1">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-4">
              <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
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

          {/* Stock badge */}
          {isInventoryItem && stockDisplay !== null && (
            <div className="mb-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isOutOfStock
                  ? 'bg-red-100 text-red-700'
                  : stockQty <= 5
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {isOutOfStock ? 'Out of stock' : `In stock: ${stockDisplay}`}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-3">
            {isOutOfStock ? (
              <button
                disabled
                className="w-full border-2 border-gray-300 text-gray-400 font-semibold h-12 rounded-xl cursor-not-allowed bg-gray-50"
              >
                Out of Stock
              </button>
            ) : !isInCart ? (
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
                  disabled={cartItem.quantity >= 10 || (isInventoryItem && stockQty !== null && cartItem.quantity >= stockQty)}
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
})

MenuItem.displayName = 'MenuItem'

export default MenuItem