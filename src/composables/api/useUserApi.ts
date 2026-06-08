import api from '../../lib/axios'

export const useUserApi = () => {
  const list = (params?: Record<string, any>) => api.get('/users', { params })
  const create = (data: any) => api.post('/users', data)
  const update = (id: number, data: any) => api.put(`/users/${id}`, data)
  const remove = (id: number) => api.delete(`/users/${id}`)

  return { list, create, update, remove }
}
