<script setup lang="ts">
import { cn } from '../../lib/utils'

interface SelectOption {
  value: string | number
  label: string
}

interface Props {
  class?: string
  modelValue?: string | number
  options: SelectOption[]
  placeholder?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onChange(e: Event) {
  const target = e.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <select
    :value="props.modelValue"
    @change="onChange"
    :class="cn(
      'flex h-9 w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors',
      'border-zinc-200 dark:border-zinc-700',
      'text-zinc-900 dark:text-zinc-100',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500',
      'disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>
