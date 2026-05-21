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
      'flex h-9 w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
      'border-zinc-200 dark:border-zinc-700',
      'text-zinc-900 dark:text-zinc-100',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500',
      'disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
  />
</template>
