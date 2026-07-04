import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('eco_user')
    const token = localStorage.getItem('eco_token')
    if (stored && token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Refrescar rol desde la BD para evitar tokens desactualizados
      api.get('/mis-permisos')
        .then(() => {
          // El middleware ya validó el token y actualizó el rol en el backend
          // Ahora pedimos el perfil actualizado
          return api.get('/auth/me')
        })
        .then(res => {
          const updated = res.data
          localStorage.setItem('eco_user', JSON.stringify(updated))
          setUser(updated)
        })
        .catch(() => {
          // Si falla, usar el stored pero limpiar si el token es inválido
          setUser(JSON.parse(stored))
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: u } = res.data
    localStorage.setItem('eco_token', token)
    localStorage.setItem('eco_user', JSON.stringify(u))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(u)
    return u
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('eco_token')
    localStorage.removeItem('eco_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
