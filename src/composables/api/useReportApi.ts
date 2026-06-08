import api from '../../lib/axios'

export const useReportApi = () => {
  const sales = (params: Record<string, string>) => api.get('/reports/sales', { params })
  const bestSellers = (params: Record<string, any>) => api.get('/reports/best-sellers', { params })
  const paymentMethods = (params: Record<string, string>) => api.get('/reports/payment-methods', { params })
  const dashboard = () => api.get('/dashboard/summary')

  return { sales, bestSellers, paymentMethods, dashboard }
}
