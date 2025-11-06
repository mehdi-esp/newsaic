import axios from 'axios'

// Configure axios for Django session authentication
const API_BASE_URL = 'http://localhost:8000'

// Create axios instance with credentials enabled for session auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for Django session authentication
  headers: {
    'Content-Type': 'application/json',
  }
})

/**
 * Get CSRF token from cookies
 * @returns {string} CSRF token
 */
const getCSRFToken = () => {
  // Get CSRF token from cookie
  const name = 'csrftoken'
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

/**
 * Login user with Django session authentication
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Login response
 */
export const login = async (username, password) => {
  try {

    const response = await apiClient.post('/login/', {
      username,
      password
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
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
    const response = await apiClient.post('/logout/', {}, {
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
 * Check if user is authenticated
 * @returns {Promise<Object>} Authentication status
 */
export const checkAuth = async () => {
  try {
    const response = await apiClient.get('/me/')
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
 * Get current user profile
 * @returns {Promise<Object>} User profile
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/me/')
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

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration response
 */
export const register = async (userData) => {
  try {
    const csrfToken = getCSRFToken()
    
    const response = await apiClient.post('/register/', userData, {
      headers: {
        'X-CSRFToken': csrfToken
      }
    })
    
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: error.response?.data || error.message || 'Registration failed'
    }
  }
}

/**
 * Update user profile
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Update response
 */
export const updateProfile = async (userData) => {
  try {
    const csrfToken = getCSRFToken()
    
    const response = await apiClient.patch('/me/', userData, {
      headers: {
        'X-CSRFToken': csrfToken
      }
    })
    
    return {
      success: true,
      user: response.data
    }
  } catch (error) {
    console.error('Update profile error:', error)
    return {
      success: false,
      error: error.response?.data || error.message || 'Failed to update profile'
    }
  }
}

/**
 * Bookmark an article
 * @param {string} url - Article url
 * @returns {Promise<Object>} Bookmark response
 */
export const bookmarkArticle = async (url) => {
  try {
    const csrfToken = await getCSRFToken()
    
    const response = await apiClient.post(`${url}bookmark/`, {}, {
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
 * @param {string} url - Article url
 * @returns {Promise<Object>} Unbookmark response
 */
export const unbookmarkArticle = async (url) => {
  try {
    const csrfToken = await getCSRFToken()
    
    const response = await apiClient.delete(`${url}bookmark/`, {
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
 * @param {string} url - Article url
 * @returns {Promise<Object>} Bookmark status
 */
export const checkBookmark = async (url) => {
  try {
    const response = await apiClient.get(`${url}bookmark/`)
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

/**
 * Get all bookmarks for the current user
 * @returns {Promise<Object>} Bookmarks response with bookmarks array
 */
export const getBookmarks = async () => {
  try {
    const response = await apiClient.get('/bookmarks/')
    // Handle paginated response from DRF - extract results array
    const bookmarks = response.data.results || response.data || []
    return {
      success: true,
      bookmarks: bookmarks
    }
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch bookmarks',
      bookmarks: []
    }
  }
}

export default apiClient
