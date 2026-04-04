import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

export function RequireAdmin({ children }) {
  const { user } = useAuth()

  if (!user?.globalRole) {
    return <Navigate to="/app/groups" replace />
  }

  if (user.globalRole !== "ADMIN") {
    return <Navigate to="/app/groups" replace />
  }

  return children
}

