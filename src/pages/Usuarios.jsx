import { soloLetras } from '../hooks/useSoloLetras'
import { validateUsuario } from '../utils/validators'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, UserCheck, UserX } from 'lucide-react'
import useCrud from '../hooks/useCrud'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import { Users, ShieldCheck, UserMinus } from 'lucide-react'
import api from '../services/api'

const empty = { name: '', apellidos: '', tipo_documento: 'V', documento: '', telefono: '', email: '', password: '', role: 'guardaparque', active: true }

export default function Usuarios() {
  const { data, loading, create, update, remove, refetch } = useCrud('/users')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [formError, setFormError] = useState('')

  const filtered = data.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const activos = data.filter(u => u.active).length
  const admins = data.filter(u => u.role === 'admin').length
  const openCreate = () => { setForm(empty); setFormError(''); setModal('create') }
  const openEdit = (item) => { setForm({ ...item, password: '', apellidos: item.apellidos || '', tipo_documento: item.tipo_documento || 'V', documento: item.documento || '', telefono: item.telefono || '' }); setEditId(item.id); setFormError(''); setModal('edit') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const error = validateUsuario(form, modal === 'create')
    if (error) return setFormError(error)
    setFormError('')
    const payload = { ...form }
    if (modal === 'edit' && !payload.password) delete payload.password
    try {
      if (modal === 'create') await create(payload)
      else await update(editId, payload)
      setModal(null)
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Error al guardar el usuario')
    }
  }

  const toggleActive = async (item) => {
    await api.put(`/users/${item.id}`, { ...item, active: !item.active })
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-1">{data.length} usuarios registrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total usuarios" value={data.length} color="blue" />
        <StatCard icon={UserCheck} label="Activos" value={activos} color="green" />
        <StatCard icon={ShieldCheck} label="Administradores" value={admins} color="purple" />
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuarios..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Cargando...</div> :
          filtered.length === 0 ? <div className="p-8 text-center text-slate-400">No hay usuarios</div> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Nombre', 'Documento', 'Correo', 'Rol', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                          {item.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{item.name}</p>
                          {item.apellidos && <p className="text-xs text-slate-400">{item.apellidos}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{item.tipo_documento && item.documento ? `${item.tipo_documento}-${item.documento}` : item.documento || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{item.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={
                          item.role === 'admin' ? 'Administrador' :
                          item.role === 'guardaparque' ? 'Guardaparque' :
                          item.role === 'investigador' ? 'Investigador' :
                          item.role === 'coordinador' ? 'Coordinador' : item.role
                        }
                        variant={
                          item.role === 'admin' ? 'blue' :
                          item.role === 'guardaparque' ? 'green' :
                          item.role === 'investigador' ? 'purple' : 'yellow'
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={item.active ? 'Activo' : 'Inactivo'} variant={item.active ? 'green' : 'gray'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleActive(item)} title={item.active ? 'Desactivar' : 'Activar'}
                          className={`p-1.5 rounded-lg transition-colors ${item.active ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'}`}>
                          {item.active ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                        <button onClick={() => setConfirmId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{formError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombres <span className="text-red-500">*</span></label>
                <input type="text" required value={form.name || ''} onChange={e => setForm({ ...form, name: soloLetras(e.target.value) })} maxLength={40}
                  placeholder="Ej: Juan Carlos"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos</label>
                <input type="text" value={form.apellidos || ''} onChange={e => setForm({ ...form, apellidos: soloLetras(e.target.value) })} maxLength={40}
                  placeholder="Ej: Pérez Gómez"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="mt-1 text-xs text-slate-500">Apellidos del usuario, si aplica.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo documento</label>
                <select value={form.tipo_documento || 'V'} onChange={e => setForm({ ...form, tipo_documento: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="V">V - Venezolano</option>
                  <option value="E">E - Extranjero</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Cédula / Documento</label>
                <input type="text" inputMode="numeric" pattern="[0-9]{5,15}"
                  value={form.documento || ''}
                  onChange={e => setForm({ ...form, documento: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Solo números" />
                <p className="mt-1 text-xs text-slate-500">Documento de identidad sin puntos ni guiones.</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input type="tel" inputMode="numeric" pattern="[0-9+\-\s]{7,15}"
                value={form.telefono || ''}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: 3001234567" />
              <p className="mt-1 text-xs text-slate-500">Teléfono de contacto opcional para el usuario.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo <span className="text-red-500">*</span></label>
              <input type="email" required value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <p className="mt-1 text-xs text-slate-500">Correo electrónico usado para iniciar sesión y recibir notificaciones.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {modal === 'edit' ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              </label>
              <input type="password" required={modal === 'create'} value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <p className="mt-1 text-xs text-slate-500">Contraseña segura de al menos 8 caracteres.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="admin">Administrador</option>
                <option value="guardaparque">Guardaparque</option>
                <option value="investigador">Investigador / Biólogo</option>
                <option value="coordinador">Coordinador</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">Rol del usuario dentro del sistema.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">{modal === 'create' ? 'Crear' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message="¿Eliminar este usuario??" onConfirm={() => { remove(confirmId); setConfirmId(null) }} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}
