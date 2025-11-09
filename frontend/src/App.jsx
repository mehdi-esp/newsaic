import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import NewsFeed from './components/NewsFeed'
import CategoryFilter from './components/CategoryFilter'
import HomePage from './components/HomePage'
import ProtectedRoute from './components/ProtectedRoute'
import Register from './components/Register'
import Settings from './components/Settings'
import Highlights from './components/Highlights'
import Bookmarks from './components/Bookmarks'
import ArticleDetail from './components/ArticleDetail'
import { getNews, searchNews } from './services/newsService'
import SearchPage from './components/SearchPage' // Import SearchPage
import { checkAuth, logout, fetchCSRFToken } from './services/authService'
import './App.css'

function App() {
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedFeed, setSelectedFeed] = useState('general')
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const [authLoading, setAuthLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  
  // Mock user interests for "For You" feed (will come from backend later)
  const [userInterests, setUserInterests] = useState(['Technology', 'Science', 'Business'])

  // Fetch CSRF token on component mount (before any POST requests)
  useEffect(() => {
    fetchCSRFToken()
  }, [])

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication()
  }, [])

  // Fetch news on app load (for public access)
  useEffect(() => {
    fetchNews()
  }, [])

  // Fetch preferred articles when switching to "For You" feed
  useEffect(() => {
    if (selectedFeed === 'foryou' && isAuthenticated) {
      fetchForYouArticles()
    }
  }, [selectedFeed, isAuthenticated])

  // Filter articles based on feed, category and search query
  useEffect(() => {
    filterArticles()
  }, [articles, selectedFeed, selectedCategory, userInterests])

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

  const handleLoginSuccess = async (redirectPath = null) => {
    setLoginLoading(true)
    try {
      // Add a small delay to ensure the session is fully established
      await new Promise(resolve => setTimeout(resolve, 500))
      await checkAuthentication()
      // Navigate to redirect path if provided
      if (redirectPath) {
        navigate(redirectPath)
      }
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

  const fetchForYouArticles = async () => {
    setLoading(true)
    try {
      const data = await getNews(true) // Pass preferred=true
      setArticles(data)
    } catch (error) {
      console.error('Error fetching for you articles:', error)
      setArticles([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = articles

    // For "For You" feed, articles are already filtered by backend (preferred=true)
    // No need for client-side filtering by userInterests anymore
    // 'general' feed shows all articles (no additional filtering)

    // Filter by category using section_name
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(article => 
        article.section_name === selectedCategory || 
        article.section_id === selectedCategory.toLowerCase()
      )
    }

    // Filter by search query - search in multiple fields
    /*
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article =>
        article.web_title?.toLowerCase().includes(query) ||
        article.headline?.toLowerCase().includes(query) ||
        article.trail_text?.toLowerCase().includes(query) ||
        article.body_text?.toLowerCase().includes(query)
      )
    } */

    setFilteredArticles(filtered)
  }

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    } else {
      // Navigate to the search page without a query to show the default state
      navigate('/search')
    }
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
    } else if (window.location.pathname === '/for-you' && feed === 'general') {
      // If on /for-you page and selecting General, navigate to home
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
            path="/search"
            element={<SearchPage isAuthenticated={isAuthenticated} />}
          />
          <Route 
            path="/top-stories" 
            element={
              <div className="min-h-screen bg-white">
                <div className="bg-white border-b border-gray-200 py-4">
                  <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                      {selectedFeed === 'foryou' ? 'For You' : 'Top Stories'}
                    </h1>
                    
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
          <Route 
            path="/article/:id" 
            element={<ArticleDetail isAuthenticated={isAuthenticated} />} 
          />
        </Routes>
      </div>
    </div>
  )
}

export default App
