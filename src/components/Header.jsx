import SearchBar from './SearchBar'

const Header = ({ searchQuery, onSearchChange }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🍽️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Procol ki Rasoi</h1>
              <p className="text-sm text-gray-600">Your office kitchen</p>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>
    </header>
  )
}

export default Header 