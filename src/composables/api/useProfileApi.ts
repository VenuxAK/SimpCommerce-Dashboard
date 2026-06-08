import api from '../../lib/axios'

export const useProfileApi = () => {
  const get = () => api.get('/profile')
  const update = (data: any) => api.put('/profile', data)

  return { get, update }
}
