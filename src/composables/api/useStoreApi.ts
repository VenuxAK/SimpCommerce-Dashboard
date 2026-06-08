import api from '../../lib/axios'

export const useStoreApi = () => {
  const list = () => api.get('/stores')
  const create = (data: any) => api.post('/stores', data)
  const update = (id: number, data: any) => api.put(`/stores/${id}`, data)
  const remove = (id: number) => api.delete(`/stores/${id}`)

  return { list, create, update, remove }
}
