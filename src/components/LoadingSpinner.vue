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
        ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md text-foreground transition-all duration-300 animate-in fade-in'
        : 'flex flex-col h-64 items-center justify-center text-muted-foreground gap-3'
    ]"
  >
    <div class="relative flex items-center justify-center">
      <!-- Outer track ring -->
      <div
        class="rounded-full border-[3px] border-primary/10 shrink-0"
        :style="{ width: size + 'px', height: size + 'px' }"
      />
      <!-- Active spinning arc -->
      <div
        class="absolute animate-spin rounded-full border-[3px] border-primary border-t-transparent shrink-0"
        :style="{ width: size + 'px', height: size + 'px' }"
      />
    </div>
    <span class="text-[10px] font-semibold tracking-widest uppercase animate-pulse text-muted-foreground/80">Loading...</span>
  </div>
</template>
