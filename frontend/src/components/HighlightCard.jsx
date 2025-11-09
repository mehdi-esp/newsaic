import React from 'react'
import { useNavigate } from 'react-router-dom'
import { stripHtmlTags } from '../utils/articleHelpers'

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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-indigo-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
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
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                  </svg>
                  <span className="text-xs font-medium">Audio</span>
                </div>
              )}
            </div>
          )}
          <h3 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-3 leading-tight group-hover:text-indigo-600 transition-colors">
            {stripHtmlTags(story.title)}
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-indigo-600 ml-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
            {stripHtmlTags(story.title)}
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-indigo-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-indigo-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
                <span className="text-xs font-medium">Audio</span>
              </div>
            )}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {stripHtmlTags(story.title)}
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

