import api from '../../lib/axios'

export const useInvoiceApi = () => {
  const list = (params?: Record<string, any>) => api.get('/invoices', { params })
  const get = (id: number) => api.get(`/invoices/${id}`)
  const receipt = (id: number) => api.get(`/invoices/${id}/receipt`, { responseType: 'blob' })
  const pdf = (id: number) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })

  return { list, get, receipt, pdf }
}
