import api from '../../lib/axios'

export const useNotificationApi = () => {
  const list = (params?: Record<string, any>) => api.get('/notifications', { params })
  const unreadCount = () => api.get('/notifications/unread-count')
  const markRead = (id: number) => api.put(`/notifications/${id}/read`)
  const markAllRead = () => api.post('/notifications/read-all')
  const clear = () => api.delete('/notifications/clear')

  return { list, unreadCount, markRead, markAllRead, clear }
}
