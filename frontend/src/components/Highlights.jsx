import { useState, useEffect } from 'react'
import { getDailyHighlights } from '../services/highlightsService'
import AudioPlayer from './AudioPlayer'

const Highlights = () => {
  const [stories, setStories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHighlights()
  }, [])

  const loadHighlights = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await getDailyHighlights()
      
      if (result.success) {
        setStories(result.stories)
      } else {
        setError(result.error || 'Failed to load highlights')
      }
    } catch (err) {
      setError('An error occurred while loading highlights')
    } finally {
      setIsLoading(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Daily Highlights</h1>
          <p className="text-gray-600">Personalized news stories with audio narration</p>
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
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343l-.707-.707m12.728 0l-.707.707M6 12H4m16 0h-2M12 6V4m0 16v-2" />
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
                      {story.source_articles.map((article, articleIndex) => (
                        <a
                          key={article.url || articleIndex}
                          href={article.web_url || article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          {article.web_title || article.title || 'View Article'}
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
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

