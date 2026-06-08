import api from '../../lib/axios'

export const useVariantApi = () => {
  const bySku = (sku: string) => api.get(`/variants/by-sku/${encodeURIComponent(sku)}`)
  const list = (params?: Record<string, any>) => api.get('/variants', { params })

  return { bySku, list }
}
