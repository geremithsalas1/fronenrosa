import { soloLetras, fechaHoy } from '../hooks/useSoloLetras'
import { useState, useEffect, useCallback } from 'react'
import { validateIncidencia, isValidTime, isLat, isLng, validateRonda } from '../utils/validators'
import { Plus, Search, AlertTriangle, Eye, ChevronLeft, MapPin, Camera, Flag, Trash2, X } from 'lucide-react'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { usePermisos } from '../context/PermisosContext'
import api, { getAssetUrl } from '../services/api'
import useCatalogo from '../hooks/useCatalogo'

const estadoVariant = { Activa: 'green', Finalizada: 'gray' }
const tipoIncVariant = { Incendio: 'red', 'Tala ilegal': 'yellow', 'Presencia de fauna': 'blue', Contaminación: 'red', Otro: 'gray' }

function useResource(endpoint) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const fetch = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get(endpoint); setData(r.data) } catch { setData([]) }
    finally { setLoading(false) }
  }, [endpoint])
  useEffect(() => { fetch() }, [fetch])
  const remove = async (id) => { await api.delete(`${endpoint}/${id}`); setData(p => p.filter(i => i.id !== id)) }
  return { data, loading, remove, refetch: fetch }
}

// ——— Modal Finalizar Ronda (con incidencias integradas) ——————
function FinalizarModal({ rondaId, onClose, onDone }) {
  const [finForm, setFinForm] = useState({ hora_fin: '', descripcion: '', lat_fin: '', lng_fin: '' })
  const [fotoFin, setFotoFin] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [incidencias, setIncidencias] = useState([])
  const [incForm, setIncForm] = useState({ tipo: '', tipo_id: '', descripcion: '', latitud: '', longitud: '', requiere_intervencion: false })
  const [fotoInc, setFotoInc] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [formError, setFormError] = useState('')
  const [incError, setIncError] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const { data: tiposInc } = useCatalogo('/catalogos/tipos-incidencia')

  const agregarIncidencia = () => {
    const error = validateIncidencia(incForm)
    if (error) {
      setIncError(error)
      return
    }
    setIncError('')
    setIncidencias(p => [...p, { ...incForm, _foto: fotoInc, _id: Date.now() }])
    setIncForm({ tipo: '', tipo_id: '', descripcion: '', latitud: '', longitud: '', requiere_intervencion: false })
    setFotoInc(null)
  }

  const getCoordsFin = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setFinForm(f => ({ ...f, lat_fin: pos.coords.latitude.toFixed(7), lng_fin: pos.coords.longitude.toFixed(7) })); setGeoLoading(false) },
      () => setGeoLoading(false)
    )
  }

  useEffect(() => {
    const fetchRonda = async () => {
      try {
        const res = await api.get(`/rondas/${rondaId}`)
        setHoraInicio(res.data.hora_inicio || '')
      } catch {
        setHoraInicio('')
      }
    }
    fetchRonda()
  }, [rondaId])

  const parseMinutes = (time) => {
    const parts = time.split(':').map(Number)
    if (parts.length !== 2 || parts.some(p => Number.isNaN(p))) return null
    return parts[0] * 60 + parts[1]
  }

  const handleFinalizar = async () => {
    if (finForm.hora_fin && !isValidTime(finForm.hora_fin)) {
      setFormError('Hora de finalización inválida')
      return
    }
    if ((finForm.lat_fin !== '' && !isLat(finForm.lat_fin)) || (finForm.lng_fin !== '' && !isLng(finForm.lng_fin))) {
      setFormError('Coordenadas de finalización inválidas')
      return
    }
    if (horaInicio && finForm.hora_fin) {
      const inicioMin = parseMinutes(horaInicio)
      const finMin = parseMinutes(finForm.hora_fin)
      if (inicioMin === null || finMin === null || finMin - inicioMin < 30) {
        setFormError('La hora de finalización debe ser al menos 30 minutos después de la hora de inicio')
        return
      }
    }
    setFormError('')
    setGuardando(true)
    try {
      const fd = new FormData()
      fd.append('descripcion', finForm.descripcion)
      fd.append('hora_fin', finForm.hora_fin)
      fd.append('lat_fin', finForm.lat_fin)
      fd.append('lng_fin', finForm.lng_fin)
      if (fotoFin) fd.append('foto_fin', fotoFin)
      await api.put(`/rondas/${rondaId}/finalizar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })

      for (const inc of incidencias) {
        const fd2 = new FormData()
        fd2.append('tipo', inc.tipo)
        fd2.append('descripcion', inc.descripcion || '')
        fd2.append('latitud', inc.latitud || '')
        fd2.append('longitud', inc.longitud || '')
        if (inc._foto) fd2.append('foto', inc._foto)
        await api.post(`/rondas/${rondaId}/incidencias`, fd2, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      onDone()
    } catch (e) { console.error(e) }
    finally { setGuardando(false) }
  }

  const cls = "w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Finalizar Ronda</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{formError}</div>}
          {/* Datos de cierre */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora de finalización</label>
              <input type="time" value={finForm.hora_fin} onChange={e => setFinForm({ ...finForm, hora_fin: e.target.value })} className={cls} />
              {horaInicio && <p className="text-xs text-slate-500 mt-1">Hora de inicio registrada: {horaInicio}. Debe ser al menos 30 minutos después.</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Coordenadas de finalización</label>
                <button type="button" onClick={getCoordsFin} disabled={geoLoading}
                  className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50 flex items-center gap-1">
                  <MapPin size={12} /> {geoLoading ? 'Obteniendo...' : 'Usar mi ubicación'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="any" min="-90"  max="90"  value={finForm.lat_fin} onChange={e => setFinForm({ ...finForm, lat_fin: e.target.value })}
                  placeholder="Latitud" className={cls} />
                <input type="number" step="any" min="-180" max="180" value={finForm.lng_fin} onChange={e => setFinForm({ ...finForm, lng_fin: e.target.value })}
                  placeholder="Longitud" className={cls} />
              </div>
              {finForm.lat_fin && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><MapPin size={11} /> {finForm.lat_fin}, {finForm.lng_fin}</p>}
              <p className="mt-1 text-xs text-slate-500">Coordenadas de la ubicación final de la ronda en grados decimales.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción general</label>
              <textarea rows={2} value={finForm.descripcion} onChange={e => setFinForm({ ...finForm, descripcion: e.target.value })}
                placeholder="Observaciones generales de la ronda..." className={`${cls} resize-none`} />
              <p className="mt-1 text-xs text-slate-500">Resumen breve de eventos o hallazgos al terminar la ronda.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Camera size={14} /> Foto al finalizar</label>
              <input type="file" accept="image/*" onChange={e => setFotoFin(e.target.files[0])}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100" />
              <p className="mt-1 text-xs text-slate-500">Agrega una foto para documentar el cierre de la ronda si está disponible.</p>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-slate-100" />

          {/* Incidencias */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle size={15} className="text-orange-500" /> Incidencias encontradas
              {incidencias.length > 0 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{incidencias.length}</span>}
            </p>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de incidencia</label>
                <select value={incForm.tipo} onChange={e => {
                  const sel = tiposInc.find(t => t.nombre === e.target.value)
                  setIncForm({ ...incForm, tipo: e.target.value, tipo_id: sel?.id || '' })
                }} className={cls}>
                  <option value="">Seleccionar tipo...</option>
                  {tiposInc.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                </select>
                <p className="mt-1 text-xs text-slate-500">Selecciona el tipo de incidencia para clasificar el hallazgo.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" step="any" min="-90"  max="90"  value={incForm.latitud} onChange={e => setIncForm({ ...incForm, latitud: e.target.value })}
                  placeholder="Latitud" className={cls} />
                <input type="number" step="any" min="-180" max="180" value={incForm.longitud} onChange={e => setIncForm({ ...incForm, longitud: e.target.value })}
                  placeholder="Longitud" className={cls} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Coordenadas donde se detectó la incidencia en grados decimales.</p>
              <textarea rows={2} value={incForm.descripcion} onChange={e => setIncForm({ ...incForm, descripcion: e.target.value })}
                placeholder="Descripción de la incidencia..." className={`${cls} resize-none`} />
              <p className="mt-1 text-xs text-slate-500">Describe lo ocurrido con detalles clave para el seguimiento.</p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><Camera size={12} /> Foto</label>
                <input type="file" accept="image/*" onChange={e => setFotoInc(e.target.files[0])}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white file:text-slate-700" />
                <p className="mt-1 text-xs text-slate-500">Adjunta una imagen si ayuda a documentar mejor la incidencia.</p>
              </div>
              {incError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{incError}</div>}
              <button type="button" onClick={agregarIncidencia}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Agregar incidencia
              </button>
            </div>

            {incidencias.length > 0 && (
              <div className="space-y-2">
                {incidencias.map(inc => (
                  <div key={inc._id} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <Badge label={inc.tipo} variant={tipoIncVariant[inc.tipo] || 'gray'} />
                      {(inc.latitud || inc.longitud) && <p className="text-xs text-slate-400 mt-1 font-mono">{inc.latitud}, {inc.longitud}</p>}
                      {inc.descripcion && <p className="text-xs text-slate-600 mt-1">{inc.descripcion}</p>}
                      {inc._foto && <p className="text-xs text-green-600 mt-1">ð {inc._foto.name}</p>}
                    </div>
                    <button onClick={() => setIncidencias(p => p.filter(i => i._id !== inc._id))}
                      className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button onClick={handleFinalizar} disabled={guardando}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
            {guardando ? 'Guardando...' : `Finalizar${incidencias.length > 0 ? ` · ${incidencias.length} incidencia${incidencias.length > 1 ? 's' : ''}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function AgregarIncidenciaModal({ rondaId, onClose, onDone }) {
  const [incForm, setIncForm] = useState({ tipo: '', tipo_id: '', descripcion: '', latitud: '', longitud: '', requiere_intervencion: false })
  const [fotoInc, setFotoInc] = useState(null)
  const [formError, setFormError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { data: tiposInc } = useCatalogo('/catalogos/tipos-incidencia')
  const cls = "w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"

  const handleSubmit = async () => {
    const error = validateIncidencia(incForm)
    if (error) {
      setFormError(error)
      return
    }
    setFormError('')
    setGuardando(true)
    try {
      const fd = new FormData()
      fd.append('tipo', incForm.tipo)
      fd.append('descripcion', incForm.descripcion || '')
      fd.append('latitud', incForm.latitud || '')
      fd.append('longitud', incForm.longitud || '')
      fd.append('requiere_intervencion', incForm.requiere_intervencion ? 'true' : 'false')
      if (fotoInc) fd.append('foto', fotoInc)
      await api.post(`/rondas/${rondaId}/incidencias`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onDone()
    } catch (err) {
      setFormError(err.response?.data?.message || err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Agregar incidencia</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{formError}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de incidencia</label>
              <select value={incForm.tipo} onChange={e => {
                const sel = tiposInc.find(t => t.nombre === e.target.value)
                setIncForm({ ...incForm, tipo: e.target.value, tipo_id: sel?.id || '' })
              }} className={cls}>
                <option value="">Seleccionar tipo...</option>
                {tiposInc.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="any" min="-90" max="90" value={incForm.latitud} onChange={e => setIncForm({ ...incForm, latitud: e.target.value })}
                placeholder="Latitud" className={cls} />
              <input type="number" step="any" min="-180" max="180" value={incForm.longitud} onChange={e => setIncForm({ ...incForm, longitud: e.target.value })}
                placeholder="Longitud" className={cls} />
            </div>
            <textarea rows={3} value={incForm.descripcion} onChange={e => setIncForm({ ...incForm, descripcion: e.target.value })}
              placeholder="Descripción de la incidencia..." className={`${cls} resize-none`} />
            <div className="flex items-center gap-2">
              <input id="requiere_intervencion" type="checkbox" checked={incForm.requiere_intervencion} onChange={e => setIncForm({ ...incForm, requiere_intervencion: e.target.checked })}
                className="w-4 h-4 accent-green-600" />
              <label htmlFor="requiere_intervencion" className="text-sm text-slate-700">Requiere intervención</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Foto</label>
              <input type="file" accept="image/*" onChange={e => setFotoInc(e.target.files[0])}
                className="w-full text-sm text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white file:text-slate-700" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button onClick={handleSubmit} disabled={guardando}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
            {guardando ? 'Guardando...' : 'Guardar incidencia'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ——— Detalle de Ronda ————————————————————————————————————————
function DetalleRonda({ rondaId, isAdmin, onBack, onFinalizar }) {
  const [ronda, setRonda] = useState(null)
  const [incidencias, setIncidencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [finModal, setFinModal] = useState(false)
  const [incModal, setIncModal] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get(`/rondas/${rondaId}`); setRonda(r.data); setIncidencias(r.data.incidencias || []) }
    catch { } finally { setLoading(false) }
  }, [rondaId])

  useEffect(() => { cargar() }, [cargar])

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando...</div>
  if (!ronda) return <div className="p-8 text-center text-slate-400">Ronda no encontrada</div>

  const finalizada = ronda.estado === 'Finalizada'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"><ChevronLeft size={20} /></button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">Detalle de Ronda</h2>
          <p className="text-sm text-slate-500">{ronda.area_nombre} · {ronda.fecha?.split('T')[0]}</p>
        </div>
        <Badge label={ronda.estado} variant={estadoVariant[ronda.estado]} />
        {isAdmin && !finalizada && (
          <div className="flex items-center gap-2">
            <button onClick={() => setIncModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus size={15} /> Agregar incidencia
            </button>
            <button onClick={() => setFinModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors">
              <Flag size={15} /> Finalizar ronda
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Área', value: ronda.area_nombre },
            { label: 'Vigilante', value: ronda.vigilante },
            { label: 'Fecha', value: ronda.fecha?.split('T')[0] },
            { label: 'Hora inicio', value: ronda.hora_inicio || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{value}</p>
            </div>
          ))}
          {ronda.lat_inicio && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Coordenadas inicio</p>
              <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1">
                <MapPin size={13} className="text-green-500" />{ronda.lat_inicio}, {ronda.lng_inicio}
              </p>
            </div>
          )}
          {ronda.lat_fin && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Coordenadas fin</p>
              <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1">
                <MapPin size={13} className="text-red-400" />{ronda.lat_fin}, {ronda.lng_fin}
              </p>
            </div>
          )}
          {finalizada && ronda.hora_fin && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Hora fin</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{ronda.hora_fin}</p>
            </div>
          )}
        </div>

        {(ronda.foto_inicio || ronda.foto_fin) && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
            {ronda.foto_inicio && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Foto inicio</p>
                <img src={getAssetUrl(ronda.foto_inicio)} alt="inicio" className="w-32 h-24 object-cover rounded-lg border border-slate-200" />
              </div>
            )}
            {ronda.foto_fin && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Foto fin</p>
                <img src={getAssetUrl(ronda.foto_fin)} alt="fin" className="w-32 h-24 object-cover rounded-lg border border-slate-200" />
              </div>
            )}
          </div>
        )}

        {ronda.descripcion && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Descripción</p>
            <p className="text-sm text-slate-700">{ronda.descripcion}</p>
          </div>
        )}
      </div>

      {/* Incidencias — solo lectura */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-orange-500" />
          <h3 className="font-semibold text-slate-800">Incidencias</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{incidencias.length}</span>
          {!finalizada && (
            <span className="text-xs text-slate-400 ml-1">(se registran al finalizar la ronda)</span>
          )}
        </div>
        {incidencias.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
            {finalizada ? 'No se registraron incidencias en esta ronda' : 'No hay incidencias aún. Puedes agregar una sin finalizar la ronda.'}
          </div>
        ) : (
          <div className="space-y-3">
            {incidencias.map(inc => (
              <div key={inc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  inc.tipo === 'Incendio' ? 'bg-red-50 text-red-600' :
                  inc.tipo === 'Tala ilegal' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge label={inc.tipo} variant={tipoIncVariant[inc.tipo] || 'gray'} />
                    {(inc.latitud && inc.longitud) && <span className="text-xs text-slate-400 font-mono flex items-center gap-1"><MapPin size={11} /> {inc.latitud}, {inc.longitud}</span>}
                  </div>
                  {inc.descripcion && <p className="text-sm text-slate-600">{inc.descripcion}</p>}
                  {!inc.descripcion && (inc.latitud && inc.longitud) && <p className="text-sm text-slate-600">Incidencia registrada en las coordenadas {inc.latitud}, {inc.longitud}</p>}
                  {inc.foto && <img src={getAssetUrl(inc.foto)} alt="incidencia" className="w-24 h-16 object-cover rounded-lg mt-2 border border-slate-200" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {finModal && (
        <FinalizarModal
          rondaId={rondaId}
          onClose={() => setFinModal(false)}
          onDone={() => { setFinModal(false); onFinalizar(); cargar() }}
        />
      )}
      {incModal && (
        <AgregarIncidenciaModal
          rondaId={rondaId}
          onClose={() => setIncModal(false)}
          onDone={() => { setIncModal(false); cargar() }}
        />
      )}
    </div>
  )
}

// ——— Página principal —————————————————————————————————————————
export default function Parques() {
  const { user } = useAuth()
  const { puedeEscribir, puedeEliminar } = usePermisos()
  const isAdmin = puedeEscribir('rondas')
  const { data: areas } = useResource('/areas')
  const { data, loading, remove, refetch } = useResource('/rondas')
  const { data: users } = useResource('/users')
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ area_id: '', vigilante: '', fecha: '', hora_inicio: '', descripcion: '' })
  const [fotoInicio, setFotoInicio] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [coords, setCoords] = useState({ lat: '', lng: '' })
  const [confirmId, setConfirmId] = useState(null)
  const [detalleId, setDetalleId] = useState(null)
  const [finalizarId, setFinalizarId] = useState(null)
  const [incModalId, setIncModalId] = useState(null)
  const [formError, setFormError] = useState('')
  const [vigilanteSearch, setVigilanteSearch] = useState('')
  const [showVigilanteList, setShowVigilanteList] = useState(false)

  const filtered = data.filter(r => {
    const matchSearch = r.area_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      r.vigilante?.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado
    return matchSearch && matchEstado
  })

  const activas = data.filter(r => r.estado === 'Activa').length
  const finalizadas = data.filter(r => r.estado === 'Finalizada').length

  const guardaparques = users.filter(u => u.role === 'guardaparque')
  const filteredGuardaparques = guardaparques.filter(u =>
    `${u.name} ${u.apellidos}`.toLowerCase().includes(vigilanteSearch.toLowerCase()) ||
    (u.documento && u.documento.toLowerCase().includes(vigilanteSearch.toLowerCase()))
  )

  const getCoords = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude.toFixed(7), lng: pos.coords.longitude.toFixed(7) }); setGeoLoading(false) },
      () => setGeoLoading(false)
    )
  }

  const openCreate = () => {
    setForm({ area_id: areas[0]?.id || '', vigilante: '', fecha: fechaHoy(), hora_inicio: '', descripcion: '' })
    setCoords({ lat: '', lng: '' })
    setFotoInicio(null)
    setFormError('')
    setVigilanteSearch('')
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = { ...form, lat_inicio: coords.lat, lng_inicio: coords.lng }
    const error = validateRonda(formData)
    if (error) {
      setFormError(error)
      return
    }
    setFormError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('lat_inicio', coords.lat)
    fd.append('lng_inicio', coords.lng)
    if (fotoInicio) fd.append('foto_inicio', fotoInicio)
    await api.post('/rondas', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    await refetch()
    setModal(false)
  }

  if (detalleId) {
    return <DetalleRonda rondaId={detalleId} isAdmin={isAdmin} onBack={() => setDetalleId(null)} onFinalizar={refetch} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rondas</h1>
          <p className="text-slate-500 text-sm mt-1">Supervisión y seguimiento de rondas ambientales</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Nueva ronda
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Activas', value: activas, color: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Finalizadas', value: finalizadas, color: 'bg-slate-50 text-slate-600 border-slate-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por Área o vigilante..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
          <option value="todos">Todos</option><option>Activa</option><option>Finalizada</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Cargando...</div> :
          filtered.length === 0 ? <div className="p-8 text-center text-slate-400">No hay rondas registradas</div> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Área', 'Vigilante', 'Fecha', 'Coord. inicio', 'Coord. fin', 'Estado', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.area_nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{item.vigilante}</td>
                    <td className="px-4 py-3 text-slate-600">{item.fecha?.split('T')[0]}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {item.lat_inicio ? <span className="flex items-center gap-1"><MapPin size={11} className="text-green-500" />{item.lat_inicio}, {item.lng_inicio}</span> : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge label={item.estado} variant={estadoVariant[item.estado]} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setDetalleId(item.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Ver detalle"><Eye size={15} /></button>
                        {isAdmin && item.estado !== 'Finalizada' && (
                          <>
                            <button onClick={() => setIncModalId(item.id)} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600" title="Agregar incidencia"><Plus size={15} /></button>
                            <button onClick={() => setFinalizarId(item.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600" title="Finalizar ronda"><Flag size={15} /></button>
                            {puedeEliminar('rondas') && <button onClick={() => setConfirmId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Eliminar"><Trash2 size={15} /></button>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {/* Modal nueva ronda */}
      {modal && (
        <Modal title="Nueva Ronda" onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{formError}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Área Resguardada <span className="text-red-500">*</span></label>
              <select required value={form.area_id} onChange={e => setForm({ ...form, area_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccionar Área...</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Elige el área protegida donde se realizará la ronda.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vigilante <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="text" required value={vigilanteSearch} onChange={e => { setVigilanteSearch(e.target.value); setShowVigilanteList(true) }} onFocus={() => setShowVigilanteList(true)} onBlur={() => setTimeout(() => setShowVigilanteList(false), 200)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Buscar vigilante..." />
                {showVigilanteList && filteredGuardaparques.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                    {filteredGuardaparques.map(u => (
                      <div key={u.id} onClick={() => { setForm({ ...form, vigilante: `${u.name} ${u.apellidos}` }); setVigilanteSearch(`${u.name} ${u.apellidos}`); setShowVigilanteList(false) }}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                        {`${u.name} ${u.apellidos}${u.documento ? ` · ${u.documento}` : ''}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">Busca y selecciona al vigilante responsable de la ronda.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha <span className="text-red-500">*</span></label>
                <input type="date" min={fechaHoy()} max={fechaHoy()} required value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="mt-1 text-xs text-slate-500">Fecha en la que se realiza la ronda; solo se permiten fechas de hoy.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hora inicio</label>
                <input type="time" value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <p className="mt-1 text-xs text-slate-500">Hora en que comienza la ronda; puede dejarse en blanco si no aplica.</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Coordenadas de inicio</label>
                <button type="button" onClick={getCoords} disabled={geoLoading}
                  className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50 flex items-center gap-1">
                  <MapPin size={12} /> {geoLoading ? 'Obteniendo...' : 'Usar mi ubicación'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="any" min="-90"  max="90"  value={coords.lat} onChange={e => setCoords({ ...coords, lat: e.target.value })}
                  placeholder="Latitud" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="number" step="any" min="-180" max="180" value={coords.lng} onChange={e => setCoords({ ...coords, lng: e.target.value })}
                  placeholder="Longitud" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              {coords.lat && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><MapPin size={11} /> Ubicación capturada: {coords.lat}, {coords.lng}</p>}
              <p className="mt-1 text-xs text-slate-500">Ingresa las coordenadas GPS de inicio en grados decimales o usa tu ubicación actual.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Camera size={14} /> Foto al iniciar</label>
              <input type="file" accept="image/*" onChange={e => setFotoInicio(e.target.files[0])}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
              <p className="mt-1 text-xs text-slate-500">Adjunta una foto opcional que documente el inicio de la ronda.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <p className="mt-1 text-xs text-slate-500">Describe observaciones importantes al iniciar la ronda.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Iniciar ronda</button>
            </div>
          </form>
        </Modal>
      )}

      {finalizarId && (
        <FinalizarModal
          rondaId={finalizarId}
          onClose={() => setFinalizarId(null)}
          onDone={() => { setFinalizarId(null); refetch() }}
        />
      )}
      {incModalId && (
        <AgregarIncidenciaModal
          rondaId={incModalId}
          onClose={() => setIncModalId(null)}
          onDone={() => { setIncModalId(null); refetch() }}
        />
      )}

      {confirmId && <ConfirmDialog message="¿Eliminar esta ronda??" onConfirm={() => { remove(confirmId); setConfirmId(null) }} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}
