import React from 'react'

function NewsCard({ article, featured = false, compact = false }) {
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
    return article.authors.map(author => author.webTitle || `${author.firstName} ${author.lastName}`).join(', ')
  }

  if (featured) {
    return (
      <div 
        className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl cursor-pointer h-full flex flex-col group"
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
          </div>
        )}
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
        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer h-full flex group"
        onClick={handleClick}
      >
        {article.thumbnail && (
          <div className="w-24 h-24 flex-shrink-0">
            <img 
              src={article.thumbnail} 
              alt={article.web_title}
              className="w-full h-full object-cover bg-gray-200 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}
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
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg cursor-pointer h-full flex flex-col group"
      onClick={handleClick}
    >
      {article.thumbnail && (
        <img 
          src={article.thumbnail} 
          alt={article.web_title}
          className="w-full h-48 object-cover bg-gray-200 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      )}
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
