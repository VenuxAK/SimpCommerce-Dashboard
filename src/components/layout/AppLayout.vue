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
  <div class="flex min-h-screen bg-background text-foreground transition-colors selection:bg-primary/10 selection:text-primary">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div 
      :class="[
        'flex-1 flex flex-col min-w-0 transition-all duration-300',
        ui.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-56'
      ]"
    >
      <header class="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/60 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
        <button @click="sidebarOpen = true" class="lg:hidden p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors">
          <Menu class="size-5" />
        </button>
        <div class="flex-1" />
        <AppHeader />
      </header>
      <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div class="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>
