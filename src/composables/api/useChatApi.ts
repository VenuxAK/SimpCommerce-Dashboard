import api from '../../lib/axios'
import type { ChatConversation, ChatMessage } from '../../types'

export function useChatApi() {
  /** List conversations for the current user. */
  async function listConversations(page = 1): Promise<{
    data: ChatConversation[]
    meta?: { current_page: number; last_page: number; per_page: number; total: number }
  }> {
    const { data } = await api.get('/chat/conversations', { params: { page } })
    return data
  }

  /** Get a single conversation with its messages. */
  async function getConversation(id: number): Promise<{ data: ChatConversation }> {
    const { data } = await api.get(`/chat/conversations/${id}`)
    return data
  }

  /** Create a new conversation with an initial message. */
  async function createConversation(payload: {
    first_message: string
    page_context?: string
  }): Promise<{ data: ChatConversation }> {
    const { data } = await api.post('/chat/conversations', payload)
    return data
  }

  /** Delete a conversation. */
  async function deleteConversation(id: number): Promise<void> {
    await api.delete(`/chat/conversations/${id}`)
  }

  /**
   * Stream an AI response via SSE.
   *
   * Returns an AbortController so the caller can cancel the stream.
   * Calls `onDelta` with each content chunk as it arrives.
   * Calls `onDone` when the stream completes.
   * Calls `onError` if the stream fails.
   */
  function streamMessage(
    conversationId: number,
    content: string,
    pageContext: string | null,
    locale: string,
    callbacks: {
      onDelta: (delta: string) => void
      onDone: (fullContent: string) => void
      onError: (error: string) => void
    },
  ): AbortController {
    const controller = new AbortController()
    const token = localStorage.getItem('token')
    const storeSlug = getStoreSlug()

    const url = `${import.meta.env.VITE_API_URL || '/api/v1'}/chat/conversations/${conversationId}/messages`

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${token}`,
        'X-Store': storeSlug,
      },
      body: JSON.stringify({ content, page_context: pageContext, locale }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({ message: 'Stream error' }))
          callbacks.onError(err.message || 'Stream error')
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          callbacks.onError('No response body')
          return
        }

        const decoder = new TextDecoder()
        let fullContent = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue

            const data = trimmed.slice(6)
            if (data === '[DONE]') {
              callbacks.onDone(fullContent)
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.delta) {
                fullContent += parsed.delta
                callbacks.onDelta(parsed.delta)
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        callbacks.onDone(fullContent)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          callbacks.onError(err.message || 'Connection error')
        }
      })

    return controller
  }

  return {
    listConversations,
    getConversation,
    createConversation,
    deleteConversation,
    streamMessage,
  }
}

/** Extract the store slug from the current route. */
function getStoreSlug(): string {
  const match = window.location.pathname.match(/\/store\/([^/]+)/)
  return match ? match[1] : 'main'
}
