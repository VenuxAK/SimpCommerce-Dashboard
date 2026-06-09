import api from '../../lib/axios'

export const useOrderApi = () => {
  const list = (params?: Record<string, any>) => api.get('/orders', { params })
  const get = (id: number) => api.get(`/orders/${id}`)
  const create = (data: any, idempotencyKey?: string) => 
    api.post('/orders', data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
    })
  const updateStatus = (id: number, status: string, tracking?: string) =>
    api.patch(`/orders/${id}/status`, { status, tracking_number: tracking })
  const returnItems = (id: number, items: any[]) =>
    api.post(`/orders/${id}/return`, { items })

  return { list, get, create, updateStatus, returnItems }
}
