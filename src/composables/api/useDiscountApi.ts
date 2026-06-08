import api from '../../lib/axios'

export const useDiscountApi = () => {
  const list = (params?: Record<string, any>) => api.get('/discounts', { params })
  const get = (id: number) => api.get(`/discounts/${id}`)
  const create = (data: any) => api.post('/discounts', data)
  const update = (id: number, data: any) => api.put(`/discounts/${id}`, data)
  const remove = (id: number) => api.delete(`/discounts/${id}`)
  const getActive = () => api.get('/discounts/active')

  return { list, get, create, update, remove, getActive }
}
