/**
 * Utility functions for transforming and normalizing Article data
 */

/**
 * Normalize an article from the backend to ensure all fields are present
 * @param {Object} article - Raw article from backend
 * @returns {Object} Normalized article
 */
export const normalizeArticle = (article) => {
  return {
    guardian_id: article.guardian_id || article.id,
    section_id: article.section_id || null,
    section_name: article.section_name || article.sectionName || null,
    web_title: article.web_title || article.webTitle || '',
    web_url: article.web_url || article.webUrl || '',
    api_url: article.api_url || article.apiUrl || '',
    headline: article.headline || article.web_title || article.webTitle || '',
    trail_text: article.trail_text || article.trailText || '',
    body_text: article.body_text || article.bodyText || '',
    thumbnail: article.thumbnail || null,
    first_publication_date: article.first_publication_date || article.firstPublicationDate || null,
    last_modified: article.last_modified || article.lastModified || null,
    embedding: article.embedding || null,
    tags: article.tags || [],
    authors: article.authors || []
  }
}

/**
 * Get display title for an article (prefers headline over web_title)
 * @param {Object} article
 * @returns {string}
 */
export const getArticleTitle = (article) => {
  return article.headline || article.web_title || 'Untitled'
}

/**
 * Get display description for an article
 * @param {Object} article
 * @returns {string}
 */
export const getArticleDescription = (article) => {
  return article.trail_text || article.body_text || 'No description available'
}

/**
 * Get category/section name for display
 * @param {Object} article
 * @returns {string}
 */
export const getArticleCategory = (article) => {
  return article.section_name || article.section_id || 'News'
}

/**
 * Format author names for display
 * @param {Array} authors - Array of author objects
 * @returns {string}
 */
export const formatAuthors = (authors) => {
  if (!authors || authors.length === 0) return 'Guardian Staff'
  
  return authors
    .map(author => {
      if (author.webTitle) return author.webTitle
      if (author.firstName && author.lastName) {
        return `${author.firstName} ${author.lastName}`
      }
      return author.firstName || author.lastName || 'Unknown'
    })
    .join(', ')
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  } catch (error) {
    return 'Invalid date'
  }
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    
    return formatDate(dateString)
  } catch (error) {
    return formatDate(dateString)
  }
}

/**
 * Extract tag names from tags array
 * @param {Array} tags
 * @returns {Array<string>}
 */
export const getTagNames = (tags) => {
  if (!tags || tags.length === 0) return []
  return tags.map(tag => tag.webTitle || tag.id || '').filter(Boolean)
}

/**
 * Check if article has a valid thumbnail
 * @param {Object} article
 * @returns {boolean}
 */
export const hasValidThumbnail = (article) => {
  return Boolean(article.thumbnail && article.thumbnail.trim())
}
