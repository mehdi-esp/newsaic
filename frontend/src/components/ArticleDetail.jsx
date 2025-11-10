import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getNewsById, getSimilarArticles } from '../services/newsService'
import { bookmarkArticle, unbookmarkArticle, checkBookmark } from '../services/authService'
import { stripHtmlTags } from '../utils/articleHelpers'
import NewsCard from './NewsCard'

const ArticleDetail = ({ isAuthenticated }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isCheckingBookmark, setIsCheckingBookmark] = useState(false)
  const [similarArticles, setSimilarArticles] = useState([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [isAsking, setIsAsking] = useState(false)

  const handleAskQuestion = async () => {
    if (!question.trim()) return

    setIsAsking(true)
    setAnswer(null)

    try {
      const response = await fetch(`http://localhost:8000/articles/${id}/qa/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'), // only if CSRF middleware is active
        },
        body: JSON.stringify({ question }),
      })




      const data = await response.json()
      if (data.answer) {
        setAnswer(data.answer)
      } else {
        setAnswer('No answer found.')
      }
    } catch (error) {
      console.error('Error asking question:', error)
      setAnswer('Error while getting answer.')
    } finally {
      setIsAsking(false)
    }
  }

  // Helper to get CSRF token if Django’s CSRF middleware is active
  function getCookie(name) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
  }

  // Utility function to extract article ID from URL
  const getArticleIdFromUrl = (article) => {
    // First check if id is directly available (for future compatibility)
    if (article?.id) return article.id
    
    // Extract from URL field
    if (article?.url) {
      const match = article.url.match(/\/articles\/([^\/]+)\/?$/)
      return match ? match[1] : null
    }
    
    return null
  }

  useEffect(() => {
    // Reset QA state when article changes
    setQuestion('')
    setAnswer(null)
    setIsAsking(false)
  }, [id])


  useEffect(() => {
    loadArticle()
  }, [id])

  useEffect(() => {
    if (isAuthenticated && article?.guardian_id) {
      checkBookmarkStatus()
    }
  }, [isAuthenticated, article])

  useEffect(() => {
    const articleId = getArticleIdFromUrl(article)
    if (articleId) {
      fetchSimilarArticles(articleId)
    }
  }, [article])

  const loadArticle = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const data = await getNewsById(id)
      if (data) {
        setArticle(data)
      } else {
        setError('Article not found')
      }
    } catch (err) {
      console.error('Error loading article:', err)
      setError('Failed to load article')
    } finally {
      setIsLoading(false)
    }
  }

  const checkBookmarkStatus = async () => {
    if (!article?.guardian_id) return
    setIsCheckingBookmark(true)
    try {
      const result = await checkBookmark(article.url || article.api_url)
      if (result.success) {
        setIsBookmarked(result.bookmarked)
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error)
    } finally {
      setIsCheckingBookmark(false)
    }
  }

  const handleBookmarkClick = async () => {
    if (!article?.guardian_id) return

    try {
      if (isBookmarked) {
        const result = await unbookmarkArticle(article.url || article.api_url)
        if (result.success) {
          setIsBookmarked(false)
        }
      } else {
        const result = await bookmarkArticle(article.url || article.api_url)
        if (result.success) {
          setIsBookmarked(true)
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const fetchSimilarArticles = async (articleId = null) => {
    const id = articleId || getArticleIdFromUrl(article)
    if (!id) return
    
    setLoadingSimilar(true)
    try {
      const similar = await getSimilarArticles(id)
      setSimilarArticles(similar)
    } catch (error) {
      console.error('Error fetching similar articles:', error)
      setSimilarArticles([])
    } finally {
      setLoadingSimilar(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getAuthorNames = () => {
    if (!article?.authors || article.authors.length === 0) return 'Guardian Staff'
    if (Array.isArray(article.authors)) {
      return article.authors.map(author => 
        typeof author === 'string' ? author : (author.web_title || `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Guardian Staff')
      ).join(', ')
    }
    return 'Guardian Staff'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link 
              to="/" 
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Article Not Found</h1>
            <p className="text-gray-600">{error || 'The requested article could not be found.'}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">The article you're looking for doesn't exist or has been removed.</p>
            <Link 
              to="/"
              className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Article Content */}
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Thumbnail */}
          {article.thumbnail && (
            <div className="relative w-full">
              <img 
                src={article.thumbnail} 
                alt={article.headline || article.web_title}
                className="w-full h-96 object-cover bg-gray-200"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
              {/* Bookmark Button */}
              {isAuthenticated && (
                <button
                  onClick={handleBookmarkClick}
                  className="absolute top-4 right-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:shadow-lg transition-all group pointer-events-auto"
                  title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  disabled={isCheckingBookmark}
                  type="button"
                >
                  {isBookmarked ? (
                    <svg className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="p-8">
            {/* Section Badge */}
            {article.section_name && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full uppercase">
                  {article.section_name}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {stripHtmlTags(article.headline || article.web_title)}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600 border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium text-gray-900">{getAuthorNames()}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(article.first_publication_date)}</span>
              </div>
            </div>

            {/* Bookmark Button (if no thumbnail) */}
            {!article.thumbnail && isAuthenticated && (
              <div className="mb-6">
                <button
                  onClick={handleBookmarkClick}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition-all group"
                  title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  disabled={isCheckingBookmark}
                  type="button"
                >
                  {isBookmarked ? (
                    <>
                      <svg className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                      <span className="text-sm font-medium text-indigo-600">Bookmarked</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-600">Bookmark</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Trail Text / Summary */}
            {article.trail_text && (
              <div className="mb-6">
                <p className="text-xl text-gray-700 leading-relaxed font-medium italic">
                  {stripHtmlTags(article.trail_text)}
                </p>
              </div>
            )}

            {/* Body Text */}
            {article.body_text && (
              <div className="prose prose-lg max-w-none mb-8">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {article.body_text.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Ask a Question Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ask a Question about this article
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={isAsking || !question.trim()}
                  className={`px-6 py-2 rounded-md text-white font-medium transition-all ${
                    isAsking ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isAsking ? 'Asking...' : 'Ask'}
                </button>
              </div>

              {answer && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-800">
                    <span className="font-semibold text-indigo-600">Answer:</span> {answer}
                  </p>
                </div>
              )}
            </div>


            {/* Read on Guardian Link */}
            {article.web_url && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <a
                  href={article.web_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <span>Read original article on Guardian</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </article>

        {/* Related Articles Section */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related articles</h2>
          {loadingSimilar ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : similarArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarArticles.map(article => (
                <NewsCard 
                  key={article.guardian_id} 
                  article={article} 
                  isAuthenticated={isAuthenticated} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No related articles found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArticleDetail

