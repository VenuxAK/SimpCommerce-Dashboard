import api from '../../lib/axios'

export const useCashSessionApi = () => {
  const list = () => api.get('/cash-sessions')
  const active = () => api.get('/cash-sessions/active')
  const open = (openingBalance: number) => api.post('/cash-sessions/open', { opening_balance: openingBalance })
  const close = (closingBalance: number) => api.post('/cash-sessions/close', { closing_balance: closingBalance })

  return { list, active, open, close }
}
