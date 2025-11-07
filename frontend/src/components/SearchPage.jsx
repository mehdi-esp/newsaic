import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import NewsFeed from './NewsFeed'; // Assuming you have this component
import { searchNews } from '../services/newsService';

const SearchPage = ({ isAuthenticated }) => {
    // Hooks to read the URL query parameter: /search?q=space exploration
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');


    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Function to fetch search results from the backend
    const fetchSearchResults = async (currentQuery) => {
        if (!currentQuery || currentQuery.trim() === "") {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const articles = await searchNews(currentQuery);

            setSearchResults(articles || []);

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
        if (query) {
            fetchSearchResults(query);
        } else {
            setSearchResults([]);
        }
    }, [query]);

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
                <p className="text-gray-500 py-10">No results found for "{query}".</p>
            )}

            {!loading && searchResults.length > 0 && (
                <>
                    {/* Reusing the NewsFeed component to display results */}
                    <NewsFeed
                        articles={searchResults}
                        loading={false}
                        feedType="search"
                        isAuthenticated={isAuthenticated}
                    />

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