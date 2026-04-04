import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }) {
  const { tokens } = useAuth()
  const location = useLocation()

  if (!tokens?.accessToken) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  return children
}

