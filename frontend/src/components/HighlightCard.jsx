import React from 'react'
import { useNavigate } from 'react-router-dom'

function HighlightCard({ story, featured = false, compact = false }) {
  const navigate = useNavigate()

  const handleClick = () => {
    // Extract story ID from URL or use the URL itself as identifier
    const storyId = story.url || story.id
    if (storyId) {
      // Encode the story URL/ID for use in query parameter
      const encodedId = encodeURIComponent(storyId)
      navigate(`/highlights?story=${encodedId}`)
    }
  }

  // Get preview text (first 150 characters of body_text)
  const getPreviewText = () => {
    if (!story.body_text) return 'No description available'
    const preview = story.body_text.substring(0, 150)
    return preview.length < story.body_text.length ? `${preview}...` : preview
  }

  // Extract story ID from URL for display
  const getStoryId = () => {
    if (story.url) {
      // Extract ID from URL like "http://localhost:8000/daily-highlight/123/"
      const match = story.url.match(/\/(\d+)\/?$/)
      return match ? match[1] : story.order || ''
    }
    return story.id || story.order || ''
  }

  // Get thumbnail from source articles (deterministic - uses first available)
  const getThumbnailFromSource = () => {
    if (!story.source_articles || story.source_articles.length === 0) return null
    // Find first article with a thumbnail
    const articleWithThumbnail = story.source_articles.find(
      article => article.thumbnail && article.thumbnail.trim() !== ''
    )
    return articleWithThumbnail ? articleWithThumbnail.thumbnail : null
  }

  const thumbnail = getThumbnailFromSource()

  if (featured) {
    return (
      <div 
        className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl cursor-pointer h-full flex flex-col group border-2 border-indigo-100 hover:border-indigo-300 transition-all relative z-0"
        onClick={handleClick}
      >
        {thumbnail && (
          <div className="relative">
            <img 
              src={thumbnail} 
              alt={story.title}
              className="w-full h-64 object-cover bg-gray-200 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                  {story.order || getStoryId()}
                </div>
                <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full uppercase shadow-lg">
                  Highlight
                </span>
              </div>
            </div>
            {story.narration && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343l-.707-.707m12.728 0l-.707.707M6 12H4m16 0h-2M12 6V4m0 16v-2" />
                </svg>
                <span className="text-xs font-medium text-indigo-600">Audio</span>
              </div>
            )}
          </div>
        )}
        <div className="p-6 flex-1 flex flex-col">
          {!thumbnail && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {story.order || getStoryId()}
              </div>
              <div className="flex-1">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full uppercase">
                  Highlight
                </span>
              </div>
              {story.narration && (
                <div className="flex items-center gap-1 text-indigo-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343l-.707-.707m12.728 0l-.707.707M6 12H4m16 0h-2M12 6V4m0 16v-2" />
                  </svg>
                  <span className="text-xs font-medium">Audio</span>
                </div>
              )}
            </div>
          )}
          <h3 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-3 leading-tight group-hover:text-indigo-600 transition-colors">
            {story.title}
          </h3>
          <p className="text-gray-600 mb-6 line-clamp-4 leading-relaxed flex-1">
            {getPreviewText()}
          </p>
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="text-sm text-indigo-600 font-medium group-hover:text-indigo-700">
              Read & Listen →
            </span>
            {story.source_articles && story.source_articles.length > 0 && (
              <span className="text-xs text-gray-500">
                {story.source_articles.length} source{story.source_articles.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div 
        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer flex group border border-indigo-100 hover:border-indigo-300 transition-all relative z-0"
        onClick={handleClick}
      >
        {thumbnail && (
          <div className="w-24 h-24 flex-shrink-0 relative">
            <img 
              src={thumbnail} 
              alt={story.title}
              className="w-full h-full object-cover bg-gray-200 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div className="absolute top-1 left-1 z-10">
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs shadow-md">
                {story.order || getStoryId()}
              </div>
            </div>
          </div>
        )}
        <div className="p-4 flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {!thumbnail && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs">
                {story.order || getStoryId()}
              </div>
            )}
            <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded">
              Highlight
            </span>
            {story.narration && (
              <svg className="w-4 h-4 text-indigo-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343l-.707-.707m12.728 0l-.707.707M6 12H4m16 0h-2M12 6V4m0 16v-2" />
              </svg>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
            {story.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">
            {getPreviewText()}
          </p>
          <div className="flex justify-between items-center text-xs text-gray-500 mt-auto">
            <span className="text-indigo-600 font-medium">Read more →</span>
            {story.source_articles && story.source_articles.length > 0 && (
              <span>{story.source_articles.length} source{story.source_articles.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg cursor-pointer h-full flex flex-col group border border-indigo-100 hover:border-indigo-300 transition-all relative z-0"
      onClick={handleClick}
    >
      {thumbnail && (
        <div className="relative">
          <img 
            src={thumbnail} 
            alt={story.title}
            className="w-full h-48 object-cover bg-gray-200 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm shadow-lg">
                {story.order || getStoryId()}
              </div>
              <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full uppercase shadow-lg">
                Highlight
              </span>
            </div>
          </div>
          {story.narration && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343l-.707-.707m12.728 0l-.707.707M6 12H4m16 0h-2M12 6V4m0 16v-2" />
              </svg>
              <span className="text-xs font-medium text-indigo-600">Audio</span>
            </div>
          )}
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        {!thumbnail && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
              {story.order || getStoryId()}
            </div>
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full uppercase">
              Highlight
            </span>
            {story.narration && (
              <div className="ml-auto flex items-center gap-1 text-indigo-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343l-.707-.707m12.728 0l-.707.707M6 12H4m16 0h-2M12 6V4m0 16v-2" />
                </svg>
                <span className="text-xs font-medium">Audio</span>
              </div>
            )}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {story.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-1">
          {getPreviewText()}
        </p>
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <span className="text-sm text-indigo-600 font-medium group-hover:text-indigo-700">
            Read & Listen →
          </span>
          {story.source_articles && story.source_articles.length > 0 && (
            <span className="text-xs text-gray-500">
              {story.source_articles.length} source{story.source_articles.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default HighlightCard

