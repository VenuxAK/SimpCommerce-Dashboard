export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    completed: 'success',
    pending: 'warning',
    processing: 'warning',
    shipped: 'default',
    delivered: 'success',
    cancelled: 'destructive',
    refunded: 'secondary',
    sale: 'secondary',
    adjustment: 'warning',
  }
  return map[status] || 'default'
}
