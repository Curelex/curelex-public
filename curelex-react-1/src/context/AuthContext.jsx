import { createContext, useContext, useState } from 'react'
import apiClient from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // ✅ FIX: read user from storage on init
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('curelex-current-user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('curelex-token') || null)

  // ✅ FIX: read role from storage on init
  const [userRole, setUserRole] = useState(() => localStorage.getItem('curelex-user-role') || null)

  /**
   * login(user, token, role)
   *
   * Called after a successful login response.
   * Stores everything under consistent key names so that
   * logout() can reliably clear them all.
   *
   * ✅ FIX: role is now always stored — previously DoctorLogin.jsx
   *         was not passing the 3rd argument so userRole was undefined.
   */
  const login = (user, tok, role) => {
    // Ensure the user object always has an `id` field (not just `_id`)
    // so that `doctor.id` is reliable in all components
    const normalizedUser = {
      ...user,
      id: user?.id ?? user?._id ?? null,
    }

    localStorage.setItem('curelex-current-user', JSON.stringify(normalizedUser))
    localStorage.setItem('curelex-token',        tok)
    localStorage.setItem('curelex-user-role',    role || '')

    // Keep legacy keys in sync so any old code that reads them still works
    localStorage.setItem('token',     tok)
    localStorage.setItem('user-role', role || '')

    apiClient.setToken(tok)

    setCurrentUser(normalizedUser)
    setToken(tok)
    setUserRole(role || null)
  }

  /**
   * logout()
   *
   * Clears every key that login() wrote, plus legacy keys,
   * so the next login always starts with a clean slate.
   */
  const logout = () => {
    const keys = [
      'curelex-current-user',
      'curelex-token',
      'curelex-user-role',
      // legacy keys
      'token',
      'currentUser',
      'user-role',
      // doctor-specific stale data
      'doctor-data',
      'doctor-profile-complete',
      'doctor-approved',
      'doctor-is-active',
    ]
    keys.forEach(k => localStorage.removeItem(k))

    apiClient.setToken(null)

    setCurrentUser(null)
    setToken(null)
    setUserRole(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, token, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)