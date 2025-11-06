import apiClient from './authService'

/**
 * Get daily highlights (stories) for the current user
 * @returns {Promise<Object>} Highlights response with stories array
 */
export const getDailyHighlights = async () => {
  try {
    const response = await apiClient.get('/daily-highlight/')
    // Handle paginated response from DRF
    const stories = response.data.results || response.data || []
    return {
      success: true,
      stories: stories
    }
  } catch (error) {
    console.error('Error fetching daily highlights:', error)
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch highlights',
      stories: []
    }
  }
}

export default { getDailyHighlights }

