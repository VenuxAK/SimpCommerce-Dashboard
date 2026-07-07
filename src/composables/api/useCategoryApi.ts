import api from '../../lib/axios'

export const useCategoryApi = () => {
  const list = (params?: Record<string, any>) => api.get('/categories', { params })
  const create = (data: any) => api.post('/categories', data)
  const update = (id: number, data: any) => api.put(`/categories/${id}`, data)
  const remove = (id: number) => api.delete(`/categories/${id}`)
  const uploadImage = (id: number, formData: FormData) => api.post(`/categories/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })

  return { list, create, update, remove, uploadImage }
}
