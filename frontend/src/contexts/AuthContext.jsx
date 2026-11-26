import { createContext, useContext, useState, useCallback } from 'react'
import apiClient from '../api/client.js'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('urbaneye-user') || 'null') } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const res = await apiClient.post('/auth/login', {
      username: email.trim(),
      email: email.trim(),
      password
    })
    const { access_token, user: userData } = res.data
    localStorage.setItem('urbaneye-token', access_token)
    localStorage.setItem('urbaneye-user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('urbaneye-token')
    localStorage.removeItem('urbaneye-user')
    setUser(null)
  }, [])

  const demoLogin = useCallback(() => {
    const demoUser = { id: 0, email: 'demo@urbaneye.gov.in', full_name: 'Demo Official', role: 'analyst' }
    localStorage.setItem('urbaneye-user', JSON.stringify(demoUser))
    localStorage.setItem('urbaneye-token', 'demo-token')
    setUser(demoUser)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
