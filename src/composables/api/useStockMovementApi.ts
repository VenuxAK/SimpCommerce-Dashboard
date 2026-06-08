import api from '../../lib/axios'

export const useStockMovementApi = () => {
  const list = (params?: Record<string, any>) => api.get('/stock-movements', { params })

  return { list }
}
