<script setup lang="ts">
withDefaults(defineProps<{
  size?: number
  full?: boolean
}>(), {
  size: 40,
  full: false,
})
</script>

<template>
  <div
    :class="[
      full
        ? 'fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm text-muted-foreground transition-all duration-300 animate-in fade-in'
        : 'flex h-64 items-center justify-center text-muted-foreground'
    ]"
  >
    <div
      class="animate-spin rounded-full border-[3px] border-primary border-t-transparent shrink-0"
      :style="{ width: size + 'px', height: size + 'px' }"
    />
  </div>
</template>
