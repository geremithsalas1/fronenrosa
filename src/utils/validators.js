export const isEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
export const isPhone = (value) => !value || /^[0-9+\-\s]{7,20}$/.test(value.trim())
export const isLat = (value) => value === '' || value === null || value === undefined || (!Number.isNaN(Number(value)) && Number(value) >= -90 && Number(value) <= 90)
export const isLng = (value) => value === '' || value === null || value === undefined || (!Number.isNaN(Number(value)) && Number(value) >= -180 && Number(value) <= 180)
export const isPositive = (value) => value !== '' && value !== null && value !== undefined && !Number.isNaN(Number(value)) && Number(value) > 0
export const isNonNegative = (value) => value !== '' && value !== null && value !== undefined && !Number.isNaN(Number(value)) && Number(value) >= 0
export const isValidDate = (value) => !!value && !Number.isNaN(Date.parse(value))
export const isValidTime = (value) => !!value && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
export const isStrongPassword = (value) => typeof value === 'string' && value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)

function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) {
    const date = new Date(value)
    date.setHours(0, 0, 0, 0)
    return date
  }
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (match) {
    const [, year, month, day] = match
    return new Date(Number(year), Number(month) - 1, Number(day))
  }
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function addMonths(date, months) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  result.setHours(0, 0, 0, 0)
  return result
}
export const isMaxLength = (value, len) => value === undefined || value === null || value.toString().trim().length <= len

export function formatError(message) {
  return message || ''
}

export function validateArea(form) {
  if (!form.nombre?.trim()) return 'El nombre es obligatorio'
  if (!isMaxLength(form.nombre, 150)) return 'El nombre no puede exceder 150 caracteres'
  if (form.latitud !== '' && !isLat(form.latitud)) return 'Latitud inválida'
  if (form.longitud !== '' && !isLng(form.longitud)) return 'Longitud inválida'
  if (form.extension === '' || form.extension === null || form.extension === undefined) return 'La extensión es obligatoria'
  if (!isPositive(form.extension)) return 'La extensión debe ser mayor a 0'
  if (!isMaxLength(form.descripcion, 1000)) return 'La descripción no puede exceder 1000 caracteres'
  return null
}

export function validateUsuario(form, requirePassword = true) {
  if (!form.name?.trim()) return 'El nombre es obligatorio'
  if (!isMaxLength(form.name, 150)) return 'El nombre no puede exceder 150 caracteres'
  if (!form.email?.trim()) return 'El correo es obligatorio'
  if (!isEmail(form.email)) return 'Correo inválido'
  if (form.telefono && !isPhone(form.telefono)) return 'Teléfono inválido'
  if (requirePassword && !isStrongPassword(form.password)) return 'La contraseña debe tener al menos 8 caracteres y combinar letras y números'
  return null
}

export function validateAlianza(form) {
  if (!form.organizacion?.trim()) return 'La organización es obligatoria'
  if (!isMaxLength(form.organizacion, 150)) return 'La organización no puede exceder 150 caracteres'
  if (form.email && !isEmail(form.email)) return 'Correo inválido'
  if (form.fecha_inicio && !isValidDate(form.fecha_inicio)) return 'Fecha de inicio inválida'
  if (form.fecha_fin && !isValidDate(form.fecha_fin)) return 'Fecha de fin inválida'
  if (form.fecha_inicio && form.fecha_fin) {
    const inicio = new Date(form.fecha_inicio)
    const fin = new Date(form.fecha_fin)
    if (fin < inicio) return 'La fecha de fin no puede ser anterior a la fecha de inicio'
    const maxFin = new Date(inicio)
    maxFin.setFullYear(maxFin.getFullYear() + 10)
    if (fin > maxFin) return 'La fecha de fin no puede ser mayor a 10 años después de la fecha de inicio'
  }
  if (!isMaxLength(form.descripcion, 1000)) return 'La descripción no puede exceder 1000 caracteres'
  return null
}

export function validateFauna(form) {
  if (!form.nombre_comun?.trim()) return 'El nombre común es obligatorio'
  if (!isMaxLength(form.nombre_comun, 60)) return 'El nombre común no puede exceder 60 caracteres'
  if (form.nombre_cientifico && !isMaxLength(form.nombre_cientifico, 60)) return 'El nombre científico no puede exceder 60 caracteres'
  if (form.poblacion_estimada !== '' && form.poblacion_estimada !== null && !isNonNegative(form.poblacion_estimada)) return 'La población estimada debe ser mayor o igual a 0'
  return null
}

