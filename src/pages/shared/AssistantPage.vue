<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Send, Square, Trash2, MessageSquarePlus, Sparkles, MessageCircle } from 'lucide-vue-next'
import AiChatMessage from '../../components/ai/AiChatMessage.vue'
import AiPromptCards from '../../components/ai/AiPromptCards.vue'
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

function handlePromptSelect(text: string) {
  input.value = text
  handleSend()
}
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] gap-0">
    <!-- ================================================================ -->
    <!-- LEFT SIDEBAR — Conversation History -->
    <!-- ================================================================ -->
    <aside class="w-64 lg:w-72 border-r bg-muted/10 flex flex-col flex-shrink-0">
      <div class="flex items-center justify-between px-4 py-3 border-b">
        <div class="flex items-center gap-2">
          <MessageCircle class="size-4 text-primary" />
          <span class="text-sm font-semibold">{{ t('assistant.title_short') }}</span>
        </div>
        <button
          @click="handleNewChat"
          class="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          :title="t('assistant.new_chat')"
        >
          <MessageSquarePlus class="size-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
        <div v-if="chat.conversations.length === 0" class="text-center py-8 px-3">
          <p class="text-sm text-muted-foreground">{{ t('assistant.no_conversations') }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ t('assistant.get_started') }}</p>
        </div>
        <button
          v-for="conv in chat.conversations"
          :key="conv.id"
          @click="handleSelectConversation(conv.id)"
          :class="[
            'w-full text-left px-3 py-2.5 rounded-lg transition-colors group',
            chat.activeConversation?.id === conv.id
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-accent text-foreground'
          ]"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium truncate flex-1">{{ conv.title }}</p>
            <button
              @click.stop="chat.deleteConversation(conv.id)"
              class="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              :title="t('assistant.delete_chat')"
            >
              <Trash2 class="size-3" />
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ conv.message_count ?? conv.messages?.length ?? 0 }}
            {{ (conv.message_count ?? conv.messages?.length) === 1 ? t('assistant.message') : t('assistant.messages') }}
          </p>
        </button>
      </div>
    </aside>

    <!-- ================================================================ -->
    <!-- RIGHT MAIN AREA -->
    <!-- ================================================================ -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- No active conversation → Welcome screen -->
      <template v-if="!chat.activeConversation">
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div class="mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles class="size-8 text-primary" />
          </div>
          <h2 class="text-xl font-semibold text-foreground mb-2">{{ t('assistant.welcome') }}</h2>
          <p class="text-sm text-muted-foreground mb-8">{{ t('assistant.welcome_subtext') }}</p>

          <div class="w-full max-w-xl">
            <AiPromptCards @select="handlePromptSelect" />
          </div>
        </div>
      </template>

      <!-- Active conversation → Messages -->
      <template v-else>
        <!-- Conversation header -->
        <div class="flex items-center justify-between px-4 py-2 border-b bg-muted/10 flex-shrink-0">
          <p class="text-sm font-medium truncate">{{ chat.activeConversation.title }}</p>
          <div class="flex items-center gap-0.5">
            <button
              @click="handleNewChat"
              class="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              :title="t('assistant.new_chat')"
            >
              <MessageSquarePlus class="size-4" />
            </button>
            <button
              @click="chat.deleteConversation(chat.activeConversation.id!)"
              class="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              :title="t('assistant.delete_chat')"
            >
              <Trash2 class="size-4" />
            </button>
          </div>
        </div>

        <!-- Messages list -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 max-w-3xl mx-auto w-full"
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
      <div class="border-t p-4 bg-background flex-shrink-0">
        <div class="max-w-3xl mx-auto w-full flex items-end gap-3">
          <textarea
            v-model="input"
            @keydown="handleKeydown"
            :disabled="chat.isStreaming"
            :placeholder="t('assistant.placeholder')"
            rows="1"
            class="flex-1 min-h-[42px] max-h-[150px] resize-none rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            v-if="chat.isStreaming"
            @click="chat.cancelStream()"
            class="flex-shrink-0 p-2.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            :title="t('assistant.stop')"
          >
            <Square class="size-4" />
          </button>
          <button
            v-else
            @click="handleSend"
            :disabled="!input.trim()"
            class="flex-shrink-0 p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            :title="t('assistant.send')"
          >
            <Send class="size-4" />
          </button>
        </div>
        <p class="text-[10px] text-muted-foreground mt-2 text-center max-w-3xl mx-auto">
          {{ t('assistant.disclaimer') }}
        </p>
      </div>
    </div>
  </div>
</template>
