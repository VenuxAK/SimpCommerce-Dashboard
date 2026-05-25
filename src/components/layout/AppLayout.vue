<script setup lang="ts">
import { ref } from 'vue'
import { Menu } from 'lucide-vue-next'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { useUIStore } from '../../stores/ui'

const sidebarOpen = ref(false)
const ui = useUIStore()
</script>

<template>
  <div class="flex min-h-screen bg-background text-foreground transition-colors selection:bg-primary/20">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
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
