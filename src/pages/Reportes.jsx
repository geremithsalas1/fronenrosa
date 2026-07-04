import { useState, useEffect } from 'react'
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  parseISO, isWithinInterval
} from 'date-fns'
import { es } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../services/api'
import {
  FileText, Download, Calendar, Route, Bird, Eye,
  Flower2, Flame, Sprout, Handshake, X, ChevronDown
} from 'lucide-react'
import useCrud from '../hooks/useCrud'
import useCatalogo from '../hooks/useCatalogo'
import Card from '../components/ui/Card'

// --- Helpers de fecha -----------------------------------------------------
function getRango(tipo, fecha) {
  const d = parseISO(fecha)
  if (tipo === 'diario') return { inicio: d, fin: d, label: format(d, "d 'de' MMMM yyyy", { locale: es }) }
  if (tipo === 'semanal') return { inicio: startOfWeek(d, { weekStartsOn: 1 }), fin: endOfWeek(d, { weekStartsOn: 1 }), label: `${format(startOfWeek(d, { weekStartsOn: 1 }), 'd MMM', { locale: es })} — ${format(endOfWeek(d, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: es })}` }
  return { inicio: startOfMonth(d), fin: endOfMonth(d), label: format(d, 'MMMM yyyy', { locale: es }) }
}

function filtrarPorFecha(rows, campo, inicio, fin) {
  if (!rows?.length) return []
  return rows.filter(r => {
    const v = r[campo]
    if (!v) return false
    try {
      const d = typeof v === 'string' ? parseISO(v.split('T')[0]) : v
      return isWithinInterval(d, { start: inicio, end: fin })
    } catch { return false }
  })
}

// --- Definición de módulos ------------------------------------------------
function useModulos() {
  const { data: rondas } = useCrud('/rondas')
  const { data: fauna } = useCrud('/fauna')
  const { data: estadosCons } = useCatalogo('/catalogos/estados-conservacion')
  const { data: seguimiento } = useCrud('/fauna-seguimiento')
  const { data: areas } = useCrud('/areas')
  const { data: metodos } = useCrud('/catalogos/metodos-observacion')
  const { data: flora } = useCrud('/flora')
  const { data: incendios } = useCrud('/incendios')
  const { data: reforestacion } = useCrud('/reforestacion')
  const { data: alianzas } = useCrud('/alianzas')

  return [
    {
      key: 'rondas', titulo: 'Rondas', icon: Route, color: 'green',
      descripcion: 'Reporte general de rondas, con opción para ver todas o por responsable e incidencias',
      columnas: ['Área', 'Vigilante', 'Fecha', 'Hora inicio', 'Estado'],
      getData: (inicio, fin, responsable) => filtrarPorFecha(rondas, 'fecha', inicio, fin)
        .filter(r => !responsable || r.vigilante === responsable)
        .map(r => [r.area_nombre || '—', r.vigilante, r.fecha?.split('T')[0] || '—', r.hora_inicio || '—', r.estado]),
      getResponsables: () => [...new Set(rondas.map(r => r.vigilante).filter(Boolean))],
      getRounds: (inicio, fin, responsable) => filtrarPorFecha(rondas, 'fecha', inicio, fin)
        .filter(r => !responsable || r.vigilante === responsable),
    },
    {
      key: 'fauna', titulo: 'Fauna', icon: Bird, color: 'blue',
      descripcion: 'Registro de especies de fauna por Área',
      columnas: ['Nombre común', 'Nombre científico', 'Tipo', 'Estado conservación', 'Población estimada'],
      getData: () => {
        const findEstado = id => (estadosCons || []).find(e => e.id === id)?.nombre || '—'
        return (fauna || []).map(r => [
          r.nombre_comun || '—',
          r.nombre_cientifico || '—',
          r.tipo || '—',
          findEstado(r.estado_conservacion_id),
          r.poblacion_estimada?.toString() || '—'
        ])
      },
    },
    {
      key: 'seguimiento', titulo: 'Seguimiento de Fauna', icon: Eye, color: 'teal',
      descripcion: 'Observaciones de fauna en campo con área, método y responsable',
      columnas: ['Especie', 'Área', 'Coordenadas', 'Método', 'Responsable', 'Fecha'],
      getData: (inicio, fin) => {
        const findArea = id => (areas || []).find(a => a.id === id)?.nombre || '—'
        const findMetodo = id => (metodos || []).find(m => m.id === id)?.nombre || '—'
        const findFauna = id => (fauna || []).find(f => f.id === id)?.nombre_comun || '—'
        return filtrarPorFecha(seguimiento, 'fecha', inicio, fin)
          .map(r => [
            findFauna(r.fauna_id),
            findArea(r.area_id),
            r.latitud && r.longitud ? `${r.latitud}, ${r.longitud}` : '—',
            findMetodo(r.metodo_id),
            r.responsable || '—',
            r.fecha?.split('T')[0] || '—'
          ])
      },
    },
    {
      key: 'flora', titulo: 'Flora', icon: Flower2, color: 'emerald',
      descripcion: 'Registro de especies de flora',
      columnas: ['Nombre común', 'Nombre científico', 'Tipo', 'Apta para reforestación', 'Condiciones óptimas'],
      getData: () => (flora || []).map(r => [
        r.nombre_comun || '—',
        r.nombre_cientifico || '—',
        r.tipo || '—',
        r.apta_reforestacion ? 'Sí' : 'No',
        r.condiciones_optimas?.trim() || '—'
      ]),
    },
    {
      key: 'incendios', titulo: 'Incendios Forestales', icon: Flame, color: 'red',
      descripcion: 'Registro de incendios forestales reportados',
      columnas: ['Latitud', 'Longitud', 'Área afectada', 'Magnitud', 'Hectáreas', 'Estado', 'Fecha'],
      getData: (inicio, fin) => filtrarPorFecha(incendios, 'fecha', inicio, fin)
        .map(r => [r.latitud?.toString() || '—', r.longitud?.toString() || '—', r.area_nombre || '—', r.magnitud || '—', r.hectareas_afectadas?.toString() || '—', r.estado, r.fecha?.split('T')[0] || '—']),
    },
    {
      key: 'reforestacion', titulo: 'Reforestación', icon: Sprout, color: 'lime',
      descripcion: 'Proyectos de reforestación ejecutados',
      columnas: ['Proyecto', 'Área', 'Especie', 'Cantidad', 'Responsable', 'Zona incendio', 'Fecha'],
      getData: (inicio, fin) => filtrarPorFecha(reforestacion, 'fecha', inicio, fin)
        .map(r => [r.nombre_proyecto, r.area_nombre || '—', r.especie_nombre || '—', r.cantidad?.toString() || '—', r.responsable || '—', r.zona_incendio ? 'Sí' : 'No', r.fecha?.split('T')[0] || '—']),
    },
    {
      key: 'alianzas', titulo: 'Alianzas', icon: Handshake, color: 'purple',
      descripcion: 'Convenios y alianzas institucionales',
      columnas: ['Organización', 'Tipo', 'Contacto', 'Email', 'Inicio', 'Fin', 'Estado'],
      getData: () => (alianzas || []).map(r => [r.organizacion, r.tipo || '—', r.contacto || '—', r.email || '—', r.fecha_inicio?.split('T')[0] || '—', r.fecha_fin?.split('T')[0] || '—', r.estado || '—']),
    },
  ]
}

