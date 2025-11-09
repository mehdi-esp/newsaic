import axios from 'axios'
import { mockNewsData } from '../utils/mockData'
import apiClient from './authService'

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:8000'

// Toggle between mock data and real API
const USE_MOCK_DATA = false // Now using real Django backend

/**
 * Fetch all news articles
 * @param {boolean} preferred - Whether to retrieve preferred news articles
 * @returns {Promise<Array>} Array of news articles
 */
export const getNews = async (preferred = false) => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockNewsData
  }

  try {
    const params = preferred ? { preferred: true } : {};
    const response = await apiClient.get('/articles/', { params })
    // Django REST Framework returns paginated results in 'results' field
    return response.data.results || response.data
  } catch (error) {
    console.error('Error fetching news:', error)
    // Fallback to mock data on error
    return mockNewsData
  }
}

/**
 * Search news articles
 * @param {string} query - The search query
 * @returns {Promise<Array>} Array of matching news articles
 */
export const searchNews = async (query) => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300))
    const lowerQuery = query.toLowerCase()
    return mockNewsData.filter(article =>
      article.web_title?.toLowerCase().includes(lowerQuery) ||
      article.headline?.toLowerCase().includes(lowerQuery) ||
      article.trail_text?.toLowerCase().includes(lowerQuery) ||
      article.body_text?.toLowerCase().includes(lowerQuery)
    )
  }

  try {
    const response = await apiClient.get('/articles/', { params: { q: query } })
    // We don't paginate since the number of results is small.
    return response.data.results
  } catch (error) {
    console.error('Error searching news:', error)
    throw error;
  }
}

/**
 * Fetch a single news article by ID
 * @param {string} id - The article guardian_id
 * @returns {Promise<Object>} The news article
 */
export const getNewsById = async (id) => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockNewsData.find(article => article.guardian_id === id)
  }

  try {
    const response = await apiClient.get(`/articles/${id}/`)
    return response.data
  } catch (error) {
    console.error('Error fetching news article:', error)
    return mockNewsData.find(article => article.guardian_id === id)
  }
}

/**
 * Get recommended articles for the current user
 * Uses preferred sections endpoint
 * @returns {Promise<Array>} Array of recommended articles
 */
export const getRecommendedArticles = async () => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockNewsData
  }

  try {
    const response = await apiClient.get('/articles/', { 
      params: { preferred: true } 
    })
    return response.data.results || response.data
  } catch (error) {
    console.error('Error fetching recommended articles:', error)
    throw error
  }
}

/**
 * Get similar articles for a specific article
 * @param {string} articleId - The article guardian_id
 * @returns {Promise<Array>} Array of similar articles
 */
export const getSimilarArticles = async (articleId) => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockNewsData.slice(0, 3)
  }

  try {
    const response = await apiClient.get(`/articles/${articleId}/similar/`)
    return response.data || []
  } catch (error) {
    console.error('Error fetching similar articles:', error)
    return []
  }
}