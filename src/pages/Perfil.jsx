import { soloLetras } from '../hooks/useSoloLetras'
import { useState } from 'react'
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Card from '../components/ui/Card'

export default function Perfil() {
  const { user, login } = useAuth()
  const [tab, setTab] = useState('info')

  const [infoForm, setInfoForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passForm, setPassForm] = useState({ password_actual: '', password_nueva: '', password_confirmar: '' })
  const [showPass, setShowPass] = useState({ actual: false, nueva: false, confirmar: false })
  const [infoMsg, setInfoMsg] = useState(null)
  const [passMsg, setPassMsg] = useState(null)
  const [loading, setLoading] = useState(false)


  const handleInfoSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setInfoMsg(null)
    try {
      await api.put(`/users/${user.id}`, { ...infoForm, role: user.role, active: true })
      localStorage.setItem('eco_user', JSON.stringify({ ...user, name: infoForm.name, email: infoForm.email }))
      setInfoMsg({ type: 'ok', text: 'Información actualizada correctamente' })
    } catch (e) {
      setInfoMsg({ type: 'err', text: e.response?.data?.message || 'Error al actualizar' })
    } finally { setLoading(false) }
  }

  const handlePassSubmit = async (e) => {
    e.preventDefault()
    setPassMsg(null)
    if (passForm.password_nueva !== passForm.password_confirmar) {
      return setPassMsg({ type: 'err', text: 'Las contraseñas nuevas no coinciden' })
    }
    if (passForm.password_nueva.length < 8) {
      return setPassMsg({ type: 'err', text: 'La contraseña debe tener al menos 8 caracteres' })
    }
    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: passForm.password_actual,
        newPassword: passForm.password_nueva,
      })
      setPassMsg({ type: 'ok', text: 'Contraseña actualizada correctamente' })
      setPassForm({ password_actual: '', password_nueva: '', password_confirmar: '' })
    } catch (e) {
      setPassMsg({ type: 'err', text: e.response?.data?.message || 'Contraseña actual incorrecta' })
    } finally { setLoading(false) }
  }

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Mi perfil</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestiona tu información personal y contraseña</p>
      </div>

      {/* Avatar */}
      <Card className="p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-800">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
            user?.role === 'admin' ? 'bg-blue-100 text-blue-700' :
            user?.role === 'guardaparque' ? 'bg-green-100 text-green-700' :
            user?.role === 'investigador' ? 'bg-purple-100 text-purple-700' :
            user?.role === 'coordinador' ? 'bg-orange-100 text-orange-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {user?.role === 'admin' ? 'Administrador' :
             user?.role === 'guardaparque' ? 'Guardaparque' :
             user?.role === 'investigador' ? 'Investigador' :
             user?.role === 'coordinador' ? 'Coordinador' : user?.role}
          </span>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl w-fit">
        {[
          { key: 'info', label: 'Información', icon: User },
          { key: 'pass', label: 'Contraseña', icon: Lock }
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Información personal</h2>
          {infoMsg && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${infoMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {infoMsg.text}
            </div>
          )}
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
              <input type="text" required value={infoForm.name} onChange={e => setInfoForm({ ...infoForm, name: soloLetras(e.target.value) })} maxLength={40} className={inputCls} placeholder="Ej: Juan Carlos" />
              <p className="mt-1 text-xs text-slate-500">Escribe tu nombre completo usando solo letras y espacios.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input type="email" required value={infoForm.email} onChange={e => setInfoForm({ ...infoForm, email: e.target.value })} className={inputCls} placeholder="correo@ejemplo.com" />
              <p className="mt-1 text-xs text-slate-500">Correo usado para iniciar sesión y recibir notificaciones.</p>
            </div>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              <Save size={15} /> {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </Card>
      )}

      {tab === 'pass' && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Cambiar contraseña</h2>
          {passMsg && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${passMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {passMsg.text}
            </div>
          )}
          <form onSubmit={handlePassSubmit} className="space-y-4">
            {[
              { key: 'password_actual', label: 'Contraseña actual', show: 'actual', placeholder: 'Contraseña actual' },
              { key: 'password_nueva', label: 'Nueva contraseña', show: 'nueva', placeholder: 'Mínimo 8 caracteres' },
              { key: 'password_confirmar', label: 'Confirmar nueva contraseña', show: 'confirmar', placeholder: 'Repetir nueva contraseña' },
            ].map(({ key, label, show, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <div className="relative">
                  <input type={showPass[show] ? 'text' : 'password'} required value={passForm[key]}
                    onChange={e => setPassForm({ ...passForm, [key]: e.target.value })}
                    className={`${inputCls} pr-10`} placeholder={placeholder} />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, [show]: !p[show] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass[show] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {key === 'password_actual' && <p className="mt-1 text-xs text-slate-500">Ingresa tu contraseña actual para autorizar el cambio.</p>}
                {key === 'password_nueva' && <p className="mt-1 text-xs text-slate-500">La nueva contraseña debe tener al menos 8 caracteres y ser segura.</p>}
                {key === 'password_confirmar' && <p className="mt-1 text-xs text-slate-500">Repite la nueva contraseña para verificarla.</p>}
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              <Lock size={15} /> {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </Card>
      )}

    </div>
  )
}
