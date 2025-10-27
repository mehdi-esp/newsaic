import React from 'react'

// Categories matching Guardian API sections
const categories = [
  'All',
  'Technology',
  'Business',
  'Sport',
  'Film',
  'Science',
  'Life and style',
  'Politics'
]

function CategoryFilter({ selectedCategory, onCategoryChange }) {
  return (
    <div className="my-6 py-4 border-b border-gray-200">
      <div className="flex gap-3 flex-wrap justify-center overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category}
            className={`btn-category ${selectedCategory === category ? 'btn-category-active' : ''}`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter
