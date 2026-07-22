<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { User, Bot } from 'lucide-vue-next'
import { renderMarkdown } from '../../lib/markdown'
import type { ChatMessage } from '../../types'

const { t } = useI18n()

const props = defineProps<{
  message: ChatMessage
}>()

const isUser = computed(() => props.message.role === 'user')
const isStreaming = computed(() => props.message.role === 'assistant' && !props.message.content)

const renderedContent = computed(() => {
  if (isUser.value || isStreaming.value) return props.message.content
  return renderMarkdown(props.message.content)
})
</script>

<template>
  <div
    :class="[
      'flex gap-3 p-3 rounded-lg',
      isUser ? 'bg-primary/5' : 'bg-muted/30'
    ]"
  >
    <div
      :class="[
        'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
        isUser ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground'
      ]"
    >
      <User v-if="isUser" class="size-4" />
      <Bot v-else class="size-4" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-xs font-medium text-muted-foreground mb-1">
        {{ isUser ? t('assistant.you') : t('assistant.assistant_label') }}
      </p>
      <div
        v-if="isStreaming"
        class="flex items-center gap-1 text-muted-foreground"
      >
        <span class="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style="animation-delay: 0ms" />
        <span class="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style="animation-delay: 150ms" />
        <span class="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style="animation-delay: 300ms" />
      </div>
      <div
        v-else-if="isUser"
        class="text-sm leading-relaxed whitespace-pre-wrap break-words"
        v-text="message.content"
      />
      <div
        v-else
        class="text-sm leading-relaxed markdown-content"
        v-html="renderedContent"
      />
    </div>
  </div>
</template>

<style scoped>
.markdown-content :deep(h1) {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0.75rem 0 0.5rem;
  line-height: 1.3;
}
.markdown-content :deep(h2) {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0.625rem 0 0.375rem;
  line-height: 1.35;
}
.markdown-content :deep(h3) {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.5rem 0 0.25rem;
}
.markdown-content :deep(h4) {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0.375rem 0 0.25rem;
}
.markdown-content :deep(p) {
  margin: 0.25rem 0;
}
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.25rem 0;
  padding-left: 1.25rem;
}
.markdown-content :deep(li) {
  margin: 0.125rem 0;
}
.markdown-content :deep(strong) {
  font-weight: 600;
}
.markdown-content :deep(.inline-code) {
  background: hsl(var(--muted) / 0.5);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  font-family: 'Menlo', 'Consolas', monospace;
}
.markdown-content :deep(.code-block) {
  background: hsl(var(--muted) / 0.6);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  position: relative;
}
.markdown-content :deep(.code-block .code-lang) {
  position: absolute;
  top: 0.25rem;
  right: 0.5rem;
  font-size: 0.625rem;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
  letter-spacing: 0.05em;
}
.markdown-content :deep(.code-block code) {
  font-size: 0.8125rem;
  font-family: 'Menlo', 'Consolas', monospace;
  white-space: pre-wrap;
  word-break: break-word;
}
.markdown-content :deep(blockquote) {
  border-left: 3px solid hsl(var(--primary) / 0.3);
  padding-left: 0.75rem;
  margin: 0.375rem 0;
  color: hsl(var(--muted-foreground));
}
.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid hsl(var(--border));
  margin: 0.75rem 0;
}
.markdown-content :deep(a) {
  color: hsl(var(--primary));
  text-decoration: underline;
}
.markdown-content :deep(a:hover) {
  opacity: 0.8;
}
.markdown-content :deep(img) {
  max-width: 100%;
  border-radius: 0.375rem;
  margin: 0.25rem 0;
}
.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.375rem 0;
  font-size: 0.8125rem;
}
.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid hsl(var(--border));
  padding: 0.375rem 0.625rem;
  text-align: left;
}
.markdown-content :deep(th) {
  background: hsl(var(--muted) / 0.4);
  font-weight: 600;
}
</style>
