<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sparkles } from 'lucide-vue-next'

const { t } = useI18n()

const emit = defineEmits<{ select: [text: string] }>()

const promptKeys = [
  'assistant.prompt_products',
  'assistant.prompt_pos',
  'assistant.prompt_inventory',
  'assistant.prompt_discounts',
  'assistant.prompt_reports',
  'assistant.prompt_customers',
  'assistant.prompt_cash',
  'assistant.prompt_users',
] as const

const prompts = computed(() =>
  promptKeys.map((key) => ({ key, text: t(key) }))
)

function handleClick(text: string) {
  emit('select', text)
}
</script>

<template>
  <div class="grid grid-cols-2 gap-2">
    <button
      v-for="prompt in prompts"
      :key="prompt.key"
      @click="handleClick(prompt.text)"
      class="flex items-start gap-2 text-left p-2.5 rounded-lg border border-border/60 bg-background hover:border-primary/40 hover:bg-accent/50 transition-colors group"
    >
      <Sparkles class="size-3.5 text-primary/60 group-hover:text-primary mt-0.5 flex-shrink-0" />
      <span class="text-xs leading-snug text-muted-foreground group-hover:text-foreground line-clamp-2">
        {{ prompt.text }}
      </span>
    </button>
  </div>
</template>