// --- Generador PDF -------------------------------------------------------
function generarPDF(modulo, tipoPeriodo, rango, datos) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const verde = [22, 163, 74]
  const gris = [100, 116, 139]

  // Encabezado
  doc.setFillColor(...verde)
  doc.rect(0, 0, W, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('EcoGestión', 14, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Gestión Ambiental', 14, 16)
  doc.setFontSize(10)
  doc.text(`Generado: ${format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es })}`, W - 14, 13, { align: 'right' })

  // Título del reporte
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(modulo.titulo, 14, 32)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gris)
  doc.text(modulo.descripcion, 14, 38)

  // Período
  const periodoLabel = { diario: 'Diario', semanal: 'Semanal', mensual: 'Mensual' }[tipoPeriodo]
  doc.setFontSize(9)
  doc.setTextColor(...verde)
  doc.setFont('helvetica', 'bold')
  doc.text(`Período: ${periodoLabel}  |  ${rango.label}`, 14, 44)

  // Línea separadora
  doc.setDrawColor(...verde)
  doc.setLineWidth(0.5)
  doc.line(14, 47, W - 14, 47)

  // Tabla
  const columnStyles = modulo.key === 'flora' ? { 4: { cellWidth: 90 } } : {}
  autoTable(doc, {
    startY: 51,
    head: [modulo.columnas],
    body: datos.length > 0 ? datos : [Array(modulo.columnas.length).fill('Sin registros en este período')],
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: { fillColor: verde, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14 },
    columnStyles,
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(...gris)
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}  |  EcoGestión`,
        W / 2, doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
    }
  })

  const nombreArchivo = `${modulo.key}_${tipoPeriodo}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(nombreArchivo)
}

function generarPDFRondasResponsable(modulo, tipoPeriodo, rango, rondas, responsable) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const verde = [22, 163, 74]
  const gris = [100, 116, 139]

  const addPageIfNeeded = (y) => {
    if (y > H - 30) {
      doc.addPage()
      return 20
    }
    return y
  }

  doc.setFillColor(...verde)
  doc.rect(0, 0, W, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('EcoGestión', 14, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Gestión Ambiental', 14, 16)
  doc.setFontSize(10)
  doc.text(`Generado: ${format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es })}`, W - 14, 13, { align: 'right' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(modulo.titulo, 14, 32)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gris)
  doc.text(modulo.descripcion, 14, 38)

  const periodoLabel = { diario: 'Diario', semanal: 'Semanal', mensual: 'Mensual' }[tipoPeriodo]
  doc.setFontSize(9)
  doc.setTextColor(...verde)
  doc.setFont('helvetica', 'bold')
  doc.text(`Período: ${periodoLabel}  |  ${rango.label}`, 14, 44)
  doc.text(`Responsable: ${responsable || 'Todos'}`, 14, 49)

  let y = 55
  if (rondas.length === 0) {
    y = addPageIfNeeded(y)
    doc.setTextColor(...gris)
    doc.setFontSize(10)
    doc.text('No hay rondas en este período para el responsable seleccionado.', 14, y)
  }

  rondas.forEach((ronda, index) => {
    y = addPageIfNeeded(y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(11)
    const title = `${ronda.vigilante || 'Responsable'} — ${ronda.fecha?.split('T')[0] || 'Sin fecha'}`
    doc.text(title, 14, y)
    y += 6

    const marginLR = 14
    const availWidth = W - marginLR * 2
    const colWidth = availWidth / 5

    const groups = [
      {
        label: 'Datos de la ronda',
        head: ['Área', 'Vigilante', 'Fecha', 'Hora inicio', 'Hora fin'],
        body: [[
          ronda.area_nombre || '—',
          ronda.vigilante || '—',
          ronda.fecha?.split('T')[0] || '—',
          ronda.hora_inicio || '—',
          ronda.hora_fin || '—'
        ]],
        columnStyles: {
          0: { cellWidth: colWidth },
          1: { cellWidth: colWidth },
          2: { cellWidth: colWidth },
          3: { cellWidth: colWidth },
          4: { cellWidth: colWidth }
        }
      },
      {
        label: 'Información adicional',
        head: ['Estado', 'Coordenadas inicio', 'Coordenadas fin', 'Descripción', 'Observaciones'],
        body: [[
          ronda.estado || '—',
          ronda.lat_inicio && ronda.lng_inicio ? `${ronda.lat_inicio}, ${ronda.lng_inicio}` : '—',
          ronda.lat_fin && ronda.lng_fin ? `${ronda.lat_fin}, ${ronda.lng_fin}` : '—',
          ronda.descripcion || '—',
          ronda.observaciones || '—'
        ]],
        columnStyles: {
          0: { cellWidth: colWidth },
          1: { cellWidth: colWidth },
          2: { cellWidth: colWidth },
          3: { cellWidth: colWidth },
          4: { cellWidth: colWidth }
        }
      }
    ]

    groups.forEach((group) => {
      y = addPageIfNeeded(y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(30, 41, 59)
      doc.text(group.label, 14, y)
      y += 5

      autoTable(doc, {
        startY: y,
        head: [group.head],
        body: group.body,
        styles: {
          fontSize: 9,
          cellPadding: 5,
          textColor: [55, 65, 81],
          overflow: 'linebreak',
          valign: 'top'
        },
        headStyles: {
          fillColor: verde,
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: { fillColor: [244, 251, 244] },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.2,
        margin: { left: 14, right: 14 },
        columnStyles: group.columnStyles,
        tableWidth: 'auto',
        theme: 'grid'
      })

      y = doc.lastAutoTable.finalY + 10
    })

    const incidencias = ronda.incidencias || []
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...verde)
    doc.text(`Incidencias (${incidencias.length})`, 14, y)
    y += 6

    if (incidencias.length === 0) {
      y = addPageIfNeeded(y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...gris)
      doc.text('No se reportaron incidencias en esta ronda.', 14, y)
      y += 8
    } else {
      const body = incidencias.map(i => [
        i.tipo || '—',
        i.severidad_nombre || '—',
        i.latitud || '—',
        i.longitud || '—',
        i.requiere_intervencion ? 'Sí' : 'No',
        i.descripcion || '—'
      ])
      autoTable(doc, {
        startY: y,
        head: [['Tipo', 'Severidad', 'Latitud', 'Longitud', 'Intervención', 'Descripción']],
        body,
        styles: { fontSize: 9, cellPadding: 4, textColor: [30, 41, 59], overflow: 'linebreak' },
        headStyles: { fillColor: verde, textColor: 255, fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: [244, 251, 244] },
        columnStyles: { 5: { cellWidth: 100 } },
        margin: { left: 14, right: 14 },
        theme: 'grid'
      })
      y = doc.lastAutoTable.finalY + 10
    }

    if (index < rondas.length - 1) {
      // Draw a subtle separator between rondas
      y = addPageIfNeeded(y + 6)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.4)
      doc.line(14, y - 2, W - 14, y - 2)
      y += 4
    }
  })

  // Añadir numeración de páginas y pie con EcoGestión
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...gris)
    doc.text(`EcoGestión — Página ${i} de ${pageCount}`, W - 14, H - 8, { align: 'right' })
  }

  const nombreArchivo = `${modulo.key}_${tipoPeriodo}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(nombreArchivo)
}

// --- Modal de configuración ---------------------------------------------
function ReporteModal({ modulo, onClose }) {
  const [tipoPeriodo, setTipoPeriodo] = useState('mensual')
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [responsable, setResponsable] = useState('')
  const [generando, setGenerando] = useState(false)

  const rango = getRango(tipoPeriodo, fecha)
  const responsables = modulo.getResponsables ? modulo.getResponsables() : []
  const datos = modulo.getData ? modulo.getData(rango.inicio, rango.fin, responsable) : []
  const rondas = modulo.getRounds ? modulo.getRounds(rango.inicio, rango.fin, responsable) : []

  const handleGenerar = async () => {
    if (modulo.getRounds) {
      setGenerando(true)
      try {
        const rondasConIncidencias = await Promise.all(rondas.map(async (ronda) => {
          try {
            const res = await api.get(`/rondas/${ronda.id}/incidencias`)
            return { ...ronda, incidencias: res.data || [] }
          } catch {
            return { ...ronda, incidencias: [] }
          }
        }))
        generarPDFRondasResponsable(modulo, tipoPeriodo, rango, rondasConIncidencias, responsable)
      } finally {
        setGenerando(false)
      }
    } else {
      generarPDF(modulo, tipoPeriodo, rango, datos)
    }
  }

  const periodos = [
    { key: 'diario', label: 'Diario' },
    { key: 'semanal', label: 'Semanal' },
    { key: 'mensual', label: 'Mensual' },
  ]

  const inputLabel = { diario: 'Seleccionar día', semanal: 'Seleccionar semana', mensual: 'Seleccionar mes' }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${modulo.color}-50 text-${modulo.color}-600`}>
              <modulo.icon size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">{modulo.titulo}</h2>
              <p className="text-xs text-slate-400">Configurar reporte PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Tipo de período */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de período</label>
            <div className="grid grid-cols-3 gap-2">
              {periodos.map(p => (
                <button key={p.key} onClick={() => setTipoPeriodo(p.key)}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${tipoPeriodo === p.key ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">Elige cómo agrupar la información del reporte.</p>
          </div>

          {/* Selector de fecha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Calendar size={14} className="inline mr-1.5 text-slate-400" />
              {inputLabel[tipoPeriodo]}
            </label>
            <input
              type={tipoPeriodo === 'mensual' ? 'month' : 'date'}
              value={tipoPeriodo === 'mensual' ? fecha.slice(0, 7) : fecha}
              onChange={e => {
                const v = e.target.value
                setFecha(tipoPeriodo === 'mensual' ? `${v}-01` : v)
              }}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="mt-1 text-xs text-slate-500">Selecciona la fecha o mes que quieres incluir en el reporte.</p>
          </div>

          {modulo.getResponsables && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Responsable</label>
              <select value={responsable} onChange={e => setResponsable(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Todos</option>
                {responsables.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">Filtra el reporte por responsable si quieres ver solo su trabajo.</p>
            </div>
          )}

          {/* Rango calculado */}
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <p className="text-xs text-green-600 font-medium mb-0.5">Rango del reporte</p>
            <p className="text-sm font-semibold text-green-800">{rango.label}</p>
            <p className="text-xs text-green-600 mt-1">{datos.length} registro{datos.length !== 1 ? 's' : ''} encontrado{datos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleGenerar} disabled={generando}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <Download size={15} /> {generando ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Página principal ----------------------------------------------------
const colorMap = {
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  teal: 'bg-teal-50 text-teal-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  lime: 'bg-lime-50 text-lime-700',
  purple: 'bg-purple-50 text-purple-600',
}

export default function Reportes() {
  const modulos = useModulos()
  const [activo, setActivo] = useState(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
        <p className="text-slate-500 text-sm mt-1">Genera reportes PDF por módulo y período de tiempo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modulos.map(m => (
          <Card key={m.key} className="p-5 hover:shadow-md transition-shadow cursor-pointer group" >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[m.color]}`}>
                <m.icon size={20} />
              </div>
              <FileText size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm mb-1">{m.titulo}</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">{m.descripcion}</p>
            <button
              onClick={() => setActivo(m)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-green-50 hover:text-green-700 border border-slate-200 hover:border-green-200 rounded-xl text-xs font-medium text-slate-600 transition-colors"
            >
              <Download size={13} /> Generar reporte
            </button>
          </Card>
        ))}
      </div>

      {activo && <ReporteModal modulo={activo} onClose={() => setActivo(null)} />}
    </div>
  )
}
