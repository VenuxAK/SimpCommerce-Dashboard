<script setup lang="ts">
import { ref } from 'vue'
import { cn } from '../../lib/utils'

// Disable automatic attribute inheritance to manually bind them to the input element
defineOptions({
  inheritAttrs: false
})

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
    v-bind="$attrs"
    :value="props.modelValue"
    :type="props.type"
    :placeholder="props.placeholder"
    @input="onInput"
    :class="cn(
      'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
  />
</template>
