import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { PermisosProvider } from './context/PermisosContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Areas from './pages/Areas'
import Parques from './pages/Parques'
import Fauna from './pages/Fauna'
import FaunaSeguimiento from './pages/FaunaSeguimiento'
import Flora from './pages/Flora'
import Incendios from './pages/Incendios'
import Reforestacion from './pages/Reforestacion'
import Alianzas from './pages/Alianzas'
import Reportes from './pages/Reportes'
import Usuarios from './pages/Usuarios'
import Perfil from './pages/Perfil'
import Configuracion from './pages/Configuracion'

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermisosProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/areas" element={<AppLayout><Areas /></AppLayout>} />
              <Route path="/parques" element={<AppLayout><Parques /></AppLayout>} />
              <Route path="/fauna" element={<AppLayout><Fauna /></AppLayout>} />
              <Route path="/fauna-seguimiento" element={<AppLayout><FaunaSeguimiento /></AppLayout>} />
              <Route path="/flora" element={<AppLayout><Flora /></AppLayout>} />
              <Route path="/incendios" element={<AppLayout><Incendios /></AppLayout>} />
              <Route path="/reforestacion" element={<AppLayout><Reforestacion /></AppLayout>} />
              <Route path="/alianzas" element={<AppLayout><Alianzas /></AppLayout>} />
              <Route path="/reportes" element={<AppLayout><Reportes /></AppLayout>} />
              <Route path="/usuarios" element={<AdminRoute><DashboardLayout><Usuarios /></DashboardLayout></AdminRoute>} />
              <Route path="/perfil" element={<AppLayout><Perfil /></AppLayout>} />
              <Route path="/configuracion" element={<AppLayout><Configuracion /></AppLayout>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </NotificationProvider>
        </PermisosProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
