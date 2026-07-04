import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export default function useCrud(endpoint) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(endpoint)
      setData(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = async (payload) => {
    const res = await api.post(endpoint, payload)
    setData(prev => [res.data, ...prev])
    return res.data
  }

  const update = async (id, payload) => {
    const res = await api.put(`${endpoint}/${id}`, payload)
    setData(prev => prev.map(item => item.id === id ? res.data : item))
    return res.data
  }

  const remove = async (id) => {
    await api.delete(`${endpoint}/${id}`)
    setData(prev => prev.filter(item => item.id !== id))
  }

  return { data, loading, error, create, update, remove, refetch: fetchAll }
}
