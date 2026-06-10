import api from '../../lib/axios'

export const useBrandApi = () => {
  const list = (params?: Record<string, any>) => api.get('/brands', { params })
  const create = (data: any) => api.post('/brands', data)
  const update = (id: number, data: any) => api.put(`/brands/${id}`, data)
  const remove = (id: number) => api.delete(`/brands/${id}`)

  return { list, create, update, remove }
}
