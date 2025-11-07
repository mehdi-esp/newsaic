import { useState, useEffect } from 'react'
import { getBookmarks, unbookmarkArticle } from '../services/authService'
import NewsCard from './NewsCard'

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBookmarks()
  }, [])

  const loadBookmarks = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await getBookmarks()
      
      if (result.success) {
        // Extract article data from bookmarks (bookmark.article contains the article)
        const articles = result.bookmarks.map(bookmark => bookmark.article || bookmark)
        setBookmarks(articles)
      } else {
        setError(result.error || 'Failed to load bookmarks')
      }
    } catch (err) {
      setError('An error occurred while loading bookmarks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveBookmark = async (article) => {
    try {
      const result = await unbookmarkArticle(article.url)
      if (result.success) {
        // Remove bookmark from list
        setBookmarks(bookmarks.filter(a => a.guardian_id !== article.guardian_id))
      } else {
        console.error('Failed to remove bookmark:', result.error)
      }
    } catch (err) {
      console.error('Error removing bookmark:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookmarks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Bookmarks</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadBookmarks}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🔖</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Bookmarks</h1>
            <p className="text-gray-600 mb-6">
              You haven't bookmarked any articles yet. Start bookmarking articles you want to read later!
            </p>
            <p className="text-sm text-gray-500">
              Click the bookmark icon on any article to save it here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Bookmarks</h1>
          <p className="text-gray-600">Articles you've saved for later</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((article, index) => (
            <div key={article.guardian_id || article.id || index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 relative">
              <NewsCard article={article} isAuthenticated={true} />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveBookmark(article)
                }}
                className="absolute top-2 right-2 z-20 p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:shadow-lg transition-all group"
                title="Remove bookmark"
              >
                <svg className="w-5 h-5 text-indigo-600 group-hover:text-red-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Bookmarks

