import { useState, useEffect } from 'react'
import { Leaf, Moon, Sun, Monitor, Bell, Shield, Save } from 'lucide-react'
import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

export default function Configuracion() {
  const { user } = useAuth()
  const [tema, setTema] = useState(() => {
    const stored = localStorage.getItem('eco_config')
    if (stored) {
      try { return JSON.parse(stored).tema || localStorage.getItem('theme') || 'light' } catch { }
    }
    return localStorage.getItem('theme') || 'light'
  })
  const [notifEmail, setNotifEmail] = useState(() => {
    const stored = localStorage.getItem('eco_config')
    if (stored) {
      try { return JSON.parse(stored).notifEmail ?? true } catch { }
    }
    return true
  })
  const [notifSistema, setNotifSistema] = useState(() => {
    const stored = localStorage.getItem('eco_config')
    if (stored) {
      try { return JSON.parse(stored).notifSistema ?? true } catch { }
    }
    return true
  })
  const [idioma, setIdioma] = useState(() => {
    const stored = localStorage.getItem('eco_config')
    if (stored) {
      try { return JSON.parse(stored).idioma || 'es' } catch { }
    }
    return 'es'
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (tema === 'dark') {
      root.classList.add('dark')
    } else if (tema === 'light') {
      root.classList.remove('dark')
    } else { // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
    const config = { tema, notifEmail, notifSistema, idioma }
    localStorage.setItem('eco_config', JSON.stringify(config))
    localStorage.setItem('theme', tema)
  }, [tema, notifEmail, notifSistema, idioma])

  const handleSave = () => {
    const config = { tema, notifEmail, notifSistema, idioma }
    localStorage.setItem('eco_config', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const Toggle = ({ value, onChange }) => (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-slate-200'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-1'}`} />
    </button>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Preferencias del sistema</p>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          Configuración guardada correctamente
        </div>
      )}

      {/* Apariencia */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={18} className="text-slate-600" />
          <h2 className="text-base font-semibold text-slate-800">Apariencia</h2>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-slate-600 mb-3">Tema de la interfaz</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'light', label: 'Claro', icon: Sun },
              { key: 'dark', label: 'Oscuro', icon: Moon },
              { key: 'system', label: 'Sistema', icon: Monitor },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTema(key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${tema === key ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Idioma</label>
          <select value={idioma} onChange={e => setIdioma(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">Elige el idioma de la interfaz para tu sesión.</p>
        </div>
      </Card>

      {/* Notificaciones */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-slate-600" />
          <h2 className="text-base font-semibold text-slate-800">Notificaciones</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Notificaciones del sistema', desc: 'Alertas de incendios, alianzas vencidas y actividad', value: notifSistema, onChange: setNotifSistema },
            { label: 'Notificaciones por email', desc: 'Recibir resúmenes y alertas en tu correo', value: notifEmail, onChange: setNotifEmail },
          ].map(({ label, desc, value, onChange }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
              <Toggle value={value} onChange={onChange} />
            </div>
          ))}
        </div>
      </Card>

      {/* Info cuenta */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-slate-600" />
          <h2 className="text-base font-semibold text-slate-800">Información de cuenta</h2>
        </div>
        <div className="space-y-2 text-sm">
          {[
            { label: 'Usuario', value: user?.name },
            { label: 'Correo', value: user?.email },
            { label: 'Rol', value: user?.role === 'admin' ? 'Administrador' : user?.role === 'guardaparque' ? 'Guardaparque' : user?.role === 'investigador' ? 'Investigador' : user?.role === 'coordinador' ? 'Coordinador' : user?.role },
            { label: 'Sistema', value: 'EcoGestión v2.0' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">{label}</span>
              <span className="font-medium text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <button onClick={handleSave}
        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
        <Save size={15} /> Guardar configuración
      </button>
    </div>
  )
}
