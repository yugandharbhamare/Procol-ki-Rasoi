import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const SearchBar = ({ searchQuery, onSearch }) => {
  console.log('SearchBar: Rendering with props:', { searchQuery, onSearch })
  
  const handleSearchChange = (value) => {
    console.log('SearchBar: Search value changed to:', value)
    if (onSearch && typeof onSearch === 'function') {
      console.log('SearchBar: Calling onSearch function with value:', value)
      onSearch(value)
    } else {
      console.warn('SearchBar: onSearch function is not available')
    }
  }

  const handleClearSearch = () => {
    console.log('SearchBar: Clearing search')
    handleSearchChange('')
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search for food items..."
          className="block w-full pl-10 pr-3 py-3 border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchBar 