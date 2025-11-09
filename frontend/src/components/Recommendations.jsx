import { useState, useEffect } from 'react'
import { getRecommendedArticles } from '../services/newsService'
import NewsCard from './NewsCard'

const Recommendations = ({ isAuthenticated, limit = 6 }) => {
  const [recommendedArticles, setRecommendedArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendations()
    }
  }, [isAuthenticated])

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)
    try {
      const articles = await getRecommendedArticles()
      setRecommendedArticles(articles.slice(0, limit))
    } catch (err) {
      setError('Failed to load recommendations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null // Don't show recommendations for unauthenticated users
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{error}</p>
      </div>
    )
  }

  if (recommendedArticles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recommendations available yet. Update your preferences in Settings.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendedArticles.map(article => (
        <NewsCard 
          key={article.guardian_id} 
          article={article} 
          isAuthenticated={isAuthenticated} 
        />
      ))}
    </div>
  )
}

export default Recommendations

