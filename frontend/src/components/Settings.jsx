import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, updateProfile, updatePersona, updateSectionPreferences } from '../services/authService'

const Settings = ({ user: initialUser, onUpdate }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(initialUser)
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    gender: '',
    birthday: ''
  })
  const [personaData, setPersonaData] = useState({
    tone: '',
    style: '',
    length: '',
    extra_instructions: ''
  })
  const [sections, setSections] = useState([])
  const [loadingSections, setLoadingSections] = useState(true)
  const [preferredSections, setPreferredSections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPersona, setIsSavingPersona] = useState(false)
  const [isSavingSections, setIsSavingSections] = useState(false)
  const [error, setError] = useState('')
  const [personaError, setPersonaError] = useState('')
  const [sectionsError, setSectionsError] = useState('')
  const [success, setSuccess] = useState('')
  const [personaSuccess, setPersonaSuccess] = useState('')
  const [sectionsSuccess, setSectionsSuccess] = useState('')

  useEffect(() => {
    loadUserData()
    fetchSections()
  }, [])

  const fetchSections = async () => {
    setLoadingSections(true)
    try {
      const response = await fetch('http://localhost:8000/sections/')
      const data = await response.json()
      // Handle paginated response from DRF - extract results array
      const sectionsList = data.results || data || []
      setSections(sectionsList)
    } catch (err) {
      console.error('Error fetching sections:', err)
      setSectionsError('Failed to load sections. Please refresh the page.')
    } finally {
      setLoadingSections(false)
    }
  }

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        gender: user.gender || '',
        birthday: user.birthday ? user.birthday.split('T')[0] : ''
      })
      if (user.persona) {
        setPersonaData({
          tone: user.persona.tone || '',
          style: user.persona.style || '',
          length: user.persona.length || '',
          extra_instructions: user.persona.extra_instructions || ''
        })
      }
      if (user.preferred_sections) {
        // Convert preferred sections to array of section_id strings
        const sectionIds = user.preferred_sections.map(section => section.section_id || section)
        setPreferredSections(sectionIds)
      }
    }
  }, [user])

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      const result = await getCurrentUser()
      if (result.success) {
        setUser(result.user)
      } else {
        setError('Failed to load user data')
      }
    } catch (err) {
      setError('An error occurred while loading your profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
    setSuccess('')
  }

  const handlePersonaChange = (e) => {
    const { name, value } = e.target
    setPersonaData(prev => ({
      ...prev,
      [name]: value
    }))
    setPersonaError('')
    setPersonaSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateProfile(formData)
      
      if (result.success) {
        setUser(result.user)
        setSuccess('Profile updated successfully!')
        if (onUpdate) {
          onUpdate(result.user)
        }
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        // Handle validation errors
        if (result.error && typeof result.error === 'object') {
          const errorMessages = Object.entries(result.error)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n')
          setError(errorMessages)
        } else {
          setError(result.error || 'Failed to update profile')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePersonaSubmit = async (e) => {
    e.preventDefault()
    setIsSavingPersona(true)
    setPersonaError('')
    setPersonaSuccess('')

    try {
      const result = await updatePersona(personaData)
      
      if (result.success) {
        // Reload user data to get updated persona
        const userResult = await getCurrentUser()
        if (userResult.success) {
          setUser(userResult.user)
          if (onUpdate) {
            onUpdate(userResult.user)
          }
        }
        setPersonaSuccess('Content preferences updated successfully!')
        setTimeout(() => setPersonaSuccess(''), 3000)
      } else {
        if (result.error && typeof result.error === 'object') {
          const errorMessages = Object.entries(result.error)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n')
          setPersonaError(errorMessages)
        } else {
          setPersonaError(result.error || 'Failed to update content preferences')
        }
      }
    } catch (err) {
      setPersonaError('An unexpected error occurred')
    } finally {
      setIsSavingPersona(false)
    }
  }

  const handleSectionToggle = (sectionId) => {
    setPreferredSections(prev => {
      const isSelected = prev.includes(sectionId)
      
      if (isSelected) {
        // Don't allow removing if it's the last section
        if (prev.length <= 1) {
          setSectionsError('At least one section must be selected')
          return prev
        }
        setSectionsError('')
        return prev.filter(id => id !== sectionId)
      } else {
        setSectionsError('')
        return [...prev, sectionId]
      }
    })
    setSectionsSuccess('')
  }

  const handleSectionsSubmit = async (e) => {
    e.preventDefault()
    setIsSavingSections(true)
    setSectionsError('')
    setSectionsSuccess('')

    // Validation
    if (preferredSections.length === 0) {
      setSectionsError('Please select at least one preferred section')
      setIsSavingSections(false)
      return
    }

    try {
      // Convert section IDs to format expected by backend (array of objects with section_id)
      const sectionsData = preferredSections.map(sectionId => ({
        section_id: sectionId
      }))

      const result = await updateSectionPreferences(sectionsData)
      
      if (result.success) {
        // Reload user data to get updated sections
        const userResult = await getCurrentUser()
        if (userResult.success) {
          setUser(userResult.user)
          if (onUpdate) {
            onUpdate(userResult.user)
          }
        }
        setSectionsSuccess('Preferred sections updated successfully!')
        setTimeout(() => setSectionsSuccess(''), 3000)
      } else {
        if (result.error && typeof result.error === 'object') {
          const errorMessages = Object.entries(result.error)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n')
          setSectionsError(errorMessages)
        } else {
          setSectionsError(result.error || 'Failed to update preferred sections')
        }
      }
    } catch (err) {
      setSectionsError('An unexpected error occurred')
    } finally {
      setIsSavingSections(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your personal information and preferences</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Personal Information
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
                  Birthday
                </label>
                <input
                  id="birthday"
                  name="birthday"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.birthday}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Account Information
              </h2>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Content Preferences (Persona) */}
          <form onSubmit={handlePersonaSubmit} className="mt-8 space-y-6 border-t pt-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Content Preferences
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Customize how your news articles are written and presented
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                    Tone
                  </label>
                  <select
                    id="tone"
                    name="tone"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={personaData.tone}
                    onChange={handlePersonaChange}
                  >
                    <option value="">Select tone</option>
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-1">
                    Style
                  </label>
                  <select
                    id="style"
                    name="style"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={personaData.style}
                    onChange={handlePersonaChange}
                  >
                    <option value="">Select style</option>
                    <option value="concise">Concise</option>
                    <option value="detailed">Detailed</option>
                    <option value="balanced">Balanced</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">
                    Length
                  </label>
                  <select
                    id="length"
                    name="length"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={personaData.length}
                    onChange={handlePersonaChange}
                  >
                    <option value="">Select length</option>
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="extra_instructions" className="block text-sm font-medium text-gray-700 mb-1">
                  Extra Instructions (Optional)
                </label>
                <textarea
                  id="extra_instructions"
                  name="extra_instructions"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={personaData.extra_instructions}
                  onChange={handlePersonaChange}
                  placeholder="Any additional instructions for how you'd like your news to be written..."
                />
              </div>
            </div>

            {personaError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600 whitespace-pre-line">{personaError}</p>
              </div>
            )}

            {personaSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-600">{personaSuccess}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSavingPersona}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingPersona ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Content Preferences'
                )}
              </button>
            </div>
          </form>

          {/* Preferred Sections */}
          <form onSubmit={handleSectionsSubmit} className="mt-8 space-y-6 border-t pt-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Preferred Sections
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Select the news categories you're interested in (at least one required)
              </p>
              
              {loadingSections ? (
                <p className="text-sm text-gray-500">Loading sections...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-4">
                  {sections.map(section => {
                    const sectionId = section.section_id || section.id
                    const isSelected = preferredSections.includes(sectionId)
                    return (
                      <label key={sectionId} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSectionToggle(sectionId)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{section.web_title || section.section_name}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {sectionsError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600 whitespace-pre-line">{sectionsError}</p>
              </div>
            )}

            {sectionsSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-600">{sectionsSuccess}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSavingSections || preferredSections.length === 0}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingSections ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Preferred Sections'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Settings

