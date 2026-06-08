import api from '../../lib/axios'

export const useAuditLogApi = () => {
  const list = (params?: Record<string, any>) => api.get('/audit-logs', { params })

  return { list }
}
