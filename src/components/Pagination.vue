<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from './ui/button'

interface Meta {
  current_page: number
  last_page: number
  total: number
  per_page: number
}

const props = defineProps<{ meta: Meta | null }>()
const emit = defineEmits<{ page: [value: number] }>()

function pages(): (number | string)[] {
  if (!props.meta) return []
  const current = props.meta.current_page
  const last = props.meta.last_page
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)

  const result: (number | string)[] = [1]
  if (current > 3) result.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
    result.push(i)
  }
  if (current < last - 2) result.push('...')
  if (last > 1) result.push(last)
  return result
}
</script>

<template>
  <div v-if="meta && meta.last_page > 1" class="flex items-center justify-between gap-4 pt-2">
    <span class="text-xs text-zinc-400 dark:text-zinc-500">
      {{ (meta.current_page - 1) * meta.per_page + 1 }}–{{ Math.min(meta.current_page * meta.per_page, meta.total) }} of {{ meta.total }}
    </span>
    <div class="flex items-center gap-1">
      <Button variant="ghost" size="icon" :disabled="meta.current_page <= 1" @click="emit('page', meta.current_page - 1)">
        <ChevronLeft class="size-4" />
      </Button>
      <button v-for="p in pages()" :key="p"
        @click="typeof p === 'number' && emit('page', p)"
        class="min-w-[28px] h-8 rounded-md text-xs font-medium transition-colors"
        :class="p === meta.current_page
          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
          : typeof p === 'number' ? 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800' : 'text-zinc-300 cursor-default'"
      >
        {{ p }}
      </button>
      <Button variant="ghost" size="icon" :disabled="meta.current_page >= meta.last_page" @click="emit('page', meta.current_page + 1)">
        <ChevronRight class="size-4" />
      </Button>
    </div>
  </div>
</template>
