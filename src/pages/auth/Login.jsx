import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [recoverMode, setRecoverMode] = useState(false)
  const [recoverForm, setRecoverForm] = useState({ email: '', password: '', confirm: '' })
  const [recoverError, setRecoverError] = useState('')
  const [recoverSuccess, setRecoverSuccess] = useState('')
  const [recoverLoading, setRecoverLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverSubmit = async (e) => {
    e.preventDefault()
    setRecoverError('')
    setRecoverSuccess('')
    if (recoverForm.password !== recoverForm.confirm) {
      setRecoverError('Las contraseñas no coinciden')
      return
    }
    setRecoverLoading(true)
    try {
      await api.post('/auth/forgot', {
        email: recoverForm.email,
        password: recoverForm.password,
      })
      setRecoverSuccess('Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.')
      setForm({ email: recoverForm.email, password: '' })
      setRecoverForm({ email: '', password: '', confirm: '' })
      setRecoverMode(false)
    } catch (err) {
      setRecoverError(err.response?.data?.message || 'Error al recuperar la contraseña')
    } finally {
      setRecoverLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/bosque.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Card blanca sólida */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        {/* Logo y nombre */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-md mb-3">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">EcoGestión</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de Gestión Ambiental</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {recoverSuccess && !recoverMode && (
          <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            {recoverSuccess}
          </div>
        )}

        {recoverMode ? (
          <form onSubmit={handleRecoverSubmit} className="space-y-4">
            {recoverError && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {recoverError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                required
                value={recoverForm.email}
                onChange={e => setRecoverForm({ ...recoverForm, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="correo@ejemplo.com"
              />
              <p className="mt-1 text-xs text-slate-500">Ingresa el correo asociado a tu cuenta.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={recoverForm.password}
                  onChange={e => setRecoverForm({ ...recoverForm, password: e.target.value })}
                  className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Mínimo 8 caracteres"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Usa una contraseña segura con números y letras.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={recoverForm.confirm}
                onChange={e => setRecoverForm({ ...recoverForm, confirm: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Repite tu nueva contraseña"
              />
            </div>
            <button
              type="submit"
              disabled={recoverLoading}
              className="w-full py-3 mt-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {recoverLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
            <div className="text-center text-sm text-slate-500 mt-2">
              <button type="button" onClick={() => { setRecoverMode(false); setRecoverError(''); setRecoverSuccess('') }}
                className="text-green-600 hover:text-green-700 font-medium">
                Volver al login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="correo@ejemplo.com"
              />
              <p className="mt-1 text-xs text-slate-500">Introduce el correo asociado a tu cuenta.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Usa tu contraseña habitual para acceder al sistema.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            <div className="text-center text-sm text-slate-500 mt-2">
              <button type="button" onClick={() => { setRecoverMode(true); setRecoverError(''); setRecoverSuccess('') }}
                className="text-green-600 hover:text-green-700 font-medium">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
