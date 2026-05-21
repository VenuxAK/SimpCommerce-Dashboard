<script setup lang="ts">
import { cn } from '../../lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('rounded-xl border bg-white dark:bg-zinc-900/80 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm dark:shadow-zinc-900/50 transition-colors', props.class)">
    <slot />
  </div>
</template>
