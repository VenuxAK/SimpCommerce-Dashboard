import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

export function createEcho() {
  const port = import.meta.env.VITE_REVERB_PORT
  return new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY ?? '',
    wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    ...(port && { wsPort: Number(port) }),
    ...(port && { wssPort: Number(port) }),
    forceTLS: !port,
    enabledTransports: port ? ['ws'] : ['wss'],
    authorizer: (_channel: any, _options: any) => ({
      authorize: (socketId: string, callback: any) => {
        callback(null, { auth: '' })
      },
    }),
  })
}
