import axios from 'axios'
import { mockNewsData } from '../utils/mockData'
import apiClient from './authService'

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:8000'

// Toggle between mock data and real API
const USE_MOCK_DATA = false // Now using real Django backend

/**
 * Fetch all news articles
 * @returns {Promise<Array>} Array of news articles
 */
export const getNews = async () => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockNewsData
  }

  try {
    const response = await apiClient.get('/articles/')
    // Django REST Framework returns paginated results in 'results' field
    return response.data.results || response.data
  } catch (error) {
    console.error('Error fetching news:', error)
    // Fallback to mock data on error
    return mockNewsData
  }
}

/**
 * Fetch news by category
 * @param {string} category - The category to filter by (section_name)
 * @returns {Promise<Array>} Array of filtered news articles
 */
export const getNewsByCategory = async (category) => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockNewsData.filter(article => 
      article.section_name?.toLowerCase() === category.toLowerCase() ||
      article.section_id?.toLowerCase() === category.toLowerCase()
    )
  }

  try {
    // Since Django backend doesn't have category filtering endpoint yet,
    // we'll fetch all articles and filter client-side
    const response = await apiClient.get('/articles/')
    const articles = response.data.results || response.data
    
    return articles.filter(article => 
      article.section_name?.toLowerCase() === category.toLowerCase() ||
      article.section_id?.toLowerCase() === category.toLowerCase()
    )
  } catch (error) {
    console.error('Error fetching news by category:', error)
    return mockNewsData.filter(article => 
      article.section_name?.toLowerCase() === category.toLowerCase() ||
      article.section_id?.toLowerCase() === category.toLowerCase()
    )
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
    // Since Django backend doesn't have search endpoint yet,
    // we'll fetch all articles and search client-side
    const response = await apiClient.get('/articles/')
    const articles = response.data.results || response.data
    
    const lowerQuery = query.toLowerCase()
    return articles.filter(article =>
      article.web_title?.toLowerCase().includes(lowerQuery) ||
      article.headline?.toLowerCase().includes(lowerQuery) ||
      article.trail_text?.toLowerCase().includes(lowerQuery) ||
      article.body_text?.toLowerCase().includes(lowerQuery)
    )
  } catch (error) {
    console.error('Error searching news:', error)
    const lowerQuery = query.toLowerCase()
    return mockNewsData.filter(article =>
      article.web_title?.toLowerCase().includes(lowerQuery) ||
      article.headline?.toLowerCase().includes(lowerQuery) ||
      article.trail_text?.toLowerCase().includes(lowerQuery) ||
      article.body_text?.toLowerCase().includes(lowerQuery)
    )
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
 * Fetch personalized news for user based on their interests
 * @param {Array<string>} interests - User's interests/preferences
 * @returns {Promise<Array>} Array of personalized news articles
 */
export const getPersonalizedNews = async (interests) => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockNewsData.filter(article =>
      interests.some(interest =>
        article.section_name === interest ||
        article.section_id === interest.toLowerCase()
      )
    )
  }

  try {
    // Since Django backend doesn't have personalized endpoint yet,
    // we'll fetch all articles and filter client-side
    const response = await apiClient.get('/articles/')
    const articles = response.data.results || response.data
    
    return articles.filter(article =>
      interests.some(interest =>
        article.section_name === interest ||
        article.section_id === interest.toLowerCase()
      )
    )
  } catch (error) {
    console.error('Error fetching personalized news:', error)
    return mockNewsData.filter(article =>
      interests.some(interest =>
        article.section_name === interest ||
        article.section_id === interest.toLowerCase()
      )
    )
  }
}

/**
 * Fetch today's news articles
 * @returns {Promise<Array>} Array of today's news articles
 */
export const getTodayNews = async () => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return mockNewsData.filter(article => {
      if (!article.first_publication_date) return false
      const articleDate = new Date(article.first_publication_date)
      articleDate.setHours(0, 0, 0, 0)
      return articleDate.getTime() === today.getTime()
    })
  }

  try {
    // Since Django backend doesn't have today's news endpoint yet,
    // we'll fetch all articles and filter client-side
    const response = await apiClient.get('/articles/')
    const articles = response.data.results || response.data
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return articles.filter(article => {
      if (!article.first_publication_date) return false
      const articleDate = new Date(article.first_publication_date)
      articleDate.setHours(0, 0, 0, 0)
      return articleDate.getTime() === today.getTime()
    })
  } catch (error) {
    console.error('Error fetching today\'s news:', error)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return mockNewsData.filter(article => {
      if (!article.first_publication_date) return false
      const articleDate = new Date(article.first_publication_date)
      articleDate.setHours(0, 0, 0, 0)
      return articleDate.getTime() === today.getTime()
    })
  }
}