export function validateFlora(form) {
  if (!form.nombre_comun?.trim()) return 'El nombre común es obligatorio'
  if (!isMaxLength(form.nombre_comun, 60)) return 'El nombre común no puede exceder 60 caracteres'
  if (form.nombre_cientifico && !isMaxLength(form.nombre_cientifico, 60)) return 'El nombre científico no puede exceder 60 caracteres'
  if (form.apta_reforestacion && !form.condiciones_optimas?.trim()) return 'Las condiciones son obligatorias para especies aptas para reforestación'
  if (!isMaxLength(form.condiciones_optimas, 1000)) return 'Las condiciones no pueden exceder 1000 caracteres'
  return null
}

export function validateReforestacion(form) {
  if (!form.nombre_proyecto?.trim()) return 'El nombre del proyecto es obligatorio'
  if (!isMaxLength(form.nombre_proyecto, 200)) return 'El nombre del proyecto no puede exceder 200 caracteres'
  if (!form.cantidad || !isPositive(form.cantidad)) return 'La cantidad debe ser mayor a 0'
  if (form.fecha && !isValidDate(form.fecha)) return 'Fecha inválida'
  if (form.fecha) {
    const fecha = parseDate(form.fecha)
    const hoy = parseDate(new Date().toISOString().split('T')[0])
    const maxFecha = addMonths(hoy, 2)
    if (!fecha) return 'Fecha inválida'
    if (fecha < hoy) return 'La fecha no puede ser anterior a hoy'
    if (fecha > maxFecha) return 'La fecha no puede ser mayor a dos meses desde hoy'
    if (fecha.getTime() === hoy.getTime() && form.estado === 'Programada') return 'En la fecha actual el estado debe ser En proceso'
  }
  if (!isMaxLength(form.descripcion, 1000)) return 'La descripción no puede exceder 1000 caracteres'
  return null
}

export function validateIncendio(form) {
  if (!isLat(form.latitud) || !isLng(form.longitud)) return 'Coordenadas inválidas'
  if (form.hectareas_afectadas !== '' && form.hectareas_afectadas !== null && !isNonNegative(form.hectareas_afectadas)) return 'Las hectáreas deben ser mayor o igual a 0'
  if (form.fecha && !isValidDate(form.fecha)) return 'Fecha inválida'
  if (form.fecha && new Date(form.fecha) > new Date()) return 'La fecha no puede ser futura'
  if (form.fecha_deteccion && !isValidDate(form.fecha_deteccion)) return 'Fecha de detección inválida'
  if (form.fecha_deteccion && new Date(form.fecha_deteccion) > new Date()) return 'La fecha de detección no puede ser futura'
  if (form.fecha && form.fecha_deteccion && new Date(form.fecha_deteccion) < new Date(form.fecha)) return 'La fecha de detección no puede ser anterior a la fecha del incendio'
  if (!isMaxLength(form.descripcion, 1000)) return 'La descripción no puede exceder 1000 caracteres'
  return null
}

export function validateRonda(form) {
  if (!form.area_id) return 'Seleccione un área'
  if (!form.vigilante?.trim()) return 'El vigilante es obligatorio'
  if (!form.fecha) return 'La fecha es obligatoria'
  if (!isValidDate(form.fecha)) return 'Fecha inválida'
  const fecha = parseDate(form.fecha)
  const hoy = parseDate(new Date().toISOString().split('T')[0])
  if (fecha && hoy && fecha > hoy) return 'La fecha no puede ser futura'
  if (form.hora_inicio && !isValidTime(form.hora_inicio)) return 'Hora de inicio inválida'
  if (!isLat(form.lat_inicio) || !isLng(form.lng_inicio)) return 'Coordenadas inválidas'
  return null
}

export function validateIncidencia(form) {
  if (!form.tipo) return 'El tipo de incidencia es obligatorio'
  if (form.requiere_intervencion && !form.descripcion?.trim()) return 'La descripción es obligatoria cuando se requiere intervención'
  if (!isLat(form.latitud) || !isLng(form.longitud)) return 'Coordenadas inválidas'
  return null
}

export function validateObservacionFauna(form) {
  if (!form.fauna_id) return 'Seleccione una especie'
  if (!form.metodo_id) return 'Seleccione un método de observación'
  if (!form.fecha || !isValidDate(form.fecha)) return 'La fecha es obligatoria y debe ser válida'
  if (new Date(form.fecha) > new Date()) return 'La fecha no puede ser futura'
  if (form.hora && !isValidTime(form.hora)) return 'Hora inválida'
  if (!isLat(form.latitud) || !isLng(form.longitud)) return 'Coordenadas inválidas'
  return null
}
