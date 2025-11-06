import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getDailyHighlights } from '../services/highlightsService'
import AudioPlayer from './AudioPlayer'

const Highlights = () => {
  const [searchParams] = useSearchParams()
  const [allStories, setAllStories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Get story ID from query parameter
  const storyParam = searchParams.get('story')

  useEffect(() => {
    loadHighlights()
  }, [])

  const loadHighlights = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await getDailyHighlights()
      
      if (result.success) {
        setAllStories(result.stories)
      } else {
        setError(result.error || 'Failed to load highlights')
      }
    } catch (err) {
      setError('An error occurred while loading highlights')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter stories based on query parameter
  const getFilteredStories = () => {
    if (!storyParam) {
      return allStories
    }

    // Try to find story by URL (decoded) or ID
    const decodedParam = decodeURIComponent(storyParam)
    const filtered = allStories.filter(story => {
      // Match by URL (exact or contains)
      if (story.url && (story.url === decodedParam || story.url.includes(decodedParam))) {
        return true
      }
      // Match by ID
      if (story.id && story.id.toString() === decodedParam) {
        return true
      }
      // Match by extracting ID from URL
      if (story.url) {
        const urlId = story.url.match(/\/(\d+)\/?$/)
        if (urlId && urlId[1] === decodedParam) {
          return true
        }
      }
      return false
    })

    return filtered
  }

  const stories = getFilteredStories()
  const isSingleStoryView = storyParam !== null

  const getFullAudioUrl = (narrationUrl) => {
    if (!narrationUrl) return null
    
    // If it's already a full URL, return it
    if (narrationUrl.startsWith('http://') || narrationUrl.startsWith('https://')) {
      return narrationUrl
    }
    
    // Otherwise, prepend the base URL
    return `http://localhost:8000${narrationUrl}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your highlights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Highlights</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadHighlights}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🎧</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Daily Highlights</h1>
            <p className="text-gray-600 mb-6">
              No highlights have been generated yet. Highlights are created daily based on your preferred sections and interests.
            </p>
            <p className="text-sm text-gray-500">
              Check back later or contact an administrator to generate highlights for you.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show error if story param exists but story not found
  if (isSingleStoryView && !isLoading && stories.length === 0 && allStories.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link 
              to="/highlights" 
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all highlights
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Story Not Found</h1>
            <p className="text-gray-600">The requested story could not be found.</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">The story you're looking for doesn't exist or has been removed.</p>
            <Link 
              to="/highlights"
              className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              View All Highlights
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          {isSingleStoryView && (
            <Link 
              to="/highlights" 
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all highlights
            </Link>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSingleStoryView ? 'Highlight Story' : 'Your Daily Highlights'}
          </h1>
          <p className="text-gray-600">
            {isSingleStoryView 
              ? 'Personalized news story with audio narration' 
              : 'Personalized news stories with audio narration'}
          </p>
        </div>

        <div className="space-y-6">
          {stories.map((story, index) => {
            const audioUrl = getFullAudioUrl(story.narration)
            
            return (
              <div key={story.url || story.id || index} className="bg-white rounded-lg shadow-md p-6">
                {/* Story Number/Order */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                    {story.order || index + 1}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{story.title}</h2>
                </div>

                {/* Audio Player */}
                {audioUrl && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-indigo-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Listen to this story</span>
                    </div>
                    <AudioPlayer audioUrl={audioUrl} />
                  </div>
                )}

                {/* Story Body */}
                <div className="prose max-w-none mb-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{story.body_text}</p>
                </div>

                {/* Source Articles */}
                {story.source_articles && story.source_articles.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Source Articles</h3>
                    <div className="flex flex-wrap gap-2">
                      {story.source_articles.map((article, articleIndex) => {
                        // Get article URL - check web_url first, then url, then construct from ID
                        const getArticleUrl = () => {
                          if (article.web_url) return article.web_url
                          if (article.url && (article.url.startsWith('http://') || article.url.startsWith('https://'))) {
                            return article.url
                          }
                          // If url is a relative path, try to construct full URL
                          if (article.url) {
                            // Extract article ID from URL if it's a hyperlink
                            const match = article.url.match(/\/(\d+)\/?$/)
                            if (match) {
                              // This is a DRF hyperlink, we need the actual web_url
                              // For now, return null and handle gracefully
                              return null
                            }
                            return article.url
                          }
                          return null
                        }
                        
                        const articleUrl = getArticleUrl()
                        const articleTitle = article.web_title || article.title || 'View Article'
                        
                        if (!articleUrl) {
                          return (
                            <span
                              key={article.url || article.id || articleIndex}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                              title="Article URL not available"
                            >
                              {articleTitle}
                            </span>
                          )
                        }
                        
                        return (
                          <a
                            key={article.url || article.id || articleIndex}
                            href={articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            onClick={(e) => {
                              // Ensure link opens in new tab
                              e.stopPropagation()
                            }}
                          >
                            {articleTitle}
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Highlights

