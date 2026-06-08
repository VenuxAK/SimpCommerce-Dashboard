import api from '../../lib/axios'

export const useCategoryApi = () => {
  const list = (params?: Record<string, any>) => api.get('/categories', { params })
  const create = (data: any) => api.post('/categories', data)
  const update = (id: number, data: any) => api.put(`/categories/${id}`, data)
  const remove = (id: number) => api.delete(`/categories/${id}`)

  return { list, create, update, remove }
}
