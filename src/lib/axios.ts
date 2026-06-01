import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }

  const ui = useUIStore()
  if (ui.activeStoreSlug) {
    config.headers['X-Store'] = ui.activeStoreSlug
  }

  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      auth.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
