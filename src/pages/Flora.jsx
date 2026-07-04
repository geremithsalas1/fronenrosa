import { soloLetras, soloNombreCientifico, fechaMinHoy } from '../hooks/useSoloLetras'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Check, Eye } from 'lucide-react'
import useCrud from '../hooks/useCrud'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { usePermisos } from '../context/PermisosContext'
import { validateFlora } from '../utils/validators'

const empty = {
  nombre_comun: '', nombre_cientifico: '', tipo: '',
  condiciones_optimas: '', apta_reforestacion: false, descripcion: ''
}

export default function Flora() {
  const { puedeEscribir } = usePermisos()
  const isAdmin = puedeEscribir('flora')
  const { data, loading, create, update, remove } = useCrud('/flora')
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
  const openEdit = (item) => {
    setForm({ ...item, apta_reforestacion: item.apta_reforestacion || false })
    setEditId(item.id)
    setFormError('')
    setModal('edit')
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    const error = validateFlora(form)
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
          <h1 className="text-2xl font-bold text-slate-800">Flora</h1>
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar plantas..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Cargando...</div> :
          filtered.length === 0 ? <div className="p-8 text-center text-slate-400">No hay especies registradas</div> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Nombre comun', 'Nombre cientifico', 'Tipo', 'Reforestacion', 'Acciones'].map(h => (
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
                      {item.apta_reforestacion
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><Check size={11} /> Apta</span>
                        : <span className="text-xs text-slate-400">No</span>}
                    </td>
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
        <Modal title={modal === 'create' ? 'Nueva Especie de Flora' : 'Editar Especie'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{formError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre comun <span className="text-red-500">*</span></label>
                <input type="text" required maxLength={60} value={form.nombre_comun || ''} onChange={e => setForm({ ...form, nombre_comun: soloNombreCientifico(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: Roble" />
                <p className="mt-1 text-xs text-slate-500">Nombre común de la planta o árbol.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre cientifico</label>
                <input type="text" maxLength={60} value={form.nombre_cientifico || ''} onChange={e => setForm({ ...form, nombre_cientifico: soloNombreCientifico(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 italic" placeholder="Ej: Quercus robur" />
                <p className="mt-1 text-xs text-slate-500">Nombre científico opcional para identificación precisa.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select value={form.tipo || ''} onChange={e => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Seleccionar...</option>
                  <option>Árbol</option><option>Arbusto</option><option>Herbacea</option>
                  <option>Epifita</option><option>Trepadora</option><option>Otro</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Categoría de la planta según su forma y uso.</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Condiciones optimas</label>
              <select value={form.condiciones_optimas || ''} onChange={e => setForm({ ...form, condiciones_optimas: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar condiciones...</option>
                <option value="Suelo húmedo, temperatura templada">Suelo húmedo, temperatura templada</option>
                <option value="Suelo seco, clima árido">Suelo seco, clima árido</option>
                <option value="Altitud media, sombra parcial">Altitud media, sombra parcial</option>
                <option value="Luz directa, suelo fértil">Luz directa, suelo fértil</option>
                <option value="Clima tropical, alta humedad">Clima tropical, alta humedad</option>
                <option value="Sombra total, suelo ácido">Sombra total, suelo ácido</option>
                <option value="Costa, suelo arenoso">Costa, suelo arenoso</option>
                <option value="Montaña, clima frío">Montaña, clima frío</option>
                <option value="Otro">Otro</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">Condiciones ideales para el crecimiento de la especie.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
              <textarea rows={2} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <p className="mt-1 text-xs text-slate-500">Descripción breve de la planta, su hábitat o uso ecológico.</p>
            </div>
            <div className={`flex flex-col gap-2 p-3 rounded-xl border transition-colors ${form.apta_reforestacion ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="apta_ref" checked={!!form.apta_reforestacion}
                  onChange={e => setForm({ ...form, apta_reforestacion: e.target.checked })}
                  className="w-4 h-4 accent-green-600 cursor-pointer" />
                <label htmlFor="apta_ref" className="text-sm font-medium text-green-800 cursor-pointer">Apta para reforestacion</label>
              </div>
              <p className="text-xs text-slate-500">Marca si esta especie es adecuada para planes de reforestación y restauración.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">{modal === 'create' ? 'Crear' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
      {viewItem && (
        <Modal title="Detalle de Flora" onClose={() => setViewItem(null)}>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{viewItem.nombre_comun}</h3>
              <p className="text-sm text-slate-500 italic">{viewItem.nombre_cientifico || 'Sin nombre científico'}</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-700">
              <div><span className="font-medium text-slate-900">Tipo:</span> {viewItem.tipo || 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Condiciones óptimas:</span> {viewItem.condiciones_optimas || 'No disponible'}</div>
              <div><span className="font-medium text-slate-900">Reforestación:</span> {viewItem.apta_reforestacion ? 'Sí' : 'No'}</div>
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
