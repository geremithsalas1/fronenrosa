import { useState, useEffect } from 'react'
import {
  Shield, Bird, Flower2, Flame, Sprout, Handshake, Route,
  AlertTriangle, Clock, TrendingUp, TreePine, MapPin, Users
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import api from '../services/api'

function BarChart({ data, valueKey, labelKey, color = 'bg-green-500', unit = '' }) {
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1)
  return (
    <div className="space-y-2">
      {data.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">Sin datos disponibles</p>
      ) : data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-10 text-right flex-shrink-0">{d[labelKey]}</span>
          <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden">
            <div
              className={`h-full ${color} rounded-md transition-all flex items-center justify-end pr-2`}
              style={{ width: `${(Number(d[valueKey]) / max) * 100}%`, minWidth: Number(d[valueKey]) > 0 ? '2rem' : '0' }}
            >
              {Number(d[valueKey]) > 0 && (
                <span className="text-xs text-white font-medium">{Number(d[valueKey])}{unit}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data }) {
  const colors = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2']
  const total = data.reduce((a, b) => a + Number(b.total), 0)
  if (total === 0) return <p className="text-sm text-slate-400 text-center py-4">Sin datos disponibles</p>

  let offset = 0
  const radius = 40
  const circ = 2 * Math.PI * radius
  const segments = data.map((d, i) => {
    const pct = Number(d.total) / total
    const dash = pct * circ
    const seg = { ...d, dash, offset, color: colors[i % colors.length] }
    offset += dash
    return seg
  })

  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100" className="flex-shrink-0">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="16" />
        {segments.map((s, i) => (
          <circle key={i} cx="50" cy="50" r={radius} fill="none"
            stroke={s.color} strokeWidth="16"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset + circ * 0.25}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
          />
        ))}
        <text x="50" y="54" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e293b">{total}</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-slate-600 truncate flex-1">{s.tipo || s.zona || '—'}</span>
            <span className="text-xs font-semibold text-slate-800">{s.total}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }) {
  const cls = {
    green:  'bg-green-50 text-green-600',
    blue:   'bg-blue-50 text-blue-600',
    red:    'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    teal:   'bg-teal-50 text-teal-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cls[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setData(r.data))
      .catch(e => {
        console.error('Dashboard:', e.response?.data?.message || e.message)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando métricas...</p>
        </div>
      </div>
    )
  }

  const t = data?.totales || {}
  const alertasIncendios = data?.alertas?.incendiosActivos || []
  const alertasAlianzas = data?.alertas?.alianzasVencidas || []
  const totalAlertas = alertasIncendios.length + alertasAlianzas.length
  const actividad = data?.actividadReciente || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen general del sistema ambiental</p>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Stat icon={Shield} label="Áreas" value={t.areas ?? 0} color="green" />
        <Stat icon={Bird} label="Fauna" value={t.fauna ?? 0} color="blue" />
        <Stat icon={Flower2} label="Flora" value={t.flora ?? 0} color="teal" />
        <Stat icon={Flame} label="Incendios" value={t.incendios ?? 0} color="red" />
        <Stat icon={Sprout} label="Reforestación" value={t.reforestacion ?? 0} color="green" />
        <Stat icon={Handshake} label="Alianzas" value={t.alianzas ?? 0} color="purple" />
        <Stat icon={Route} label="Rondas" value={t.rondas ?? 0} color="yellow" />
        <Stat icon={Users} label="Usuarios activos" value={t.usuarios ?? 0} color="blue" />
      </div>

      {/* Fila 1: Incendios + Árboles por mes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Flame size={16} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Incendios reportados por mes</h2>
              <p className="text-xs text-slate-400">Últimos 6 meses</p>
            </div>
          </div>
          <BarChart data={data?.incendiosByMes || []} valueKey="total" labelKey="mes" color="bg-red-400" />
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <TreePine size={16} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Árboles plantados por mes</h2>
              <p className="text-xs text-slate-400">Últimos 6 meses</p>
            </div>
          </div>
          <BarChart data={data?.arbolesbyMes || []} valueKey="total" labelKey="mes" color="bg-green-500" />
        </Card>
      </div>

      {/* Fila 2: División fauna */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Bird size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">División de fauna</h2>
              <p className="text-xs text-slate-400">Especies por tipo</p>
            </div>
          </div>
          <DonutChart data={data?.faunaByTipo || []} />
        </Card>
      </div>

      {/* Fila 3: Actividad reciente + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Clock size={16} className="text-slate-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Actividad reciente</h2>
          </div>
          {actividad.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin actividad reciente</p>
          ) : (
            <ul className="space-y-3">
              {actividad.map((r) => (
                <li key={r.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Route size={14} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">
                      Ronda en {r.area_nombre || 'área sin nombre'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.vigilante} · {r.fecha?.split('T')[0]}
                    </p>
                  </div>
                  <Badge label={r.estado} variant={r.estado === 'Activa' ? 'green' : 'gray'} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle size={16} className="text-red-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Alertas del sistema</h2>
            </div>
            {totalAlertas > 0 && (
              <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                {totalAlertas}
              </span>
            )}
          </div>

          {totalAlertas === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-2">
                <TrendingUp size={18} className="text-green-500" />
              </div>
              <p className="text-sm text-slate-500">Sin alertas activas</p>
              <p className="text-xs text-slate-400 mt-0.5">El sistema opera con normalidad</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {alertasIncendios.map(inc => (
                <li key={`inc-${inc.id}`} className="flex items-start gap-3 p-2.5 bg-red-50 rounded-xl border border-red-100">
                  <Flame size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-red-700">Incendio activo</p>
                    <p className="text-xs text-red-600 truncate">{inc.latitud}, {inc.longitud} · {inc.fecha?.split('T')[0]}</p>
                  </div>
                </li>
              ))}
              {alertasAlianzas.map(al => (
                <li key={`al-${al.id}`} className="flex items-start gap-3 p-2.5 bg-yellow-50 rounded-xl border border-yellow-100">
                  <Handshake size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-yellow-700">Alianza {al.alerta}</p>
                    <p className="text-xs text-yellow-600 truncate">{al.organizacion} · vence {al.fecha_fin?.split('T')[0]}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
