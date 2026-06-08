import api from '../../lib/axios'

export const useAuthApi = () => {
  const login = (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials)

  const me = () => api.get('/auth/me')

  return { login, me }
}
