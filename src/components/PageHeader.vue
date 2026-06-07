<script setup lang="ts">
import { Button } from './ui/button'

defineProps<{
  title?: string
  subtitle?: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div>
      <h1 class="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{{ title }}</h1>
      <p v-if="subtitle" class="text-xs text-muted-foreground mt-1">{{ subtitle }}</p>
    </div>
    <Button v-if="actionLabel" @click="emit('action')" class="w-full sm:w-auto">{{ actionLabel }}</Button>
  </div>
</template>
