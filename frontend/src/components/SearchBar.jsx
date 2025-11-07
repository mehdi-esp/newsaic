import { useState } from 'react'

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search news…"
        className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300
                   focus:outline-none focus:border-indigo-500"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-2 top-1/2 -translate-y-1/2
                   p-2 text-indigo-500 rounded-full
                   hover:bg-indigo-50 focus:outline-none focus:ring-2
                   focus:ring-indigo-400"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </button>
    </form>
  )
}

export default SearchBar