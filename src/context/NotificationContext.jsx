import { createContext, useContext, useState } from 'react'

const NotificationContext = createContext(null)

const initialNotifications = [
  { id: 1, text: 'Nueva área resguardada registrada', time: 'Hace 5 min', read: false },
  { id: 2, text: 'Incendio forestal actualizado a Controlado', time: 'Hace 20 min', read: false },
  { id: 3, text: 'Alianza con ONG Verde vence en 7 días', time: 'Hace 1 hora', read: false },
  { id: 4, text: 'Reforestación completada en Zona Norte', time: 'Hace 2 horas', read: true },
]

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const addNotification = (text) => {
    const newN = { id: Date.now(), text, time: 'Ahora', read: false }
    setNotifications(prev => [newN, ...prev])
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
