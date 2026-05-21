<script setup lang="ts">
import { ref } from 'vue'
import { Menu } from 'lucide-vue-next'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="flex-1 flex flex-col min-w-0 lg:ml-56">
      <header class="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-white dark:bg-zinc-950 dark:border-zinc-800 px-4 sm:px-6">
        <button @click="sidebarOpen = true" class="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
          <Menu class="size-5" />
        </button>
        <div class="flex-1" />
        <AppHeader />
      </header>
      <main class="flex-1 p-4 sm:p-6 overflow-x-hidden">
        <router-view />
      </main>
    </div>
  </div>
</template>
