<script setup lang="ts">
defineProps<{
  icon?: any
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="py-20 text-center border rounded-xl border-dashed">
    <component :is="icon" v-if="icon" class="size-10 mx-auto text-muted-foreground/20 mb-4" />
    <p class="text-sm font-medium text-muted-foreground">{{ title || 'No data found.' }}</p>
    <p v-if="description" class="text-xs text-muted-foreground/60 mt-1">{{ description }}</p>
  </div>
</template>
