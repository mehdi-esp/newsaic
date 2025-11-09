import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getNews } from '../services/newsService'
import { getDailyHighlights } from '../services/highlightsService'
import NewsCard from './NewsCard'
import HighlightCard from './HighlightCard'
import Recommendations from './Recommendations'

const HomePage = ({ isAuthenticated, user }) => {
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [highlights, setHighlights] = useState([])
  const [highlightsLoading, setHighlightsLoading] = useState(false)

  useEffect(() => {
    fetchNews()
    if (isAuthenticated) {
      fetchHighlights()
    }
  }, [isAuthenticated])

  useEffect(() => {
    filterArticles()
  }, [articles])

  const fetchNews = async () => {
    setLoading(true)
    try {
      const data = await getNews()
      setArticles(data)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    // Home page shows all articles without filtering
    setFilteredArticles(articles)
  }

  const fetchHighlights = async () => {
    setHighlightsLoading(true)
    try {
      const result = await getDailyHighlights()
      if (result.success) {
        setHighlights(result.stories)
      } else {
        console.error('Error fetching highlights:', result.error)
        setHighlights([])
      }
    } catch (error) {
      console.error('Error fetching highlights:', error)
      setHighlights([])
    } finally {
      setHighlightsLoading(false)
    }
  }


  // Get today's date for the header
  const today = new Date()
  const todayString = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Google News Style Header */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Your briefing</h1>
            <div className="text-sm text-gray-500">{todayString}</div>
          </div>
          
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Your Highlights Section - Only show if authenticated */}
        {isAuthenticated && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your highlights</h2>
              <Link 
                to="/highlights" 
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View all →
              </Link>
            </div>
            
            {highlightsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : highlights.length === 0 ? (
              <div className="text-center py-12 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="text-indigo-600 text-4xl mb-3">🎧</div>
                <div className="text-gray-700 text-lg mb-2">No highlights yet</div>
                <p className="text-gray-500 text-sm">Your personalized highlights will appear here once they're generated.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Featured Highlight (Large) */}
                {highlights.length > 0 && (
                  <div className="lg:col-span-2">
                    <HighlightCard story={highlights[0]} featured={true} />
                  </div>
                )}
                
                {/* Side Highlights */}
                <div className="space-y-4">
                  {highlights.slice(1, 4).map((story, index) => (
                    <HighlightCard key={story.url || story.id || index} story={story} compact={true} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommended for you Section */}
        {isAuthenticated && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recommended for you</h2>
            </div>
            <Recommendations isAuthenticated={isAuthenticated} limit={6} />
          </div>
        )}

        {/* Top Stories Section - Show if not authenticated or as fallback */}
        {!isAuthenticated && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Top stories</h2>
              <Link 
                to="/top-stories" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all →
              </Link>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No articles found</div>
                <p className="text-gray-400">Check back later for the latest news</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Featured Article (Large) */}
                {filteredArticles.length > 0 && (
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                      <NewsCard article={filteredArticles[0]} featured={true} isAuthenticated={isAuthenticated} />
                    </div>
                  </div>
                )}
                
                {/* Side Articles */}
                <div className="space-y-4">
                  {filteredArticles.slice(1, 4).map((article, index) => (
                    <div key={article.guardian_id || index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                      <NewsCard article={article} compact={true} isAuthenticated={isAuthenticated} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* More Articles Grid */}
        {filteredArticles.length > 4 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">More stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.slice(4, 10).map((article, index) => (
                <div key={article.guardian_id || index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                  <NewsCard article={article} isAuthenticated={isAuthenticated} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
