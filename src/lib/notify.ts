import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'info'

interface Notification {
  id: number
  message: string
  type: NotificationType
}

const notifications = ref<Notification[]>([])
let nextId = 0

export function useNotify() {
  function notify(message: string, type: NotificationType = 'info', duration = 4000) {
    const id = nextId++
    notifications.value.push({ id, message, type })
    setTimeout(() => {
      notifications.value = notifications.value.filter((n) => n.id !== id)
    }, duration)
  }

  function success(message: string) {
    notify(message, 'success')
  }

  function error(message: string) {
    notify(message, 'error', 6000)
  }

  function info(message: string) {
    notify(message, 'info')
  }

  return { notifications, notify, success, error, info }
}

export const notificationState = useNotify()
