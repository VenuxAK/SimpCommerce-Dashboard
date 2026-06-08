import api from '../../lib/axios'

export const useCustomerApi = () => {
  const list = (params?: Record<string, any>) => api.get('/customers', { params })
  const get = (id: number) => api.get(`/customers/${id}`)
  const getOrders = (id: number) => api.get(`/customers/${id}/orders`)
  const create = (data: any) => api.post('/customers', data)
  const update = (id: number, data: any) => api.put(`/customers/${id}`, data)
  const remove = (id: number) => api.delete(`/customers/${id}`)

  return { list, get, getOrders, create, update, remove }
}
