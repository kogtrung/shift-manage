import { createContext, useContext, useMemo, useState } from 'react'
import { clearAuthTokens, getAuthTokens, getUserInfo, setAuthTokens, extractUserFromToken } from './authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [tokens, setTokensState] = useState(() => getAuthTokens())
  const [user, setUser] = useState(() => getUserInfo())

  const value = useMemo(() => {
    function login(nextTokens) {
      setAuthTokens(nextTokens)
      setTokensState(nextTokens)
      const userInfo = extractUserFromToken(nextTokens.accessToken)
      setUser(userInfo)
    }

    function clearTokens() {
      clearAuthTokens()
      setTokensState(null)
      setUser(null)
    }

    // Keep backwards-compatible `setTokens` alias
    return { tokens, user, setTokens: login, login, clearTokens }
  }, [tokens, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
