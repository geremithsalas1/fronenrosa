import { soloLetras, fechaMinHoy } from '../hooks/useSoloLetras'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Calendar, Eye } from 'lucide-react'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import { usePermisos } from '../context/PermisosContext'
import api from '../services/api'
import useCatalogo from '../hooks/useCatalogo'
import useCrud from '../hooks/useCrud'
import { validateAlianza } from '../utils/validators'

const empty = {
  organizacion: '', tipo: '', contacto: '', email: '',
  fecha_inicio: '', fecha_fin: '', descripcion: ''
}

const calcEstado = (fecha_fin) => {
  if (!fecha_fin) return 'Activa'
  return new Date(fecha_fin) < new Date() ? 'Vencida' : 'Activa'
}

const addYears = (fecha, years) => {
  if (!fecha) return ''
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return ''
  date.setFullYear(date.getFullYear() + years)
  return date.toISOString().split('T')[0]
}

function ExtenderModal({ alianza, onClose, onSave }) {
  const [fecha_fin, setFechaFin] = useState(alianza.fecha_fin?.split('T')[0] || '')
  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.put(`/alianzas/${alianza.id}`, { ...alianza, fecha_fin })
    onSave()
    onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Extender vigencia</h3>
        <p className="text-sm text-slate-500 mb-4">{alianza.organizacion}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nueva fecha de fin</label>
            <input type="date" min={fechaMinHoy()} max={addYears(alianza.fecha_inicio?.split('T')[0] || '', 10)} required value={fecha_fin} onChange={e => setFechaFin(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Alianzas() {
  const { puedeEscribir } = usePermisos()
  const isAdmin = puedeEscribir('alianzas')
  const { data, loading, refetch } = useCrud('/alianzas')
  const { data: tiposAlianza } = useCatalogo('/catalogos/tipos-alianza')
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [extenderItem, setExtenderItem] = useState(null)
  const [formError, setFormError] = useState('')

  const filtered = data.filter(a => {
    const matchSearch =
      a.organizacion?.toLowerCase().includes(search.toLowerCase()) ||
      a.contacto?.toLowerCase().includes(search.toLowerCase())
    const estado = calcEstado(a.fecha_fin)
    const matchEstado = filtroEstado === 'todos' || estado === filtroEstado
    return matchSearch && matchEstado
  })

  const activas = data.filter(a => calcEstado(a.fecha_fin) === 'Activa').length
  const vencidas = data.filter(a => calcEstado(a.fecha_fin) === 'Vencida').length

  const openCreate = () => { setForm(empty); setEditId(null); setFormError(''); setModal('create') }
  const openEdit = (item) => {
    setFormError('')
    setForm({
      organizacion: item.organizacion || '',
      tipo: item.tipo || '',
      contacto: item.contacto || '',
      email: item.email || '',
      fecha_inicio: item.fecha_inicio?.split('T')[0] || '',
      fecha_fin: item.fecha_fin?.split('T')[0] || '',
      descripcion: item.descripcion || ''
    })
    setEditId(item.id)
    setModal('edit')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const error = validateAlianza(form)
    if (error) return setFormError(error)
    setFormError('')
    if (modal === 'create') await api.post('/alianzas', form)
    else await api.put(`/alianzas/${editId}`, form)
    await refetch()
    setModal(null)
  }

  const handleDelete = async (id) => {
    await api.delete(`/alianzas/${id}`)
    await refetch()
    setConfirmId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alianzas</h1>
          <p className="text-slate-500 text-sm mt-1">
            <span className="text-green-600 font-medium">{activas} activas</span>
            {vencidas > 0 && <span className="text-red-500 font-medium ml-2">{vencidas} vencidas</span>}
            <span className="text-slate-400 ml-2">&middot; {data.length} total</span>
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Nueva alianza
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por organizacion o contacto..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
          <option value="todos">Todos</option>
          <option>Activa</option>
          <option>Vencida</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Cargando...</div> :
          filtered.length === 0 ? <div className="p-8 text-center text-slate-400">No hay alianzas registradas</div> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Organizacion', 'Tipo', 'Contacto', 'Email', 'Inicio', 'Fin', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => {
                  const estado = calcEstado(item.fecha_fin)
                  const vencida = estado === 'Vencida'
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 ${vencida ? 'opacity-75' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.organizacion}</td>
                      <td className="px-4 py-3 text-slate-600">{item.tipo || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{item.contacto || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{item.email || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{item.fecha_inicio?.split('T')[0] || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{item.fecha_fin?.split('T')[0] || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge label={estado} variant={vencida ? 'red' : 'green'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setViewItem(item)} title="Ver detalle" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><Eye size={15} /></button>
                          {isAdmin && vencida && (
                            <button onClick={() => setExtenderItem(item)} title="Extender vigencia"
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"><Calendar size={15} /></button>
                          )}
                          {isAdmin && (
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                          )}
                          {isAdmin && (
                            <button onClick={() => setConfirmId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Nueva Alianza' : 'Editar Alianza'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{formError}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organizacion <span className="text-red-500">*</span></label>
              <input type="text" required value={form.organizacion} onChange={e => setForm({ ...form, organizacion: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Fundación Bosques del Norte" />
              <p className="mt-1 text-xs text-slate-500">Nombre de la organización o entidad que participa en la alianza.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Seleccionar...</option>
                  {tiposAlianza.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                </select>
                <p className="mt-1 text-xs text-slate-500">Selecciona el tipo de alianza si corresponde, por ejemplo convenios o colaboraciones.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contacto</label>
                <input type="text" value={form.contacto} onChange={e => setForm({ ...form, contacto: soloLetras(e.target.value) })} maxLength={40}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Nombre del contacto" />
                <p className="mt-1 text-xs text-slate-500">Nombre de la persona responsable o punto de contacto para la alianza.</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email de contacto</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="contacto@organizacion.com" />
              <p className="mt-1 text-xs text-slate-500">Correo para contactar con la organización o representante.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de inicio</label>
                <input type="date" min={fechaMinHoy()} value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="mt-1 text-xs text-slate-500">Fecha en la que comienza la alianza o colaboración.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de fin</label>
                <input type="date" min={form.fecha_inicio || fechaMinHoy()} max={form.fecha_inicio ? addYears(form.fecha_inicio, 10) : undefined}
                  value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="mt-1 text-xs text-slate-500">Fecha de término esperada de la alianza, si aplica.</p>
              </div>
            </div>
            {form.fecha_fin && (
              <p className={`text-xs px-3 py-2 rounded-lg ${calcEstado(form.fecha_fin) === 'Vencida' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {calcEstado(form.fecha_fin) === 'Vencida'
                  ? 'La fecha de fin ya paso - la alianza quedara como Vencida'
                  : 'La alianza quedara Activa hasta la fecha de fin'}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
              <textarea rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej: Alianza para monitoreo de incendios y restauración forestal"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <p className="mt-1 text-xs text-slate-500">Describe brevemente el objetivo y alcance de la alianza.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">{modal === 'create' ? 'Crear' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {viewItem && (
        <Modal title="Detalle de alianza" onClose={() => setViewItem(null)}>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{viewItem.organizacion}</h3>
              <p className="text-sm text-slate-500">{viewItem.tipo || 'Sin tipo'}</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-700">
              <div><span className="font-medium text-slate-900">Contacto:</span> {viewItem.contacto || 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Email:</span> {viewItem.email || 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Inicio:</span> {viewItem.fecha_inicio?.split('T')[0] || 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Fin:</span> {viewItem.fecha_fin?.split('T')[0] || 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Estado:</span> {calcEstado(viewItem.fecha_fin)}</div>
              <div><span className="font-medium text-slate-900">Descripción:</span> {viewItem.descripcion || 'No hay descripción'}</div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewItem(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">Cerrar</button>
            </div>
          </div>
        </Modal>
      )}

      {extenderItem && (
        <ExtenderModal alianza={extenderItem} onClose={() => setExtenderItem(null)} onSave={refetch} />
      )}

      {confirmId && (
        <ConfirmDialog
          message="¿Eliminar esta alianza??"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
