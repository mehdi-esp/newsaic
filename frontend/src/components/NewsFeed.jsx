import React from 'react'
import NewsCard from './NewsCard'

function NewsFeed({ articles, loading, feedType }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getEmptyStateMessage = () => {
    switch(feedType) {
      case 'foryou':
        return {
          title: 'No personalized articles yet',
          message: 'We\'re learning your interests. Check back soon for personalized content!'
        }
      case 'today':
        return {
          title: 'No articles published today',
          message: 'Check back later for today\'s latest news'
        }
      default:
        return {
          title: 'No articles found',
          message: 'Try adjusting your search or category filter'
        }
    }
  }

  if (articles.length === 0) {
    const emptyState = getEmptyStateMessage()
    return (
      <div className="text-center py-16 px-8 text-gray-600">
        <div className="text-6xl mb-4">
          {feedType === 'foryou' ? '✨' : feedType === 'today' ? '📅' : '🔍'}
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">{emptyState.title}</h3>
        <p>{emptyState.message}</p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-4">
        {articles.map(article => (
          <NewsCard key={article.guardian_id} article={article} />
        ))}
      </div>
    </div>
  )
}

export default NewsFeed