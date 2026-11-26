import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [isDemoMode, setIsDemoMode] = useState(true)

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000)
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <AppContext.Provider value={{ notifications, addNotification, removeNotification, isDemoMode, setIsDemoMode }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
