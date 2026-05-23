<script setup lang="ts">
import { ref } from 'vue'
import { cn } from '../../lib/utils'

interface Props {
  class?: string
  type?: string
  modelValue?: string | number
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
})
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const inputEl = ref<HTMLInputElement | null>(null)

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function focus() {
  inputEl.value?.focus()
}

defineExpose({ focus, el: inputEl })
</script>

<template>
  <input
    ref="inputEl"
    :value="props.modelValue"
    :type="props.type"
    :placeholder="props.placeholder"
    @input="onInput"
    :class="cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-bold uppercase tracking-tight shadow-none transition-all',
      'file:border-0 file:bg-transparent file:text-sm file:font-black',
      'placeholder:text-muted-foreground/50 placeholder:font-medium',
      'text-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:border-primary/40',
      'disabled:cursor-not-allowed disabled:opacity-30',
      props.class,
    )"
  />
</template>
