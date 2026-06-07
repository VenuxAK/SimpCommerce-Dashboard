<script setup lang="ts">
withDefaults(defineProps<{
  size?: number
}>(), {
  size: 24,
})
</script>

<template>
  <div class="flex h-64 items-center justify-center text-muted-foreground">
    <div
      class="animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0"
      :style="{ width: size + 'px', height: size + 'px' }"
    />
  </div>
</template>
