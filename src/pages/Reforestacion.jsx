import { soloLetras, fechaHoy, fechaMaxDosMeses, soloAlfanumerico } from '../hooks/useSoloLetras'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, Flame, ChevronRight, Eye } from 'lucide-react'
import useCrud from '../hooks/useCrud'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import { usePermisos } from '../context/PermisosContext'
import api from '../services/api'
import { validateReforestacion } from '../utils/validators'

const empty = {
  nombre_proyecto: '', area_id: '', flora_id: '', fecha: '',
  cantidad: '', responsable: '', zona_incendio: false, descripcion: '', estado: 'Programada'
}

const estadoVariant = { Programada: 'blue', 'En proceso': 'yellow', Terminada: 'green' }
const siguienteEstado = { Programada: 'En proceso', 'En proceso': 'Terminada' }

export default function Reforestacion() {
  const { puedeEscribir } = usePermisos()
  const isAdmin = puedeEscribir('reforestacion')
  const { data, loading, refetch } = useCrud('/reforestacion')
  const { data: areas } = useCrud('/areas')
  const [especiesAptas, setEspeciesAptas] = useState([])
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [estadoModal, setEstadoModal] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [formError, setFormError] = useState('')
  const [responsableSearch, setResponsableSearch] = useState('')
  const [showResponsableList, setShowResponsableList] = useState(false)

  useEffect(() => {
    if (form.fecha === fechaHoy() && form.estado === 'Programada') {
      setForm(prev => ({ ...prev, estado: 'En proceso' }))
    }
  }, [form.fecha])

  useEffect(() => {
    api.get('/reforestacion/especies-aptas')
      .then(r => setEspeciesAptas(r.data))
      .catch(() => setEspeciesAptas([]))
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true)
      try {
        const res = await api.get('/users')
        setUsers(res.data)
      } catch {
        setUsers([])
      } finally {
        setUsersLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const coordinadores = users.filter(u => u.role === 'coordinador')
  const filteredResponsables = coordinadores.filter(u =>
    `${u.name} ${u.apellidos}`.toLowerCase().includes(responsableSearch.toLowerCase()) ||
    (u.documento && u.documento.toLowerCase().includes(responsableSearch.toLowerCase()))
  )

  const totalPlantadas = data.reduce((acc, r) => acc + (parseInt(r.cantidad) || 0), 0)

  const filtered = data.filter(r =>
    r.nombre_proyecto?.toLowerCase().includes(search.toLowerCase()) ||
    r.area_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    r.responsable?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setForm(empty); setEditId(null); setFormError(''); setResponsableSearch(''); setShowResponsableList(false); setModal('create') }
  const openEdit = (item) => {
    setFormError('')
    setForm({
      nombre_proyecto: item.nombre_proyecto || '',
      area_id: item.area_id || '',
      flora_id: item.flora_id || '',
      fecha: item.fecha?.split('T')[0] || '',
      cantidad: item.cantidad || '',
      responsable: item.responsable || '',
      zona_incendio: item.zona_incendio || false,
      descripcion: item.descripcion || '',
      estado: item.estado || 'Programada'
    })
    setEditId(item.id)
    setResponsableSearch(item.responsable || '')
    setShowResponsableList(false)
    setModal('edit')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validateReforestacion(form)
    if (validationError) {
      setFormError(validationError)
      return
    }
    setFormError('')
    if (modal === 'create') await api.post('/reforestacion', form)
    else await api.put(`/reforestacion/${editId}`, form)
    await refetch()
    setModal(null)
  }

  const handleDelete = async (id) => {
    await api.delete(`/reforestacion/${id}`)
    await refetch()
    setConfirmId(null)
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    await api.put(`/reforestacion/${id}/estado`, { estado: nuevoEstado })
    await refetch()
    setEstadoModal(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reforestacion</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data.length} proyectos &middot; {totalPlantadas.toLocaleString()} plantas totales
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Nuevo proyecto
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyectos..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Cargando...</div> :
          filtered.length === 0 ? <div className="p-8 text-center text-slate-400">No hay proyectos registrados</div> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Proyecto', 'Área', 'Especie', 'Cantidad', 'Fecha', 'Responsable', 'Zona incendio', 'Estado', isAdmin ? 'Acciones' : ''].filter(Boolean).map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.nombre_proyecto}</td>
                    <td className="px-4 py-3 text-slate-600">{item.area_nombre || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{item.especie_nombre || '-'}</div>
                      {item.especie_cientifica && <div className="text-xs text-slate-400 italic">{item.especie_cientifica}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.cantidad ? parseInt(item.cantidad).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{item.fecha?.split('T')[0] || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{item.responsable || '-'}</td>
                    <td className="px-4 py-3">
                      {item.zona_incendio
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full"><Flame size={11} /> Si</span>
                        : <span className="text-xs text-slate-400">No</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={item.estado || 'Programada'} variant={estadoVariant[item.estado] || 'blue'} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {item.estado === 'Terminada' && (
                            <button onClick={() => setViewItem(item)} title="Ver detalle"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><Eye size={15} /></button>
                          )}
                          {siguienteEstado[item.estado] && (
                            <button onClick={() => setEstadoModal({ id: item.id, estadoActual: item.estado, fecha: item.fecha })}
                              title={`Avanzar a ${siguienteEstado[item.estado]}`}
                              className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600">
                              <ChevronRight size={15} />
                            </button>
                          )}
                          {item.estado !== 'Terminada' && (
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                          )}
                          {item.estado !== 'Terminada' && (
                            <button onClick={() => setConfirmId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Nuevo Proyecto de Reforestacion' : 'Editar Proyecto'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del proyecto <span className="text-red-500">*</span></label>
              <input type="text" required value={form.nombre_proyecto} onChange={e => setForm({ ...form, nombre_proyecto: soloAlfanumerico(e.target.value) })} maxLength={100}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Recuperacion Cuenca Norte 2025" />
              <p className="mt-1 text-xs text-slate-500">Nombre descriptivo del proyecto de reforestación.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Área de trabajo</label>
              <select value={form.area_id} onChange={e => setForm({ ...form, area_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar area...</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Selecciona la zona donde se realizará la reforestación.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Especie a plantar
                {especiesAptas.length === 0 && <span className="text-xs text-slate-400 ml-2">(registra especies aptas en Flora)</span>}
              </label>
              <select value={form.flora_id} onChange={e => setForm({ ...form, flora_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar especie...</option>
                {especiesAptas.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nombre_comun}{f.nombre_cientifico ? ` (${f.nombre_cientifico})` : ''}
                  </option>
                ))}
              </select>
              {especiesAptas.length > 0 && (
                <p className="text-xs text-green-600 mt-1">Solo se muestran especies marcadas como aptas para reforestacion</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input type="date" min={fechaHoy()} max={fechaMaxDosMeses()} value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="mt-1 text-xs text-slate-500">Fecha planificada para la reforestación.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de plantas</label>
                <input type="number" min="1" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })}
                  placeholder="Ej: 150"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="mt-1 text-xs text-slate-500">Número de plantas a sembrar en este proyecto.</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
              <div className="relative">
                <input type="text" value={responsableSearch} onChange={e => { setResponsableSearch(e.target.value); setShowResponsableList(true) }}
                  onFocus={() => setShowResponsableList(true)} onBlur={() => setTimeout(() => setShowResponsableList(false), 200)}
                  placeholder={usersLoading ? 'Cargando coordinadores...' : 'Buscar coordinador...'}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                {showResponsableList && filteredResponsables.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto mt-1">
                    {filteredResponsables.map(u => (
                      <div key={u.id} onClick={() => {
                        const label = `${u.name} ${u.apellidos}`.trim()
                        const value = u.tipo_documento && u.documento ? `${label} · ${u.tipo_documento}-${u.documento}` : label
                        setForm({ ...form, responsable: value })
                        setResponsableSearch(value)
                        setShowResponsableList(false)
                      }}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                        {`${u.name} ${u.apellidos}${u.tipo_documento && u.documento ? ` · ${u.tipo_documento}-${u.documento}` : ''}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">Selecciona el coordinador responsable del proyecto.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="Programada" disabled={form.fecha === fechaHoy()}>Programada</option>
                <option value="En proceso">En proceso</option>
                <option value="Terminada">Terminada</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">Estado actual del proyecto según su avance.</p>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${form.zona_incendio ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <input type="checkbox" id="zona_inc" checked={!!form.zona_incendio}
                onChange={e => setForm({ ...form, zona_incendio: e.target.checked })}
                className="w-4 h-4 accent-red-600 cursor-pointer" />
              <label htmlFor="zona_inc" className={`text-sm font-medium cursor-pointer flex items-center gap-1.5 ${form.zona_incendio ? 'text-red-800' : 'text-slate-700'}`}>
                <Flame size={14} className={form.zona_incendio ? 'text-red-500' : 'text-slate-400'} />
                Zona afectada por incendio
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
              <textarea rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej: Reforestación de área degradada junto al riachuelo"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <p className="mt-1 text-xs text-slate-500">Detalles adicionales del proyecto, como objetivos o condiciones del sitio.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">{modal === 'create' ? 'Crear proyecto' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {estadoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Cambiar estado</h3>
            <p className="text-sm text-slate-500 mb-4">
              Estado actual: <Badge label={estadoModal.estadoActual} variant={estadoVariant[estadoModal.estadoActual]} />
            </p>
            <button
              onClick={() => cambiarEstado(estadoModal.id, siguienteEstado[estadoModal.estadoActual])}
              disabled={
                (siguienteEstado[estadoModal.estadoActual] === 'Terminada' && estadoModal.fecha && new Date(estadoModal.fecha).setHours(0, 0, 0, 0) > new Date(new Date().setHours(0, 0, 0, 0))) ||
                (siguienteEstado[estadoModal.estadoActual] === 'En proceso' && estadoModal.fecha && new Date(estadoModal.fecha).setHours(0, 0, 0, 0) > new Date(new Date().setHours(0, 0, 0, 0)))
              }
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-colors mb-2 ${
                siguienteEstado[estadoModal.estadoActual] === 'En proceso'
                  ? 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-800'
                  : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-800'
              } ${((siguienteEstado[estadoModal.estadoActual] === 'Terminada' || siguienteEstado[estadoModal.estadoActual] === 'En proceso') && estadoModal.fecha && new Date(estadoModal.fecha).setHours(0, 0, 0, 0) > new Date(new Date().setHours(0, 0, 0, 0))) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronRight size={18} />
              Marcar como {siguienteEstado[estadoModal.estadoActual]}
              {estadoModal.estadoActual === 'En proceso' && <span className="ml-auto text-xs text-slate-400">No reversible</span>}
            </button>
            {(siguienteEstado[estadoModal.estadoActual] === 'Terminada' || siguienteEstado[estadoModal.estadoActual] === 'En proceso') && estadoModal.fecha && new Date(estadoModal.fecha).setHours(0, 0, 0, 0) > new Date(new Date().setHours(0, 0, 0, 0)) && (
              <p className="text-xs text-red-600">No se puede iniciar o terminar antes de la fecha programada</p>
            )}
            <button onClick={() => setEstadoModal(null)}
              className="w-full py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Detalle del proyecto</h3>
                <p className="text-sm text-slate-500">{viewItem.nombre_proyecto}</p>
              </div>
              <button onClick={() => setViewItem(null)} className="text-slate-400 hover:text-slate-700">Cerrar</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Área</p>
                <p className="text-sm text-slate-700">{viewItem.area_nombre || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Especie</p>
                <p className="text-sm text-slate-700">{viewItem.especie_nombre || '-'}</p>
                {viewItem.especie_cientifica && <p className="text-xs text-slate-400 italic">{viewItem.especie_cientifica}</p>}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cantidad</p>
                <p className="text-sm text-slate-700">{viewItem.cantidad ? parseInt(viewItem.cantidad).toLocaleString() : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha</p>
                <p className="text-sm text-slate-700">{viewItem.fecha?.split('T')[0] || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Responsable</p>
                <p className="text-sm text-slate-700">{viewItem.responsable || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Zona de incendio</p>
                <p className="text-sm text-slate-700">{viewItem.zona_incendio ? 'Sí' : 'No'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estado</p>
                <Badge label={viewItem.estado || 'Programada'} variant={estadoVariant[viewItem.estado] || 'blue'} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha terminada</p>
                <p className="text-sm text-slate-700">
                  {viewItem.fecha_terminada
                    ? `${new Date(viewItem.fecha_terminada).toLocaleDateString('es-CO')} ${new Date(viewItem.fecha_terminada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
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
          message="¿Eliminar este proyecto? de reforestacion?"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
