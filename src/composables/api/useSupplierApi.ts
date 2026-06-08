import api from '../../lib/axios'

export const useSupplierApi = () => {
  const list = (params?: Record<string, any>) => api.get('/suppliers', { params })
  const create = (data: any) => api.post('/suppliers', data)
  const update = (id: number, data: any) => api.put(`/suppliers/${id}`, data)
  const remove = (id: number) => api.delete(`/suppliers/${id}`)

  return { list, create, update, remove }
}
