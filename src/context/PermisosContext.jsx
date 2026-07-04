import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const PermisosContext = createContext({})

export function PermisosProvider({ children }) {
  const { user } = useAuth()
  const [permisos, setPermisos] = useState({})

  useEffect(() => {
    if (!user) { setPermisos({}); return }
    api.get('/mis-permisos')
      .then(r => setPermisos(r.data))
      .catch(() => setPermisos({}))
  }, [user])

  const puede = (modulo, accion = 'read') => {
    return permisos[modulo]?.includes(accion) ?? false
  }

  const puedeEscribir = (modulo) => puede(modulo, 'write')
  const puedeEliminar = (modulo) => puede(modulo, 'delete')
  const puedeLeer    = (modulo) => puede(modulo, 'read')

  return (
    <PermisosContext.Provider value={{ permisos, puede, puedeEscribir, puedeEliminar, puedeLeer }}>
      {children}
    </PermisosContext.Provider>
  )
}

export const usePermisos = () => useContext(PermisosContext)
