import { fechaMinHoy, soloNombreArea } from '../hooks/useSoloLetras'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react'
import useCrud from '../hooks/useCrud'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { usePermisos } from '../context/PermisosContext'
import { validateArea } from '../utils/validators'

const empty = { nombre: '', latitud: '', longitud: '', extension: '', tipo: '', descripcion: '' }

export default function Areas() {
  const { user } = useAuth()
  const { puedeEscribir, puedeEliminar } = usePermisos()
  const isAdmin = puedeEscribir('areas')
  const { data, loading, create, update, remove } = useCrud('/areas')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [formError, setFormError] = useState('')

  const filtered = data.filter(a => a.nombre?.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setForm(empty); setEditId(null); setFormError(''); setModal('create') }
  const openEdit = (item) => { setForm(item); setEditId(item.id); setFormError(''); setModal('edit') }
  const handleSubmit = async (e) => {
    e.preventDefault()
    const error = validateArea(form)
    if (error) return setFormError(error)
    try {
      if (modal === 'create') await create(form)
      else await update(editId, form)
      setModal(null)
    } catch (err) {
      setFormError(err.response?.data?.message || err.message)
    }
  }

  const field = (key, label, opts = {}) => {
    const handleChange = (e) => {
      let val = e.target.value
      if (opts.filter) val = opts.filter(val)
      setForm({ ...form, [key]: val })
    }
    return (
      <div key={key}>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}{opts.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          type={opts.type || 'text'}
          required={!!opts.required}
          step={opts.step}
          min={opts.min}
          max={opts.max}
          maxLength={opts.maxLength}
          value={form[key] ?? ''}
          onChange={handleChange}
          placeholder={opts.placeholder || ''}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {opts.help && <p className="mt-1 text-xs text-slate-500">{opts.help}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Áreas Resguardadas</h1>
          <p className="text-slate-500 text-sm mt-1">{data.length} áreas registradas</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Nueva área
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar areas..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Cargando...</div> :
          filtered.length === 0 ? <div className="p-8 text-center text-slate-400">No hay áreas registradas</div> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Nombre', 'Coordenadas', 'Extensión (ha)', 'Tipo', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.latitud && item.longitud
                        ? <span className="font-mono text-xs">{item.latitud}, {item.longitud}</span>
                        : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.extension ? `${Number(item.extension).toLocaleString()} ha` : '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{item.tipo || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setViewItem(item)} title="Ver detalle" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><Eye size={15} /></button>
                        {isAdmin && <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>}
                        {isAdmin && puedeEliminar('areas') && <button onClick={() => setConfirmId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Nueva Área Resguardada' : 'Editar Área'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{formError}</div>}
            {field('nombre', 'Nombre', { required: true, filter: soloNombreArea, maxLength: 80, placeholder: 'Ej: Parque Nacional La Selva', help: 'Ingresa el nombre oficial del área protegida. Solo se permiten letras y espacios.' })}
            <div className="grid grid-cols-2 gap-3">
              {field('latitud',  'Latitud',  { type: 'number', step: 'any', min: '-90',  max: '90',  placeholder: '-4.1234567', help: 'Coordenada en grados decimales, de -90 a 90.' })}
              {field('longitud', 'Longitud', { type: 'number', step: 'any', min: '-180', max: '180', placeholder: '-74.1234567', help: 'Coordenada en grados decimales, de -180 a 180.' })}
            </div>
            {field('extension', 'Extensión (hectáreas)', { type: 'number', step: '0.01', min: '0', placeholder: 'Ej: 1250.50', help: 'Superficie total del área en hectáreas. Usa decimales si es necesario.' })}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de área</label>
              <select value={form.tipo || ''} onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar...</option>
                <option>Parque nacional</option>
                <option>Reserva natural</option>
                <option>Zona protegida</option>
                <option>Área de conservación</option>
                <option>Santuario de fauna</option>
                <option>Páramo</option>
                <option>Otro</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">Selecciona la categoría que mejor describe la protección o el uso del área.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción <span className="text-slate-400 font-normal">(opcional)</span></label>
              <textarea rows={3} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej: Área protegida con bosque alto y corredores de fauna"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <p className="mt-1 text-xs text-slate-500">Describe brevemente el área. Puedes mencionar paisaje, especies o condiciones especiales.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">{modal === 'create' ? 'Crear' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
      {viewItem && (
        <Modal title="Detalle del área" onClose={() => setViewItem(null)}>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{viewItem.nombre}</h3>
              <p className="text-sm text-slate-500">{viewItem.tipo || 'Sin tipo'}</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-700">
              <div><span className="font-medium text-slate-900">Coordenadas:</span> {viewItem.latitud && viewItem.longitud ? `${viewItem.latitud}, ${viewItem.longitud}` : 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Extensión:</span> {viewItem.extension ? `${Number(viewItem.extension).toLocaleString()} ha` : 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Descripción:</span> {viewItem.descripcion || 'No hay descripción'}</div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewItem(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">Cerrar</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message="¿Eliminar esta área? Se eliminarán también sus rondas asociadas." onConfirm={() => { remove(confirmId); setConfirmId(null) }} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}
