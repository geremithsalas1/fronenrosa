import { soloLetras, fechaMinHoy } from '../hooks/useSoloLetras'
import { useState, useCallback, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react'
import useCatalogo from '../hooks/useCatalogo'
import useCrud from '../hooks/useCrud'
import { validateObservacionFauna } from '../utils/validators'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import api from '../services/api'
import { usePermisos } from '../context/PermisosContext'

const empty = {
  fauna_id: '', area_id: '',
  latitud: '', longitud: '', responsable: '', fecha: '', metodo_id: ''
}

function useResource(endpoint) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const fetchData = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get(endpoint); setData(res.data) } catch { setData([]) }
    finally { setLoading(false) }
  }, [endpoint])
  useEffect(() => { fetchData() }, [fetchData])
  return { data, loading, refetch: fetchData }
}

export default function FaunaSeguimiento() {
  const { puedeEscribir } = usePermisos()
  const isAdmin = puedeEscribir('fauna_seg')
  const { data, loading, create, update, remove } = useCrud('/fauna-seguimiento')
  const { data: areas } = useCrud('/areas')
  const { data: faunaList } = useCrud('/fauna')
  const { data: metodos } = useCatalogo('/catalogos/metodos-observacion')
  const { data: users } = useResource('/users')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [responsableSearch, setResponsableSearch] = useState('')
  const [showResponsableList, setShowResponsableList] = useState(false)

  const responsables = users.filter(u => u.role === 'guardaparque' || u.role === 'investigador')
  const filteredResponsables = responsables.filter(u =>
    `${u.name} ${u.apellidos}`.toLowerCase().includes(responsableSearch.toLowerCase()) ||
    (u.documento && u.documento.toLowerCase().includes(responsableSearch.toLowerCase()))
  )

  const filtered = data.filter(a =>
    faunaList.find(f => f.id === a.fauna_id)?.nombre_comun?.toLowerCase().includes(search.toLowerCase()) ||
    a.responsable?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setForm(empty); setFormError(''); setResponsableSearch(''); setShowResponsableList(false); setModal('create') }
  const openEdit = (item) => { setForm(item); setEditId(item.id); setFormError(''); setResponsableSearch(item.responsable || ''); setShowResponsableList(false); setModal('edit') }

  const getCoords = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, latitud: pos.coords.latitude.toFixed(7), longitud: pos.coords.longitude.toFixed(7) }))
        setGeoLoading(false)
      },
      () => setGeoLoading(false)
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const error = validateObservacionFauna(form)
    if (error) return setFormError(error)
    setFormError('')
    if (modal === 'create') await create(form)
    else await update(editId, form)
    setModal(null)
  }

  const getNombreFauna = (id) => faunaList.find(f => f.id === id)?.nombre_comun || '—'
  const getNombreArea = (id) => areas.find(a => a.id === id)?.nombre || '—'
  const getNombreMetodo = (id) => metodos.find(m => m.id === id)?.nombre || '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Seguimiento de Fauna</h1>
          <p className="text-slate-500 text-sm mt-1">{data.length} registros</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Nuevo registro
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por especie o responsable..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Cargando...</div> :
          filtered.length === 0 ? <div className="p-8 text-center text-slate-400">No hay registros</div> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Especie', 'Área', 'Coordenadas', 'Método', 'Responsable', 'Fecha', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{getNombreFauna(item.fauna_id)}</td>
                    <td className="px-4 py-3 text-slate-600">{getNombreArea(item.area_id)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {item.latitud && item.longitud ? `${item.latitud}, ${item.longitud}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{getNombreMetodo(item.metodo_id)}</td>
                    <td className="px-4 py-3 text-slate-600">{item.responsable}</td>
                    <td className="px-4 py-3 text-slate-600">{item.fecha?.split('T')[0]}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setViewItem(item)} title="Ver detalle" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><Eye size={15} /></button>
                        {isAdmin && <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>}
                        {isAdmin && <button onClick={() => setConfirmId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Nuevo Registro' : 'Editar Registro'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{formError}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Especie <span className="text-red-500">*</span></label>
              <select required value={form.fauna_id || ''} onChange={e => setForm({ ...form, fauna_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar especie...</option>
                {faunaList.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nombre_comun}{f.nombre_cientifico ? ` (${f.nombre_cientifico})` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">Selecciona la especie observada en el seguimiento.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Área donde se vio</label>
              <select value={form.area_id || ''} onChange={e => setForm({ ...form, area_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar área...</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Área protegida o sector donde se registró la observación.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Método de observación <span className="text-red-500">*</span></label>
              <select required value={form.metodo_id || ''} onChange={e => setForm({ ...form, metodo_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar método...</option>
                {metodos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Elige el procedimiento usado para la observación.</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Coordenadas</label>
                <button type="button" onClick={getCoords} disabled={geoLoading}
                  className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50">
                  {geoLoading ? 'Obteniendo...' : '📍 Usar mi ubicación'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="any" min="-90"  max="90"  value={form.latitud || ''} onChange={e => setForm({ ...form, latitud: e.target.value })}
                  placeholder="Latitud" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="number" step="any" min="-180" max="180" value={form.longitud || ''} onChange={e => setForm({ ...form, longitud: e.target.value })}
                  placeholder="Longitud" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <p className="mt-1 text-xs text-slate-500">Ingresa coordenadas en grados decimales o usa tu ubicación actual.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
                <div className="relative">
                  <input type="text" value={responsableSearch} onChange={e => { setResponsableSearch(e.target.value); setShowResponsableList(true) }}
                    onFocus={() => setShowResponsableList(true)} onBlur={() => setTimeout(() => setShowResponsableList(false), 200)}
                    placeholder="Buscar responsable..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  {showResponsableList && filteredResponsables.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto mt-1">
                      {filteredResponsables.map(u => (
                        <div key={`${u.id}-${u.role}`} onClick={() => {
                          const label = `${u.name} ${u.apellidos}`.trim()
                          const value = u.documento ? `${label} · ${u.documento}` : label
                          setForm({ ...form, responsable: value })
                          setResponsableSearch(value)
                          setShowResponsableList(false)
                        }}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                          {`${u.name} ${u.apellidos}${u.documento ? ` · ${u.documento}` : ''}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">Nombre o documento de la persona responsable del registro.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input type="date" min={fechaMinHoy()} value={form.fecha?.split('T')[0] || ''} onChange={e => setForm({ ...form, fecha: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="mt-1 text-xs text-slate-500">Fecha de la observación de fauna.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">{modal === 'create' ? 'Crear' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
      {viewItem && (
        <Modal title="Detalle de seguimiento" onClose={() => setViewItem(null)}>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{getNombreFauna(viewItem.fauna_id)}</h3>
              <p className="text-sm text-slate-500">{getNombreArea(viewItem.area_id)}</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-700">
              <div><span className="font-medium text-slate-900">Coordenadas:</span> {viewItem.latitud && viewItem.longitud ? `${viewItem.latitud}, ${viewItem.longitud}` : 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Método:</span> {getNombreMetodo(viewItem.metodo_id)}</div>
              <div><span className="font-medium text-slate-900">Responsable:</span> {viewItem.responsable || 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Fecha:</span> {viewItem.fecha?.split('T')[0] || 'No disponible'}</div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewItem(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">Cerrar</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmId && (
        <ConfirmDialog
          message="¿Eliminar este registro?"
          onConfirm={() => { remove(confirmId); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
