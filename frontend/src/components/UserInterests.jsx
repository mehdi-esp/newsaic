import React, { useState } from 'react'

const availableInterests = [
  'Technology',
  'Business', 
  'Sport',
  'Film',
  'Science',
  'Life and style',
  'Politics',
  'World news',
  'Environment',
  'Society'
]

function UserInterests({ interests, onInterestsChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      onInterestsChange(interests.filter(i => i !== interest))
    } else {
      onInterestsChange([...interests, interest])
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span>✨</span>
        <span>Interests ({interests.length})</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-2">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900">Your Interests</p>
              <p className="text-xs text-gray-600 mt-1">
                Customize your "For You" feed
              </p>
            </div>
            
            <div className="max-h-64 overflow-y-auto py-2">
              {availableInterests.map(interest => (
                <label
                  key={interest}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={interests.includes(interest)}
                    onChange={() => toggleInterest(interest)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">{interest}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default UserInterests