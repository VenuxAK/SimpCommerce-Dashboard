import api from '../../lib/axios'

export const useProductApi = () => {
  const list = (params?: Record<string, any>) => api.get('/products', { params })
  const get = (id: number) => api.get(`/products/${id}`)
  const create = (data: any) => api.post('/products', data)
  const update = (id: number, data: any) => api.put(`/products/${id}`, data)
  const remove = (id: number) => api.delete(`/products/${id}`)
  const exportCsv = () => api.get('/products/export/csv', { responseType: 'blob' })

  return { list, get, create, update, remove, exportCsv }
}
