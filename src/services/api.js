import axios from 'axios'

const rawBaseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : ''
const apiBaseUrl = rawBaseUrl
  ? rawBaseUrl.endsWith('/api')
    ? rawBaseUrl
    : `${rawBaseUrl}/api`
  : '/api'

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' }
})

export const getAssetUrl = (path) => {
  if (!path) return ''
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!rawBaseUrl) return normalizedPath
  return `${rawBaseUrl}${normalizedPath}`
}

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eco_token')
      localStorage.removeItem('eco_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
