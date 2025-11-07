import React, { useState, useEffect } from 'react'

function CategoryFilter({ selectedCategory, onCategoryChange }) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const CATEGORY_LIMIT = 12 // Show first 12 categories initially (excluding "All")

  useEffect(() => {
    // Fetch available sections
    fetch('http://localhost:8000/sections/')
      .then(res => res.json())
      .then(data => {
        // Handle paginated response from DRF - extract results array
        const sectionsList = data.results || data || []
        setSections(sectionsList)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching sections:', err)
        // Fallback to empty array if fetch fails
        setSections([])
        setLoading(false)
      })
  }, [])

  // Map sections to categories, keeping "All" as first option
  const allCategories = [
    'All',
    ...sections
      .map(section => section.web_title || section.section_id)
      .filter(title => title) // Filter out any null/undefined titles
      .sort() // Sort alphabetically
  ]

  // Determine which categories to display based on expanded state
  const shouldShowToggle = allCategories.length > CATEGORY_LIMIT + 1 // +1 for "All"
  const displayedCategories = isExpanded || !shouldShowToggle
    ? allCategories
    : [
        'All',
        ...allCategories.slice(1, CATEGORY_LIMIT + 1) // Slice excluding "All"
      ]

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="my-6 py-4 border-b border-gray-200">
      <div className="flex gap-3 flex-wrap justify-center overflow-x-auto pb-2">
        {loading ? (
          <div className="text-sm text-gray-500">Loading categories...</div>
        ) : allCategories.length > 1 ? (
          <>
            {displayedCategories.map(category => (
              <button
                key={category}
                className={`btn-category ${selectedCategory === category ? 'btn-category-active' : ''}`}
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            ))}
            {shouldShowToggle && (
              <button
                onClick={toggleExpanded}
                className="btn-category"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500">No categories available</div>
        )}
      </div>
    </div>
  )
}

export default CategoryFilter
