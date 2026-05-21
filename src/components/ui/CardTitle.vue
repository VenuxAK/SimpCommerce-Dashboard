<script setup lang="ts">
import { cn } from '../../lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <h3 :class="cn('font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-100', props.class)">
    <slot />
  </h3>
</template>
