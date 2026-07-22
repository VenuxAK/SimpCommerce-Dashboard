<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Send, Square, Trash2, MessageSquarePlus } from 'lucide-vue-next'
import AiChatMessage from './AiChatMessage.vue'
import { useChatStore } from '../../stores/chat'

const { t } = useI18n()
const chat = useChatStore()

const input = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(() => chat.messages.length, scrollToBottom)
watch(() => chat.streamingContent, scrollToBottom)

onMounted(() => {
  chat.fetchConversations()
})

function handleSend() {
  const text = input.value.trim()
  if (!text || chat.isStreaming) return

  input.value = ''

  if (!chat.activeConversation) {
    chat.startNewConversation(text)
  } else {
    chat.streamAiResponse(chat.activeConversation.id, text)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleNewChat() {
  chat.activeConversation = null
  input.value = ''
}

function handleSelectConversation(id: number) {
  const conv = chat.conversations.find((c) => c.id === id)
  if (conv) {
    chat.selectConversation(conv)
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Conversation History (when no active conversation) -->
    <div v-if="!chat.activeConversation" class="flex-1 flex flex-col">
      <div class="flex items-center justify-between px-4 py-2 border-b">
        <p class="text-xs text-muted-foreground">{{ t('assistant.recent') }}</p>
        <button
          @click="handleNewChat"
          class="p-1 rounded-md hover:bg-accent text-muted-foreground transition-colors"
          :title="t('assistant.new_chat')"
        >
          <MessageSquarePlus class="size-3.5" />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-3 space-y-1">
        <div v-if="chat.conversations.length === 0" class="text-center py-8">
          <p class="text-sm text-muted-foreground">{{ t('assistant.no_conversations') }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ t('assistant.get_started') }}</p>
        </div>
        <button
          v-for="conv in chat.conversations"
          :key="conv.id"
          @click="handleSelectConversation(conv.id)"
          class="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors group"
        >
          <p class="text-sm font-medium truncate">{{ conv.title }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ conv.message_count ?? conv.messages?.length ?? 0 }} {{ conv.message_count === 1 || conv.messages?.length === 1 ? t('assistant.message') : t('assistant.messages') }}
          </p>
        </button>
      </div>
    </div>

    <!-- Messages Area (when active conversation) -->
    <template v-else>
      <!-- Conversation actions bar -->
      <div class="flex items-center justify-between px-3 py-1.5 border-b bg-muted/10">
        <p class="text-xs text-muted-foreground truncate flex-1 mr-2">
          {{ chat.activeConversation.title }}
        </p>
        <div class="flex items-center gap-0.5">
          <button
            @click="handleNewChat"
            class="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            :title="t('assistant.new_chat')"
          >
            <MessageSquarePlus class="size-3.5" />
          </button>
          <button
            @click="chat.deleteConversation(chat.activeConversation.id!)"
            class="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            :title="t('assistant.delete_chat')"
          >
            <Trash2 class="size-3.5" />
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-3 space-y-2"
      >
        <AiChatMessage
          v-for="msg in chat.messages"
          :key="msg.id"
          :message="msg"
        />
        <div
          v-if="chat.error"
          class="text-sm text-destructive bg-destructive/5 rounded-lg p-3"
        >
          {{ chat.error }}
        </div>
      </div>
    </template>

    <!-- Input Area -->
    <div class="border-t p-3">
      <div class="flex items-end gap-2">
        <textarea
          v-model="input"
          @keydown="handleKeydown"
          :disabled="chat.isStreaming"
          :placeholder="t('assistant.placeholder')"
          rows="1"
          class="flex-1 min-h-[36px] max-h-[120px] resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        <button
          v-if="chat.isStreaming"
          @click="chat.cancelStream()"
          class="flex-shrink-0 p-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          :title="t('assistant.stop')"
        >
          <Square class="size-4" />
        </button>
        <button
          v-else
          @click="handleSend"
          :disabled="!input.trim()"
          class="flex-shrink-0 p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          :title="t('assistant.send')"
        >
          <Send class="size-4" />
        </button>
      </div>
      <p class="text-[10px] text-muted-foreground mt-1.5 text-center">
        {{ t('assistant.disclaimer') }}
      </p>
    </div>
  </div>
</template>
