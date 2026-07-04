/**
 * Solo letras a-z, tildes, ñ y espacios (para nombres de personas)
 * Limita a 40 caracteres (primer nombre + apellido)
 */
export function soloLetras(value) {
  return value
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
    .slice(0, 40)
}

/**
 * Solo letras a-z y tildes, sin puntos, guiones ni caracteres especiales
 * Para nombres comunes y científicos de especies
 * Limita a 60 caracteres
 */
export function soloNombreCientifico(value) {
  return value
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
    .slice(0, 60)
}

/**
 * Solo letras a-z, tildes, ñ y espacios (para nombres de áreas)
 * Limita a 80 caracteres
 */
export function soloNombreArea(value) {
  return value
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
    .slice(0, 80)
}

/**
 * Letras y números, sin caracteres especiales (para nombres de proyectos)
 * Permite espacios. Limita a 100 caracteres
 */
export function soloAlfanumerico(value) {
  return value
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
    .slice(0, 100)
}

/**
 * Retorna el valor mínimo de fecha permitido (1 enero del año actual)
 */
export function fechaMinHoy() {
  return `${new Date().getFullYear()}-01-01`
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fechaHoy() {
  return formatDate(new Date())
}

export function fechaMaxDosMeses() {
  const date = new Date()
  date.setMonth(date.getMonth() + 2)
  return formatDate(date)
}
