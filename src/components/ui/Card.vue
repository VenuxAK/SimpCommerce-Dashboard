<script setup lang="ts">
import { cn } from '../../lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('rounded-md border border-zinc-200/60 dark:border-zinc-800/60 bg-card text-card-foreground shadow-sm transition-all duration-300', props.class)">
    <slot />
  </div>
</template>
