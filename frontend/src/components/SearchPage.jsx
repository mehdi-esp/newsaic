// src/components/SearchPage.jsx 

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import NewsFeed from './NewsFeed'; // Assuming you have this component
import { searchNews } from '../services/newsService'; 

const SearchPage = () => {
    // Hooks to read the URL query parameter: /search?q=space exploration
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Function to fetch search results from the backend
    const fetchSearchResults = async (pageNumber, currentQuery) => {
        if (!currentQuery || currentQuery.trim() === "") {
            setSearchResults([]);
            setTotalPages(1);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // This calls your /articles/?q={query}&page={pageNumber} endpoint
            const data = await searchNews(currentQuery, pageNumber); 
            
            setSearchResults(data.results || []);
            // Assuming default pagination page size is 10
            setTotalPages(Math.ceil(data.count / 10)); 
            
        } catch (err) {
            console.error("Semantic search failed:", err);
            setError("Failed to fetch search results. Check your Ollama server and API connection.");
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Effect hook to run search whenever the query changes
    useEffect(() => {
        // Reset page to 1 and fetch results when query changes
        if (query) {
            setPage(1);
            fetchSearchResults(1, query);
        } else {
            setSearchResults([]);
        }
    }, [query]);

    // Effect hook to run search when page changes
    useEffect(() => {
        if (query) {
            fetchSearchResults(page, query);
            window.scrollTo(0, 0); // Scroll to top on page change
        }
    }, [page]);
    
    const handleNextPage = () => {
        if (page < totalPages) {
            setPage(page + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {query ? `Semantic Search Results for: "${query}"` : "Search Articles"}
            </h1>
            
            {loading && (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Searching the knowledge base...</p>
                </div>
            )}
            
            {error && <div className="text-red-600 py-4">{error}</div>}

            {!loading && searchResults.length === 0 && query && (
                <p className="text-gray-500 py-10">No results found for **"{query}"**.</p>
            )}

            {!loading && searchResults.length > 0 && (
                <>
                    {/* Reusing the NewsFeed component to display results */}
                    <NewsFeed 
                        articles={searchResults}
                        loading={false} 
                        feedType="search" 
                    />
                    
                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-8">
                        <button 
                            onClick={handlePrevPage} 
                            disabled={page === 1}
                            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-gray-400 transition-colors"
                        >
                            Previous Page
                        </button>
                        <span className="text-gray-700">Page **{page}** of **{totalPages}**</span>
                        <button 
                            onClick={handleNextPage} 
                            disabled={page >= totalPages}
                            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-gray-400 transition-colors"
                        >
                            Next Page
                        </button>
                    </div>
                </>
            )}
            
            {/* Display instructions if no query is present */}
            {!query && !loading && (
                <p className="text-gray-500 py-10">Enter a query in the search bar above to begin a semantic search.</p>
            )}

        </div>
    );
};

export default SearchPage;