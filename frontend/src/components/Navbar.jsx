import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SearchBar from './SearchBar'
import UserInterests from './UserInterests'

function Navbar({ onSearch, userInterests, onInterestsChange, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link 
            className="flex items-center gap-2 text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors" 
            to="/"
          >
            📰 Newsaic
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 flex-1 max-w-4xl mx-8">
            <SearchBar onSearch={onSearch} />
          </div>

          {/* User Menu */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/bookmarks"
                  className="px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Bookmarks
                </Link>
                <span className="text-sm text-gray-600">
                  {user.username || user.first_name || 'User'}
                </span>
                <button
                  onClick={onLogout}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/for-you"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              ) : (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden mt-4 space-y-3">
            <SearchBar onSearch={onSearch} />
            {user ? (
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <Link
                  to="/bookmarks"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-indigo-600"
                  onClick={() => setIsOpen(false)}
                >
                  Bookmarks
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {user.username || user.first_name || 'User'}
                  </span>
                  <button
                    onClick={() => {
                      onLogout()
                      setIsOpen(false)
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-200">
                <Link
                  to="/for-you"
                  className="block w-full text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
