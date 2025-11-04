// services/authService.js
import axios from 'axios'

// Configure axios for Django session authentication
const API_BASE_URL = 'http://localhost:8000'

// Create axios instance with credentials enabled for session auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for sending/receiving Django session cookies
  headers: {
    'Content-Type': 'application/json',
  }
})

/**
 * Get CSRF token from cookies
 * @returns {string} CSRF token
 */
const getCSRFToken = () => {
  // Logic to read the csrftoken cookie set by Django
  const name = 'csrftoken'
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

// ----------------------------------------------------
// CORE AUTHENTICATION FUNCTIONS
// ----------------------------------------------------

/**
 * Login user with Django session authentication
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Login response
 */
export const login = async (username, password) => {
  try {
    // 🔑 FIX: Get CSRF token and include it in the POST request
    const csrfToken = getCSRFToken()

    // 🔑 FIX: Corrected API path to match Django's new /users/ prefix
    const response = await apiClient.post('/users/login/', { 
      username,
      password
    }, {
      headers: {
        'X-CSRFToken': csrfToken // Token must be sent for POST/PUT/DELETE requests
      }
    })

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      // Provide detailed error message from Django response if available
      error: error.response?.data?.detail || error.message || 'Login failed'
    }
  }
}

/**
 * Logout user from Django session
 * @returns {Promise<Object>} Logout response
 */
export const logout = async () => {
  try {
    const csrfToken = getCSRFToken()
    // 🔑 FIX: Corrected API path to match Django's new /users/ prefix
    const response = await apiClient.post('/users/logout/', {}, { 
      headers: {
        'X-CSRFToken': csrfToken
      }
    })
    
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('Logout error:', error)
    // Even if logout fails on backend, consider it successful on frontend
    return {
      success: true,
      data: { detail: 'Client-side logout fallback' }
    }
  }
}

/**
 * Check if user is authenticated (using the /users/me/ endpoint)
 * @returns {Promise<Object>} Authentication status
 */
export const checkAuth = async () => {
  try {
    // 🔑 FIX: Corrected API path to match Django's new /users/ prefix
    const response = await apiClient.get('/users/me/') 
    return {
      isAuthenticated: true,
      user: response.data
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      user: null
    }
  }
}

/**
 * Get current user profile (uses the same /users/me/ endpoint)
 * @returns {Promise<Object>} User profile
 */
export const getCurrentUser = async () => {
  try {
    // 🔑 FIX: Corrected API path to match Django's new /users/ prefix
    const response = await apiClient.get('/users/me/') 
    return {
      success: true,
      user: response.data
    }
  } catch (error) {
    console.error('Get user error:', error)
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to get user profile'
    }
  }
}

// ----------------------------------------------------
// BOOKMARK FUNCTIONS
// ----------------------------------------------------

/**
 * Bookmark an article
 * @param {string} articleId - Article ID
 * @returns {Promise<Object>} Bookmark response
 */
export const bookmarkArticle = async (articleId) => {
  try {
    // CSRF token is required for POST
    const csrfToken = getCSRFToken() 
    
    // NOTE: Assuming '/articles/...' is the correct path prefix for your article app
    const response = await apiClient.post(`/articles/${articleId}/bookmark/`, {}, {
      headers: {
        'X-CSRFToken': csrfToken
      }
    })
    
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('Bookmark error:', error)
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to bookmark article'
    }
  }
}

/**
 * Remove bookmark from an article
 * @param {string} articleId - Article ID
 * @returns {Promise<Object>} Unbookmark response
 */
export const unbookmarkArticle = async (articleId) => {
  try {
    // CSRF token is required for DELETE
    const csrfToken = getCSRFToken() 
    
    // NOTE: Assuming '/articles/...' is the correct path prefix for your article app
    const response = await apiClient.delete(`/articles/${articleId}/bookmark/`, {
      headers: {
        'X-CSRFToken': csrfToken
      }
    })
    
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('Unbookmark error:', error)
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to remove bookmark'
    }
  }
}

/**
 * Check if article is bookmarked
 * @param {string} articleId - Article ID
 * @returns {Promise<Object>} Bookmark status
 */
export const checkBookmark = async (articleId) => {
  try {
    // GET request, no CSRF token needed
    const response = await apiClient.get(`/articles/${articleId}/bookmark/`) 
    return {
      success: true,
      bookmarked: response.data.bookmarked
    }
  } catch (error) {
    console.error('Check bookmark error:', error)
    return {
      success: false,
      bookmarked: false
    }
  }
}

export default apiClient