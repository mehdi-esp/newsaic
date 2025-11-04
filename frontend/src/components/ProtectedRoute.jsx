import Login from './Login'

const ProtectedRoute = ({ children, fallback = null, isAuthenticated, isLoading, onLoginSuccess }) => {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (fallback) {
      return fallback
    }
    return <Login onLoginSuccess={onLoginSuccess} />
  }

  return children
}

export default ProtectedRoute