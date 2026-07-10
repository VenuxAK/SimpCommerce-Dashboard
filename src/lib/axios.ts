import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 seconds
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }

  const ui = useUIStore()
  let storeSlug = ui.activeStoreSlug

  if (!storeSlug && typeof window !== 'undefined') {
    const match = window.location.pathname.match(/^\/store\/([^/]+)/)
    if (match) {
      storeSlug = match[1]
    }
  }

  if (storeSlug) {
    config.headers['X-Store'] = storeSlug
  }

  const locale = localStorage.getItem('locale') || 'en'
  config.headers['Accept-Language'] = locale

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

    // Enhance timeout/network errors with readable messages
    if (error.code === 'ECONNABORTED') {
      error.message = 'The server took too long to respond. Please try again.'
    } else if (error.response?.status === 503 || error.response?.status === 504) {
      error.message = 'Service temporarily unavailable. Please try again later.'
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection.'
    }

    return Promise.reject(error)
  },
)

export default api
