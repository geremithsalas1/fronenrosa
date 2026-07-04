import { fechaMinHoy } from '../hooks/useSoloLetras'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Flame, CheckCircle, XCircle, Eye } from 'lucide-react'
import useCatalogo from '../hooks/useCatalogo'
import useCrud from '../hooks/useCrud'
import { validateIncendio } from '../utils/validators'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import { usePermisos } from '../context/PermisosContext'
import api from '../services/api'

const empty = {
  latitud: '', longitud: '', area_id: '', magnitud: '',
  hectareas_afectadas: '', causa_id: '', descripcion: '', fecha: '', hora: ''
}

const estadoVariant = { Activo: 'red', Controlado: 'yellow', Extinguido: 'gray' }

export default function Incendios() {
  const { puedeEscribir } = usePermisos()
  const isAdmin = puedeEscribir('incendios')
  const { data, loading, create, remove, refetch } = useCrud('/incendios')
  const { data: areas } = useCrud('/areas')
  const { data: causas } = useCatalogo('/catalogos/causas-incendio')
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editItem, setEditItem] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [estadoModal, setEstadoModal] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [formError, setFormError] = useState('')

  const filtered = data.filter(i => {
    const matchSearch = search === '' ||
      i.area_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      i.magnitud?.toLowerCase().includes(search.toLowerCase()) ||
      i.causa_nombre?.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || i.estado === filtroEstado
    return matchSearch && matchEstado
  })

  const activos = data.filter(i => i.estado === 'Activo').length

  const openCreate = () => { setForm(empty); setEditItem(null); setFormError(''); setModal('create') }
  const openEdit = (item) => {
    setFormError('')
    setForm({
      ...item,
      latitud: item.latitud || '',
      longitud: item.longitud || '',
      hora: item.hora || '',
      fecha: item.fecha?.split('T')[0] || '',
      causa_id: item.causa_id || ''
    })
    setEditItem(item)
    setModal('edit')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const error = validateIncendio(form)
    if (error) return setFormError(error)
    setFormError('')
    if (modal === 'create') await create(form)
    else await api.put(`/incendios/${editItem.id}`, form)
    await refetch()
    setModal(null)
  }

  const cambiarEstado = async (nuevoEstado) => {
    await api.put(`/incendios/${estadoModal.id}/estado`, { estado: nuevoEstado })
    await refetch()
    setEstadoModal(null)
  }

  const field = (key, label, opts = {}) => (
    <div key={key}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}{opts.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={opts.type || 'text'}
        required={!!opts.required}
        step={opts.step}
        value={form[key] ?? ''}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={opts.placeholder || ''}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      {opts.help && <p className="mt-1 text-xs text-slate-500">{opts.help}</p>}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Incendios Forestales</h1>
          <p className="text-slate-500 text-sm mt-1">
            {activos > 0
              ? <span className="text-red-600 font-medium">{activos} activo{activos > 1 ? 's' : ''}</span>
              : 'Sin incendios activos'
            } &middot; {data.length} total
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Registrar incendio
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por area, magnitud o causa..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
          <option value="todos">Todos</option>
          <option>Activo</option><option>Controlado</option><option>Extinguido</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? <div className="p-8 text-center text-slate-400">Cargando...</div> :
          filtered.length === 0 ? <div className="p-8 text-center text-slate-400">No hay incendios registrados</div> : (
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Coordenadas', 'Área afectada', 'Magnitud', 'Hectareas', 'Causa', 'Fecha', 'Estado', 'Controlado', 'Extinguido', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => {
                  const extinguido = item.estado === 'Extinguido'
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-slate-700">{item.latitud}, {item.longitud}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.area_nombre || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{item.magnitud || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{item.hectareas_afectadas ? `${item.hectareas_afectadas} ha` : '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{item.causa_nombre || causas.find(c => c.id === item.causa_id)?.nombre || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{item.fecha?.split('T')[0] || '-'}</div>
                        {item.hora && <div className="text-xs text-slate-400">{item.hora}</div>}
                      </td>
                      <td className="px-4 py-3"><Badge label={item.estado} variant={estadoVariant[item.estado]} /></td>
                      <td className="px-4 py-3">
                        {item.fecha_controlado ? (
                          <div>
                            <div className="text-xs font-medium text-yellow-700">{new Date(item.fecha_controlado).toLocaleDateString('es-CO')}</div>
                            <div className="text-xs text-slate-400">{new Date(item.fecha_controlado).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ) : <span className="text-xs text-slate-300">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        {item.fecha_extinguido ? (
                          <div>
                            <div className="text-xs font-medium text-slate-600">{new Date(item.fecha_extinguido).toLocaleDateString('es-CO')}</div>
                            <div className="text-xs text-slate-400">{new Date(item.fecha_extinguido).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ) : <span className="text-xs text-slate-300">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {isAdmin && !extinguido && (
                            <button onClick={() => setEstadoModal({ id: item.id, estadoActual: item.estado })}
                              title="Cambiar estado"
                              className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600">
                              <CheckCircle size={15} />
                            </button>
                          )}
                          {extinguido && (
                            <button onClick={() => setViewItem(item)} title="Ver detalle"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><Eye size={15} /></button>
                          )}
                          {isAdmin && !extinguido && (
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                          )}
                          {isAdmin && !extinguido && (
                            <button onClick={() => setConfirmId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                          )}
                          {extinguido && <span className="text-xs text-slate-400 px-2">Cerrado</span>}
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
        <Modal title={modal === 'create' ? 'Registrar Incendio' : 'Editar Incendio'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{formError}</div>}
            <div className="grid grid-cols-2 gap-3">
              {field('latitud',  'Latitud',  { required: true, type: 'number', step: 'any', min: '-90',  max: '90',  placeholder: 'Ej: -4.1234567', help: 'Coordenada en grados decimales, de -90 a 90.' })}
              {field('longitud', 'Longitud', { required: true, type: 'number', step: 'any', min: '-180', max: '180', placeholder: 'Ej: -74.1234567', help: 'Coordenada en grados decimales, de -180 a 180.' })}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Área afectada</label>
              <select value={form.area_id || ''} onChange={e => setForm({ ...form, area_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar area...</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Selecciona el área afectada por el incendio si está disponible.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Magnitud</label>
                <select value={form.magnitud || ''} onChange={e => setForm({ ...form, magnitud: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Seleccionar...</option>
                  <option>Pequeno</option><option>Mediano</option><option>Grande</option><option>Catastrofico</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Selecciona el tamaño aproximado del incendio.</p>
              </div>
              {field('hectareas_afectadas', 'Hectáreas afectadas', { type: 'number', step: '0.01', min: '0', placeholder: 'Ej: 12.50', help: 'Área aproximada afectada por el incendio en hectáreas.' })}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Causa del incendio</label>
              <select value={form.causa_id || ''} onChange={e => setForm({ ...form, causa_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar causa...</option>
                {causas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Selecciona la causa más probable del incendio.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field('fecha', 'Fecha', { type: 'date', help: 'Fecha en la que se registró el incendio.', help: 'Fecha en la que se registró el incendio.' })}
              {field('hora', 'Hora', { type: 'time', help: 'Hora aproximada en la que se detectó el incendio.' })}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
              <textarea rows={3} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej: Incendio en ladera norte, cercano a zona de acampada"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <p className="mt-1 text-xs text-slate-500">Agrega cualquier detalle útil sobre la ubicación, el viento, o la vegetación afectada.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">{modal === 'create' ? 'Registrar' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {estadoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Cambiar estado del incendio</h3>
            <p className="text-sm text-slate-500 mb-5">
              Estado actual: <Badge label={estadoModal.estadoActual} variant={estadoVariant[estadoModal.estadoActual]} />
            </p>
            <div className="space-y-2">
              {estadoModal.estadoActual === 'Activo' && (
                <button onClick={() => cambiarEstado('Controlado')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-xl text-sm font-medium text-yellow-800 transition-colors">
                  <CheckCircle size={18} className="text-yellow-600" /> Marcar como Controlado
                </button>
              )}
              {(estadoModal.estadoActual === 'Activo' || estadoModal.estadoActual === 'Controlado') && (
                <button onClick={() => cambiarEstado('Extinguido')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors">
                  <XCircle size={18} className="text-slate-500" /> Marcar como Extinguido
                  <span className="ml-auto text-xs text-slate-400">No reversible</span>
                </button>
              )}
            </div>
            <button onClick={() => setEstadoModal(null)} className="w-full mt-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
          </div>
        </div>
      )}

      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Detalle del incendio</h3>
                <p className="text-sm text-slate-500">{viewItem.area_nombre || 'Sin área'}</p>
              </div>
              <button onClick={() => setViewItem(null)} className="text-slate-400 hover:text-slate-700">Cerrar</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Coordenadas</p>
                <p className="text-sm text-slate-700 font-mono">{viewItem.latitud}, {viewItem.longitud}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Magnitud</p>
                <p className="text-sm text-slate-700">{viewItem.magnitud || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Hectáreas afectadas</p>
                <p className="text-sm text-slate-700">{viewItem.hectareas_afectadas ? `${viewItem.hectareas_afectadas} ha` : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Causa</p>
                <p className="text-sm text-slate-700">{viewItem.causa_nombre || causas.find(c => c.id === viewItem.causa_id)?.nombre || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha</p>
                <p className="text-sm text-slate-700">{viewItem.fecha?.split('T')[0] || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Hora</p>
                <p className="text-sm text-slate-700">{viewItem.hora || '-'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estado</p>
                <Badge label={viewItem.estado} variant={estadoVariant[viewItem.estado]} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Controlado</p>
                <p className="text-sm text-slate-700">
                  {viewItem.fecha_controlado
                    ? `${new Date(viewItem.fecha_controlado).toLocaleDateString('es-CO')} ${new Date(viewItem.fecha_controlado).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Extinguido</p>
                <p className="text-sm text-slate-700">
                  {viewItem.fecha_extinguido
                    ? `${new Date(viewItem.fecha_extinguido).toLocaleDateString('es-CO')} ${new Date(viewItem.fecha_extinguido).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
                    : '-'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Descripción</p>
                <p className="text-sm text-slate-700">{viewItem.descripcion || '-'}</p>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button onClick={() => setViewItem(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          message="¿Eliminar este registro? de incendio?"
          onConfirm={() => { remove(confirmId); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
