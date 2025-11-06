import React, { useState, useEffect } from 'react'
import { bookmarkArticle, unbookmarkArticle, checkBookmark } from '../services/authService'

function NewsCard({ article, featured = false, compact = false, isAuthenticated = false }) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isCheckingBookmark, setIsCheckingBookmark] = useState(false)

  useEffect(() => {
    if (isAuthenticated && article.guardian_id) {
      checkBookmarkStatus()
    }
  }, [isAuthenticated, article.guardian_id])

  const checkBookmarkStatus = async () => {
    if (!article.guardian_id) return
    setIsCheckingBookmark(true)
    try {
      const result = await checkBookmark(article.guardian_id)
      if (result.success) {
        setIsBookmarked(result.bookmarked)
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error)
    } finally {
      setIsCheckingBookmark(false)
    }
  }

  const handleBookmarkClick = async (e) => {
    e.stopPropagation()
    if (!article.guardian_id) return

    try {
      if (isBookmarked) {
        const result = await unbookmarkArticle(article.guardian_id)
        if (result.success) {
          setIsBookmarked(false)
        }
      } else {
        const result = await bookmarkArticle(article.guardian_id)
        if (result.success) {
          setIsBookmarked(true)
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const handleClick = () => {
    if (article.web_url) {
      window.open(article.web_url, '_blank', 'noopener,noreferrer')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Get author names
  const getAuthorNames = () => {
    if (!article.authors || article.authors.length === 0) return 'Guardian Staff'
    return article.authors.join(', ')
  }

  const BookmarkButton = ({ compact = false }) => {
    if (!isAuthenticated || !article.guardian_id) return null
    
    const positionClass = compact ? 'top-1 right-1' : 'top-4 right-4'
    const sizeClass = compact ? 'w-4 h-4 p-1' : 'w-5 h-5 p-2'
    
    return (
      <button
        onClick={handleBookmarkClick}
        className={`absolute ${positionClass} z-10 ${sizeClass} bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:shadow-lg transition-all group`}
        title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        disabled={isCheckingBookmark}
      >
        {isBookmarked ? (
          <svg className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} text-indigo-600 group-hover:text-indigo-700 transition-colors`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        ) : (
          <svg className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} text-gray-400 group-hover:text-indigo-600 transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )}
      </button>
    )
  }

  if (featured) {
    return (
      <div 
        className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl cursor-pointer h-full flex flex-col group relative"
        onClick={handleClick}
      >
        {article.thumbnail && (
          <div className="relative">
            <img 
              src={article.thumbnail} 
              alt={article.web_title}
              className="w-full h-64 object-cover bg-gray-200 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div className="absolute top-4 left-4">
              <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full uppercase">
                {article.section_name || article.section_id || 'News'}
              </span>
            </div>
            <BookmarkButton compact={false} />
          </div>
        )}
        {!article.thumbnail && <BookmarkButton compact={false} />}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-3 leading-tight group-hover:text-indigo-600 transition-colors">
            {article.headline || article.web_title}
          </h3>
          <p className="text-gray-600 mb-6 line-clamp-4 leading-relaxed flex-1">
            {article.trail_text || article.body_text || 'No description available'}
          </p>
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{getAuthorNames()}</span>
            <span>{formatDate(article.first_publication_date)}</span>
          </div>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div 
        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer h-full flex group relative"
        onClick={handleClick}
      >
        {article.thumbnail && (
          <div className="w-24 h-24 flex-shrink-0 relative">
            <img 
              src={article.thumbnail} 
              alt={article.web_title}
              className="w-full h-full object-cover bg-gray-200 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <BookmarkButton compact={true} />
          </div>
        )}
        {!article.thumbnail && <BookmarkButton compact={true} />}
        <div className="p-4 flex-1 flex flex-col min-w-0">
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded w-fit mb-2">
            {article.section_name || article.section_id || 'News'}
          </span>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
            {article.headline || article.web_title}
          </h3>
          <div className="flex justify-between items-center text-xs text-gray-500 mt-auto">
            <span className="truncate">{getAuthorNames()}</span>
            <span>{formatDate(article.first_publication_date)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg cursor-pointer h-full flex flex-col group relative"
      onClick={handleClick}
    >
      {article.thumbnail && (
        <div className="relative">
          <img 
            src={article.thumbnail} 
            alt={article.web_title}
            className="w-full h-48 object-cover bg-gray-200 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          <BookmarkButton compact={false} />
        </div>
      )}
      {!article.thumbnail && <BookmarkButton compact={false} />}
      <div className="p-5 flex-1 flex flex-col">
        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full uppercase mb-3 w-fit">
          {article.section_name || article.section_id || 'News'}
        </span>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {article.headline || article.web_title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-1">
          {article.trail_text || article.body_text || 'No description available'}
        </p>
        <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{getAuthorNames()}</span>
          <span>{formatDate(article.first_publication_date)}</span>
        </div>
      </div>
    </div>
  )
}

export default NewsCard
