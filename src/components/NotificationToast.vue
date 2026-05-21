<script setup lang="ts">
import { notificationState } from '../lib/notify'
import { cn } from '../lib/utils'
import { X } from 'lucide-vue-next'

const { notifications } = notificationState

function dismiss(id: number) {
  const idx = notifications.value.findIndex((n) => n.id === id)
  if (idx > -1) notifications.value.splice(idx, 1)
}

function bgClass(type: string) {
  return {
    success: 'bg-green-600 dark:bg-green-500',
    error: 'bg-red-600 dark:bg-red-500',
    info: 'bg-zinc-800 dark:bg-zinc-700',
  }[type] || 'bg-zinc-800'
}
</script>

<template>
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 min-w-[280px] max-w-sm pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="n in notifications"
        :key="n.id"
        :class="cn(
          'flex items-start gap-2 px-4 py-3 rounded-lg text-white text-sm shadow-lg transition-all pointer-events-auto',
          bgClass(n.type),
        )"
      >
        <span class="flex-1 min-w-0">{{ n.message }}</span>
        <button @click="dismiss(n.id)" class="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
          <X class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(30px); }
.toast-leave-to { opacity: 0; transform: translateX(30px); }
</style>
