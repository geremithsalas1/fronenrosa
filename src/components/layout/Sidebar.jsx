import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Shield, Route, Bird, Eye, Flower2,
  Flame, Sprout, Handshake, BarChart3, Users, Leaf, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePermisos } from '../../context/PermisosContext'

const navItems = [
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard',          modulo: null },
  { to: '/areas',             icon: Shield,          label: 'Áreas Resguardadas', modulo: 'areas' },
  { to: '/parques',           icon: Route,           label: 'Rondas',             modulo: 'rondas' },
  { to: '/fauna',             icon: Bird,            label: 'Fauna',              modulo: 'fauna' },
  { to: '/fauna-seguimiento', icon: Eye,             label: 'Seguimiento Fauna',  modulo: 'fauna_seg' },
  { to: '/flora',             icon: Flower2,         label: 'Flora',              modulo: 'flora' },
  { to: '/incendios',         icon: Flame,           label: 'Incendios Forestales', modulo: 'incendios' },
  { to: '/reforestacion',     icon: Sprout,          label: 'Reforestación',      modulo: 'reforestacion' },
  { to: '/alianzas',          icon: Handshake,       label: 'Alianzas',           modulo: 'alianzas' },
  { to: '/reportes',          icon: BarChart3,       label: 'Reportes',           modulo: 'reportes' },
  { to: '/usuarios',          icon: Users,           label: 'Usuarios',           adminOnly: true },
]

const roleLabel = {
  admin:        'Administrador',
  guardaparque: 'Guardaparque',
  investigador: 'Investigador',
  coordinador:  'Coordinador',
}

const roleBadgeColor = {
  admin:        'bg-blue-500',
  guardaparque: 'bg-green-600',
  investigador: 'bg-purple-500',
  coordinador:  'bg-orange-500',
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth()
  const { puedeLeer } = usePermisos()
  const isAdmin = user?.role === 'admin'

  return (
    <aside className={`fixed left-0 top-0 h-full bg-slate-900 text-white flex flex-col transition-all duration-300 z-40 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Leaf size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-white text-lg leading-none">EcoGestión</span>
            <p className="text-xs text-slate-400 mt-0.5">Sistema Ambiental</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {!collapsed && <p className="text-xs text-slate-500 uppercase tracking-wider px-2 mb-2">Módulos</p>}
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label, modulo, adminOnly }) => {
            // Ocultar si requiere admin y no es admin
            if (adminOnly && !isAdmin) return null
            // Ocultar si el módulo no tiene permiso de lectura
            if (modulo && !puedeLeer(modulo)) return null

            return (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                    ${isActive ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? label : ''}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center p-3 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        {!collapsed && <span className="ml-2 text-sm">Colapsar</span>}
      </button>
    </aside>
  )
}
