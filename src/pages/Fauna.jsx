import { soloLetras, soloNombreCientifico, fechaMinHoy } from '../hooks/useSoloLetras'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react'
import useCrud from '../hooks/useCrud'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import { usePermisos } from '../context/PermisosContext'
import useCatalogo from '../hooks/useCatalogo'
import { validateFauna } from '../utils/validators'

const empty = {
  nombre_comun: '', nombre_cientifico: '', tipo: '',
  estado_conservacion_id: '', poblacion_estimada: '', descripcion: '', amenazas: ''
}

const estadoVariant = {
  'Preocupacion menor': 'green',
  'Casi amenazada': 'yellow',
  'Vulnerable': 'yellow',
  'En peligro': 'red',
  'En peligro critico': 'red',
  'Extinto en estado silvestre': 'gray',
  'Extinto': 'gray'
}

export default function Fauna() {
  const { puedeEscribir } = usePermisos()
  const isAdmin = puedeEscribir('fauna')
  const { data, loading, create, update, remove } = useCrud('/fauna')
  const { data: estadosCons } = useCatalogo('/catalogos/estados-conservacion')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [formError, setFormError] = useState('')

  const filtered = data.filter(a =>
    a.nombre_comun?.toLowerCase().includes(search.toLowerCase()) ||
    a.nombre_cientifico?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setForm(empty); setEditId(null); setFormError(''); setModal('create') }
  const openEdit = (item) => { setForm(item); setEditId(item.id); setFormError(''); setModal('edit') }
  const handleSubmit = async (e) => {
    e.preventDefault()
    const error = validateFauna(form)
    if (error) return setFormError(error)
    try {
      if (modal === 'create') await create(form)
      else await update(editId, form)
      setModal(null)
    } catch (err) {
      setFormError(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fauna</h1>
          <p className="text-slate-500 text-sm mt-1">{data.length} especies registradas</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Nueva especie
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar especies..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Cargando...</div> :
          filtered.length === 0 ? <div className="p-8 text-center text-slate-400">No hay especies registradas</div> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Nombre comun', 'Nombre cientifico', 'Tipo', 'Estado conservacion', 'Poblacion est.', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.nombre_comun}</td>
                    <td className="px-4 py-3 text-slate-500 italic">{item.nombre_cientifico || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{item.tipo || '-'}</td>
                    <td className="px-4 py-3">
                      {item.estado_conservacion_id
                        ? (() => {
                            const e = estadosCons.find(ec => ec.id === item.estado_conservacion_id)
                            return e ? <Badge label={`${e.nombre}${e.codigo ? ` (${e.codigo})` : ''}`} variant={estadoVariant[e.nombre] || 'gray'} /> : '-'
                          })()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.poblacion_estimada ? Number(item.poblacion_estimada).toLocaleString() : '-'}</td>
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
        <Modal title={modal === 'create' ? 'Nueva Especie' : 'Editar Especie'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{formError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre comun <span className="text-red-500">*</span></label>
                <input type="text" required maxLength={60} value={form.nombre_comun || ''} onChange={e => setForm({ ...form, nombre_comun: soloNombreCientifico(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: Jaguar" />
                <p className="mt-1 text-xs text-slate-500">Nombre común de la especie, tal como se utiliza localmente.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre cientifico</label>
                <input type="text" maxLength={60} value={form.nombre_cientifico || ''} onChange={e => setForm({ ...form, nombre_cientifico: soloNombreCientifico(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 italic" placeholder="Ej: Panthera onca" />
                <p className="mt-1 text-xs text-slate-500">Nombre científico opcional para clasificación precisa.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select value={form.tipo || ''} onChange={e => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Seleccionar...</option>
                  <option>Mamifero</option><option>Ave</option><option>Reptil</option>
                  <option>Anfibio</option><option>Pez</option><option>Insecto</option><option>Otro</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Selecciona la categoría taxonómica más adecuada.</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado de conservacion</label>
              <select value={form.estado_conservacion_id || ''} onChange={e => setForm({ ...form, estado_conservacion_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar...</option>
                {estadosCons.map(e => <option key={e.id} value={e.id}>{e.nombre}{e.codigo ? ` (${e.codigo})` : ''}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Indica el estado de conservación oficial de la especie.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Poblacion estimada</label>
              <input type="number" min="0" max="9999999" value={form.poblacion_estimada || ''} onChange={e => setForm({ ...form, poblacion_estimada: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <p className="mt-1 text-xs text-slate-500">Número aproximado de individuos estimados en la región.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amenazas</label>
              <select value={form.amenazas || ''} onChange={e => setForm({ ...form, amenazas: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar amenaza...</option>
                <option value="Pérdida de hábitat">Pérdida de hábitat</option>
                <option value="Caza furtiva">Caza furtiva</option>
                <option value="Contaminación">Contaminación</option>
                <option value="Cambio climático">Cambio climático</option>
                <option value="Especies invasoras">Especies invasoras</option>
                <option value="Enfermedades">Enfermedades</option>
                <option value="Sobreexplotación">Sobreexplotación</option>
                <option value="Otro">Otro</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">Escoge la amenaza principal que afecta a esta especie.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
              <textarea rows={2} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <p className="mt-1 text-xs text-slate-500">Información adicional sobre el hábitat, comportamiento o necesidades de la especie.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">{modal === 'create' ? 'Crear' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
      {viewItem && (
        <Modal title="Detalle de Fauna" onClose={() => setViewItem(null)}>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{viewItem.nombre_comun}</h3>
              <p className="text-sm text-slate-500 italic">{viewItem.nombre_cientifico || 'Sin nombre científico'}</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-700">
              <div><span className="font-medium text-slate-900">Tipo:</span> {viewItem.tipo || 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Estado conservación:</span> {estadosCons.find(e => e.id === viewItem.estado_conservacion_id)?.nombre || 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Población estimada:</span> {viewItem.poblacion_estimada ? Number(viewItem.poblacion_estimada).toLocaleString() : 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Amenazas:</span> {viewItem.amenazas || 'No hay registro'}</div>
              <div><span className="font-medium text-slate-900">Descripción:</span> {viewItem.descripcion || 'No hay descripción'}</div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewItem(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">Cerrar</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmId && (
        <ConfirmDialog
          message="¿Eliminar esta especie??"
          onConfirm={() => { remove(confirmId); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
