import { useState, useEffect } from 'react'
import api from '../services/api'

// Cache en memoria para no repetir peticiones
const cache = {}

export default function useCatalogo(endpoint) {
  const [data, setData] = useState(cache[endpoint] || [])
  const [loading, setLoading] = useState(!cache[endpoint])

  useEffect(() => {
    if (cache[endpoint]) { setData(cache[endpoint]); setLoading(false); return }
    api.get(endpoint)
      .then(r => { cache[endpoint] = r.data; setData(r.data) })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [endpoint])

  return { data, loading }
}
