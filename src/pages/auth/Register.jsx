import { soloLetras } from '../../hooks/useSoloLetras'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Leaf, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombres: '', apellidos: '', documento: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Enviamos 'name' para compatibilidad con el backend (nombres + apellidos)
      await register({
        name: `${form.nombres} ${form.apellidos}`.trim(),
        nombres: form.nombres,
        apellidos: form.apellidos,
        documento: form.documento,
        email: form.email,
        password: form.password,
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundImage: 'url(/bosque.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-md mb-3">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">EcoGestión</h1>
          <p className="text-slate-400 text-sm mt-1">Crear nueva cuenta</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombres <span className="text-red-500">*</span></label>
              <input type="text" required value={form.nombres}
                onChange={e => setForm({ ...form, nombres: soloLetras(e.target.value) })} maxLength={40}
                className={inputCls} placeholder="Tus nombres" />
              <p className="mt-1 text-xs text-slate-500">Ingresa tu nombre tal como aparece en tu documento.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Apellidos <span className="text-red-500">*</span></label>
              <input type="text" required value={form.apellidos}
                onChange={e => setForm({ ...form, apellidos: soloLetras(e.target.value) })} maxLength={40}
                className={inputCls} placeholder="Tus apellidos" />
              <p className="mt-1 text-xs text-slate-500">Ingresa tus apellidos completos.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cédula / Documento <span className="text-red-500">*</span></label>
            <input type="text" required inputMode="numeric" pattern="[0-9]{5,15}"
              value={form.documento}
              onChange={e => setForm({ ...form, documento: e.target.value.replace(/\D/g, '') })}
              className={inputCls} placeholder="Solo números" />
            <p className="mt-1 text-xs text-slate-500">Ingresa solo números, sin puntos ni guiones.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico <span className="text-red-500">*</span></label>
            <input type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className={inputCls} placeholder="correo@ejemplo.com" />
            <p className="mt-1 text-xs text-slate-500">Usa un correo válido para recibir notificaciones.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={`${inputCls} pr-11`} placeholder="Mínimo 6 caracteres" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Crea una contraseña segura de al menos 6 caracteres.</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 mt-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm">
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
