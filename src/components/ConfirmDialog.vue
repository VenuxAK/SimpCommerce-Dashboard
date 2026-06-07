<script setup lang="ts">
import { Button } from './ui/button'

defineProps<{
  title?: string
  message?: string
  confirmText?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" @click.self="emit('cancel')">
      <div class="w-full max-w-sm rounded-lg border bg-popover p-6 shadow-xl animate-in fade-in zoom-in-95">
        <h3 class="text-sm font-semibold text-foreground mb-2">{{ title || 'Confirm' }}</h3>
        <p class="text-xs text-muted-foreground mb-4">{{ message || 'Are you sure?' }}</p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="emit('cancel')">Cancel</Button>
          <Button size="sm" variant="destructive" @click="emit('confirm')">{{ confirmText || 'Confirm' }}</Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
