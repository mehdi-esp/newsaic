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
    // First, get CSRF token by making a GET request to login page
    const csrfResponse = await apiClient.get('/admin/login/')
    
    // Extract CSRF token from the response
    const csrfToken = csrfResponse.headers['x-csrftoken'] || 
                     document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                     getCSRFToken()
    
    if (!csrfToken) {
      throw new Error('Could not obtain CSRF token')
    }
    
    // Now login with the CSRF token
    const response = await apiClient.post('/admin/login/', {
      username,
      password,
      csrfmiddlewaretoken: csrfToken
    }, {
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'http://localhost:8000/admin/login/'
      },
      // Don't follow redirects automatically
      maxRedirects: 0,
      validateStatus: function (status) {
        // Accept both 200 and 302 (redirect) as success
        return status >= 200 && status < 400
      }
    })
    
    // If we get a 302 redirect, it means login was successful
    if (response.status === 302 || response.status === 200) {
      return {
        success: true,
        data: { message: 'Login successful' }
      }
    }
    
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    // If it's a 404 or redirect error, check if we're actually logged in
    if (error.response?.status === 404 || error.response?.status === 302) {
      // Check if we're actually authenticated by trying to get user profile
      try {
        const authCheck = await checkAuth()
        if (authCheck.isAuthenticated) {
          return {
            success: true,
            data: { message: 'Login successful' }
          }
        }
      } catch (authError) {
        // If auth check fails, login failed
      }
    }
    
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
    
    if (!csrfToken) {
      console.warn('No CSRF token found, forcing logout on client side')
      return {
        success: true,
        data: { detail: 'Client-side logout' }
      }
    }
    
    // Try Django admin logout endpoint first
    const response = await apiClient.post('/admin/logout/', {}, {
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
 * Bookmark an article
 * @param {string} articleId - Article ID
 * @returns {Promise<Object>} Bookmark response
 */
export const bookmarkArticle = async (articleId) => {
  try {
    const csrfToken = await getCSRFToken()
    
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
    const csrfToken = await getCSRFToken()
    
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
