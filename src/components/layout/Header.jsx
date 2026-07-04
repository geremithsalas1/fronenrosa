import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, User, LogOut, Check, CheckCheck, Monitor } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const navigate = useNavigate()
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const goTo = (path) => { setShowProfile(false); navigate(path) }

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 sticky top-0 z-30">
      <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 transition-colors">
        <Menu size={20} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false) }}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Notificaciones</span>
                <button onClick={markAllAsRead} className="text-xs text-green-600 hover:text-green-700 dark:text-green-300 dark:hover:text-green-200 flex items-center gap-1">
                  <CheckCheck size={14} /> Leer todas
                </button>
              </div>
              <ul className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-400">Sin notificaciones</li>
                ) : notifications.map(n => (
                  <li key={n.id} onClick={() => markAsRead(n.id)}
                    className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${!n.read ? 'bg-green-50 dark:bg-green-900/20' : 'bg-transparent'} hover:bg-slate-50 dark:hover:bg-slate-800`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-green-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{n.text}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                    {!n.read && <Check size={14} className="text-green-500 dark:text-green-300 flex-shrink-0 mt-0.5" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Perfil */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false) }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-800 leading-none">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role === 'admin' ? 'Administrador' : user?.role === 'guardaparque' ? 'Guardaparque' : user?.role === 'investigador' ? 'Investigador' : user?.role === 'coordinador' ? 'Coordinador' : user?.role}</p>
            </div>
          </button>
          {showProfile && (
            <div className="absolute right-0 top-12 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-1">
              <button onClick={() => goTo('/perfil')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <User size={16} /> Mi perfil
              </button>
              <button onClick={() => goTo('/configuracion')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Monitor size={16} /> Configuración
              </button>
              <hr className="my-1 border-slate-100" />
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
