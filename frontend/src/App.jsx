import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import NewsFeed from './components/NewsFeed'
import CategoryFilter from './components/CategoryFilter'
import FeedSelector from './components/FeedSelector'
import HomePage from './components/HomePage'
import ProtectedRoute from './components/ProtectedRoute'
import Register from './components/Register'
import Settings from './components/Settings'
import Highlights from './components/Highlights'
import Bookmarks from './components/Bookmarks'
import { getNews, searchNews } from './services/newsService'
import { checkAuth, logout } from './services/authService'
import './App.css'

function App() {
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedFeed, setSelectedFeed] = useState('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const [authLoading, setAuthLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  
  // Mock user interests for "For You" feed (will come from backend later)
  const [userInterests, setUserInterests] = useState(['Technology', 'Science', 'Business'])

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication()
  }, [])

  // Fetch news on app load (for public access)
  useEffect(() => {
    fetchNews()
  }, [])

  // Filter articles based on feed, category and search query
  useEffect(() => {
    filterArticles()
  }, [articles, selectedFeed, selectedCategory, searchQuery, userInterests])

  const checkAuthentication = async () => {
    setAuthLoading(true)
    try {
      // Add timeout to prevent hanging
      const authPromise = checkAuth()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Authentication timeout')), 5000)
      )
      
      const authResult = await Promise.race([authPromise, timeoutPromise])
      setIsAuthenticated(authResult.isAuthenticated)
      setUser(authResult.user)
    } catch (error) {
      console.error('Error checking authentication:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLoginSuccess = async () => {
    setLoginLoading(true)
    try {
      // Add a small delay to ensure the session is fully established
      await new Promise(resolve => setTimeout(resolve, 500))
      await checkAuthentication()
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsAuthenticated(false)
      setUser(null)
      setArticles([])
      setFilteredArticles([])
      // Force page reload to clear any cached session data
      window.location.reload()
    } catch (error) {
      console.error('Error logging out:', error)
      // Even if logout fails, clear local state and reload
      setIsAuthenticated(false)
      setUser(null)
      setArticles([])
      setFilteredArticles([])
      window.location.reload()
    }
  }

  const fetchNews = async () => {
    setLoading(true)
    try {
      const data = await getNews()
      setArticles(data)
    } catch (error) {
      console.error('Error fetching news:', error)
      setArticles([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = articles

    // Filter by feed type
    if (selectedFeed === 'foryou') {
      // Filter by user interests (personalized feed)
      filtered = filtered.filter(article => 
        userInterests.some(interest => 
          article.section_name === interest || 
          article.section_id === interest.toLowerCase()
        )
      )
    } else if (selectedFeed === 'today') {
      // Filter by today's date
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      filtered = filtered.filter(article => {
        if (!article.first_publication_date) return false
        const articleDate = new Date(article.first_publication_date)
        articleDate.setHours(0, 0, 0, 0)
        return articleDate.getTime() === today.getTime()
      })
    }
    // 'general' feed shows all articles (no additional filtering)

    // Filter by category using section_name
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(article => 
        article.section_name === selectedCategory || 
        article.section_id === selectedCategory.toLowerCase()
      )
    }

    // Filter by search query - search in multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article =>
        article.web_title?.toLowerCase().includes(query) ||
        article.headline?.toLowerCase().includes(query) ||
        article.trail_text?.toLowerCase().includes(query) ||
        article.body_text?.toLowerCase().includes(query)
      )
    }

    setFilteredArticles(filtered)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
  }

  const handleFeedChange = (feed) => {
    setSelectedFeed(feed)
    // Reset category when changing feeds
    setSelectedCategory('All')
    
    // Handle navigation based on current page and selected feed
    if (feed === 'foryou') {
      // Always navigate to /for-you when For You is selected
      navigate('/for-you')
    } else if (window.location.pathname === '/for-you' && (feed === 'general' || feed === 'today')) {
      // If on /for-you page and selecting General or Today, navigate to home
      navigate('/')
    }
    // If on /top-stories page and selecting General or Today, stay on /top-stories but update content
  }

  const handleInterestsChange = (newInterests) => {
    setUserInterests(newInterests)
    // TODO: Save to backend when user authentication is implemented
  }

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show main app (public access allowed)
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onSearch={handleSearch}
        userInterests={userInterests}
        onInterestsChange={handleInterestsChange}
        user={user}
        onLogout={handleLogout}
      />
      <div className="container mx-auto px-4 py-4">
        <Routes>
          <Route 
            path="/" 
            element={<HomePage isAuthenticated={isAuthenticated} user={user} />} 
          />
          <Route 
            path="/top-stories" 
            element={
              <div className="min-h-screen bg-white">
                <div className="bg-white border-b border-gray-200 py-4">
                  <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                      {selectedFeed === 'today' ? 'Today\'s Stories' : 
                       selectedFeed === 'foryou' ? 'For You' : 'Top Stories'}
                    </h1>
                    
                    {/* Feed Selector */}
                    <div className="mb-4">
                      <FeedSelector 
                        selectedFeed={selectedFeed}
                        onFeedChange={handleFeedChange}
                      />
                    </div>
                    
                    {/* Category Filter */}
                    <div className="mb-4">
                      <CategoryFilter 
                        selectedCategory={selectedCategory}
                        onCategoryChange={handleCategoryChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="container mx-auto px-4 py-6">
                  <NewsFeed 
                    articles={filteredArticles}
                    loading={loading}
                    feedType={selectedFeed}
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              </div>
            } 
          />
          <Route 
            path="/category/:categoryName" 
            element={
              <div className="min-h-screen bg-white">
                <div className="bg-white border-b border-gray-200 py-4">
                  <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Category News</h1>
                    <div className="flex gap-4">
                      <FeedSelector 
                        selectedFeed="general"
                        onFeedChange={handleFeedChange}
                      />
                      <CategoryFilter 
                        selectedCategory={selectedCategory}
                        onCategoryChange={handleCategoryChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="container mx-auto px-4 py-6">
                  <NewsFeed 
                    articles={filteredArticles}
                    loading={loading}
                    feedType="general"
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              </div>
            } 
          />
          <Route 
            path="/for-you" 
            element={
              <ProtectedRoute 
                isAuthenticated={isAuthenticated}
                isLoading={authLoading || loginLoading}
                onLoginSuccess={handleLoginSuccess}
              >
                <div>
                  <FeedSelector 
                    selectedFeed="foryou"
                    onFeedChange={handleFeedChange}
                  />
                  <CategoryFilter 
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                  />
                  <NewsFeed 
                    articles={filteredArticles}
                    loading={loading}
                    feedType="foryou"
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookmarks" 
            element={
              <ProtectedRoute 
                isAuthenticated={isAuthenticated}
                isLoading={authLoading || loginLoading}
                onLoginSuccess={handleLoginSuccess}
              >
                <Bookmarks />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <Register onRegisterSuccess={handleLoginSuccess} />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute 
                isAuthenticated={isAuthenticated}
                isLoading={authLoading || loginLoading}
                onLoginSuccess={handleLoginSuccess}
              >
                <Settings 
                  user={user} 
                  onUpdate={(updatedUser) => {
                    setUser(updatedUser)
                    checkAuthentication()
                  }} 
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/highlights" 
            element={
              <ProtectedRoute 
                isAuthenticated={isAuthenticated}
                isLoading={authLoading || loginLoading}
                onLoginSuccess={handleLoginSuccess}
              >
                <Highlights />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </div>
  )
}

export default App
