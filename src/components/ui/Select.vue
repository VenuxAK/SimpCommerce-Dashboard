<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { cn } from '../../lib/utils'
import { ChevronDown, Check } from 'lucide-vue-next'

interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue?: string | number | null
  options: Option[]
  placeholder?: string
  class?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string | number | null] }>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)

const selectedLabel = ref('')

function toggle() {
  isOpen.value = !isOpen.value
}

function selectOption(option: Option) {
  emit('update:modelValue', option.value)
  selectedLabel.value = option.label
  isOpen.value = false
}

function updateLabel() {
  const selected = props.options.find(o => o.value === props.modelValue)
  selectedLabel.value = selected ? selected.label : (props.placeholder || 'Select...')
}

function handleClickOutside(e: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  updateLabel()
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="selectRef" :class="cn('relative w-full', props.class)">
    <button
      type="button"
      @click="toggle"
      :class="cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs font-bold uppercase tracking-tight shadow-none transition-all cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40',
        isOpen ? 'ring-2 ring-primary/10 border-primary/40' : ''
      )"
    >
      <span :class="cn('truncate', !props.modelValue && 'text-muted-foreground font-medium')">
        {{ selectedLabel }}
      </span>
      <ChevronDown :class="cn('size-3.5 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')" />
    </button>

    <div
      v-if="isOpen"
      class="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-md border border-border/60 bg-card p-1 shadow-xl shadow-foreground/10 animate-in fade-in zoom-in-95 duration-200"
    >
      <div
        v-for="option in props.options"
        :key="option.value"
        @click="selectOption(option)"
        :class="cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-xs font-bold uppercase tracking-tight transition-all hover:bg-secondary hover:text-foreground',
          props.modelValue === option.value ? 'bg-secondary text-primary' : 'text-muted-foreground'
        )"
      >
        <span v-if="props.modelValue === option.value" class="absolute left-2 flex size-3.5 items-center justify-center">
          <Check class="size-3" />
        </span>
        <span class="truncate">{{ option.label }}</span>
      </div>
      <div v-if="props.options.length === 0" class="p-4 text-center text-[10px] font-black text-muted-foreground uppercase">
        No options available
      </div>
    </div>
  </div>
</template>
