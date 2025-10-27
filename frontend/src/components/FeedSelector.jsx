import React from 'react'

const feeds = [
  { id: 'general', label: 'General', icon: '🌐' },
  { id: 'foryou', label: 'For You', icon: '✨' },
  { id: 'today', label: 'Today', icon: '📅' }
]

function FeedSelector({ selectedFeed, onFeedChange }) {
  return (
    <div className="bg-white shadow-sm mb-6">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 border-b border-gray-200">
          {feeds.map(feed => (
            <button
              key={feed.id}
              className={`
                flex items-center gap-2 px-6 py-4 font-medium transition-all relative
                ${selectedFeed === feed.id 
                  ? 'text-primary border-b-2 border-primary -mb-[2px]' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              onClick={() => onFeedChange(feed.id)}
            >
              <span className="text-xl">{feed.icon}</span>
              <span>{feed.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FeedSelector
