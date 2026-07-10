<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Menu } from 'lucide-vue-next'
import StoreSidebar from './StoreSidebar.vue'
import AppHeader from './AppHeader.vue'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { createEcho } from '../../lib/echo'
import { useNotify } from '../../lib/notify'

const sidebarOpen = ref(false)
const ui = useUIStore()
const auth = useAuthStore()

const SidebarComponent = StoreSidebar

const notifier = useNotify()
let echoInstance: ReturnType<typeof createEcho> | null = null

function connectEcho() {
  if (!auth.token) return
  disconnectEcho()

  echoInstance = createEcho()
  const channel = echoInstance.channel(`store.${ui.activeStoreSlug || 'main'}`)

  channel.listen('.new-order', (data: any) => {
    notifier.info(`New order: ${data.title}`)
    window.dispatchEvent(new CustomEvent('notification-received'))
  })

  channel.listen('.payment-confirmed', (data: any) => {
    notifier.success(`Payment confirmed: ${data.title}`)
    window.dispatchEvent(new CustomEvent('notification-received'))
  })
}

function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}

onMounted(() => {
  if (auth.token) connectEcho()
})

watch(() => auth.token, (token) => {
  if (token) connectEcho()
  else disconnectEcho()
})

onUnmounted(() => disconnectEcho())
</script>

<template>
  <div class="flex min-h-screen bg-background text-foreground transition-colors selection:bg-primary/20">
    <component :is="SidebarComponent" :open="sidebarOpen" @close="sidebarOpen = false" />
    <div
      :class="[
        'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
        ui.sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
      ]"
    >
      <header class="sticky top-0 z-30 flex h-14 items-center border-b bg-background/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
        <button @click="sidebarOpen = true" class="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent text-muted-foreground transition-colors">
          <Menu class="size-5" />
        </button>
        <AppHeader />
      </header>
      <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div class="mx-auto w-full">
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
