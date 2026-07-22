import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useChatApi } from '../composables/api/useChatApi'
import type { ChatConversation, ChatMessage } from '../types'

function getAppLocale(): string {
  return localStorage.getItem('locale') || 'en'
}

export const useChatStore = defineStore('chat', () => {
  const api = useChatApi()

  const conversations = ref<ChatConversation[]>([])
  const activeConversation = ref<ChatConversation | null>(null)
  const isOpen = ref(false)
  const isMinimized = ref(false)
  const isFullScreen = ref(false)
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const error = ref<string | null>(null)
  const streamAbortController = ref<AbortController | null>(null)
  const currentPageContext = ref<string | null>(null)

  const messages = computed<ChatMessage[]>(() => {
    return activeConversation.value?.messages ?? []
  })

  function togglePanel() {
    if (isOpen.value && !isMinimized.value) {
      isOpen.value = false
      isMinimized.value = false
      isFullScreen.value = false
    } else {
      isOpen.value = true
      isMinimized.value = false
    }
    error.value = null
  }

  function openPanel() {
    isOpen.value = true
    isMinimized.value = false
    error.value = null
  }

  function closePanel() {
    isOpen.value = false
    isMinimized.value = false
    isFullScreen.value = false
    error.value = null
  }

  function minimizePanel() {
    isMinimized.value = true
    isFullScreen.value = false
  }

  function maximizePanel() {
    isMinimized.value = false
  }

  function toggleFullScreen() {
    isFullScreen.value = !isFullScreen.value
  }

  function setPageContext(context: string | null) {
    currentPageContext.value = context
  }

  async function fetchConversations() {
    try {
      const response = await api.listConversations()
      conversations.value = response.data
    } catch {
      // Silently fail
    }
  }

  async function selectConversation(conversation: ChatConversation) {
    try {
      const response = await api.getConversation(conversation.id)
      activeConversation.value = response.data
      error.value = null
    } catch {
      error.value = 'Failed to load conversation.'
    }
  }

  async function startNewConversation(firstMessage: string) {
    try {
      error.value = null

      const response = await api.createConversation({
        first_message: firstMessage,
        page_context: currentPageContext.value ?? undefined,
      })

      // Server no longer saves the first message — we add it locally.
      const localUserMsg: ChatMessage = {
        id: Date.now(),
        chat_conversation_id: response.data.id,
        role: 'user',
        content: firstMessage,
        metadata: null,
        created_at: new Date().toISOString(),
      }
      response.data.messages = [localUserMsg]
      activeConversation.value = response.data
      conversations.value.unshift(response.data)

      // Stream the AI response for this first message.
      streamAiResponse(response.data.id, firstMessage)
    } catch {
      error.value = 'Failed to create conversation.'
    }
  }

  function streamAiResponse(conversationId: number, userMessage: string) {
    isStreaming.value = true
    streamingContent.value = ''
    error.value = null

    // Show the user message immediately if not already shown.
    if (activeConversation.value) {
      const msgs = activeConversation.value.messages
      const alreadyShown = msgs.some(
        (m) => m.role === 'user' && m.content === userMessage,
      )
      if (!alreadyShown) {
        msgs.push({
          id: Date.now(),
          chat_conversation_id: conversationId,
          role: 'user',
          content: userMessage,
          metadata: null,
          created_at: new Date().toISOString(),
        })
      }

      // Add a placeholder assistant message.
      msgs.push({
        id: Date.now() + 1,
        chat_conversation_id: conversationId,
        role: 'assistant',
        content: '',
        metadata: null,
        created_at: new Date().toISOString(),
      })
    }

    streamAbortController.value = api.streamMessage(
      conversationId,
      userMessage,
      currentPageContext.value,
      getAppLocale(),
      {
        onDelta(delta: string) {
          streamingContent.value += delta
          if (activeConversation.value) {
            const msgs = activeConversation.value.messages
            const lastMsg = msgs[msgs.length - 1]
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = streamingContent.value
            }
          }
        },
        onDone(_fullContent: string) {
          isStreaming.value = false
          if (activeConversation.value) {
            api.getConversation(conversationId).then((response) => {
              activeConversation.value = response.data
            })
          }
        },
        onError(errMsg: string) {
          isStreaming.value = false
          error.value = errMsg
          if (activeConversation.value) {
            const msgs = activeConversation.value.messages
            const lastMsg = msgs[msgs.length - 1]
            if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
              lastMsg.content = 'Sorry, something went wrong. Please try again.'
            }
          }
        },
      },
    )
  }

  function cancelStream() {
    streamAbortController.value?.abort()
    isStreaming.value = false
  }

  async function deleteConversation(id: number) {
    try {
      await api.deleteConversation(id)
      conversations.value = conversations.value.filter((c) => c.id !== id)
      if (activeConversation.value?.id === id) {
        activeConversation.value = null
      }
    } catch {
      error.value = 'Failed to delete conversation.'
    }
  }

  return {
    conversations,
    activeConversation,
    isOpen,
    isMinimized,
    isFullScreen,
    isStreaming,
    streamingContent,
    error,
    messages,
    currentPageContext,
    togglePanel,
    openPanel,
    closePanel,
    minimizePanel,
    maximizePanel,
    toggleFullScreen,
    setPageContext,
    fetchConversations,
    selectConversation,
    startNewConversation,
    streamAiResponse,
    cancelStream,
    deleteConversation,
  }
})
