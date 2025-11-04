import { useState } from 'react'

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleChange = (e) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    onSearch(newQuery) // Real-time search
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        type="text"
        className="w-full px-6 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        placeholder="Search news..."
        value={query}
        onChange={handleChange}
        aria-label="Search news"
      />
    </form>
  )
}

export default SearchBar