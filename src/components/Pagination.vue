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
  <div v-if="meta && meta.last_page > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/40">
    <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
      Showing {{ (meta.current_page - 1) * meta.per_page + 1 }} to {{ Math.min(meta.current_page * meta.per_page, meta.total) }} of {{ meta.total }} entries
    </span>
    <div class="flex items-center gap-1">
      <Button variant="outline" size="icon" class="size-8" :disabled="meta.current_page <= 1" @click="emit('page', meta.current_page - 1)">
        <ChevronLeft class="size-3.5" />
      </Button>
      
      <div class="flex items-center gap-1">
        <button v-for="(p, i) in pages()" :key="i"
          @click="typeof p === 'number' && emit('page', p)"
          :class="[
            'min-w-[32px] h-8 rounded-md text-[11px] font-semibold transition-all border',
            p === meta.current_page
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : typeof p === 'number' 
                ? 'bg-background border-border hover:bg-accent text-foreground' 
                : 'bg-transparent border-transparent text-muted-foreground cursor-default'
          ]"
        >
          {{ p }}
        </button>
      </div>

      <Button variant="outline" size="icon" class="size-8" :disabled="meta.current_page >= meta.last_page" @click="emit('page', meta.current_page + 1)">
        <ChevronRight class="size-3.5" />
      </Button>
    </div>
  </div>
</template>
