<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessageCircle, X, Minus, Maximize2, Minimize2, ExternalLink } from 'lucide-vue-next'
import AiChatPanel from './AiChatPanel.vue'
import { useChatStore } from '../../stores/chat'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '../../stores/ui'

const { t } = useI18n()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()
const ui = useUIStore()

watch(
  () => route.meta?.helpContext,
  (ctx) => {
    chat.setPageContext((ctx as string) ?? null)
  },
  { immediate: true },
)

function handleToggle() {
  chat.togglePanel()
}

function handleOpenFull() {
  router.push(`/store/${ui.activeStoreSlug}/assistant`)
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col items-end">
    <!-- Minimized Bar -->
    <Transition name="minibar">
      <div
        v-if="chat.isOpen && chat.isMinimized"
        class="mb-3 flex items-center gap-2.5 pl-4 pr-2 py-2.5 bg-background border rounded-xl shadow-lg cursor-pointer"
        @click="chat.maximizePanel()"
        :title="t('assistant.maximize')"
      >
        <MessageCircle class="size-4 text-primary shrink-0" />
        <span class="text-sm font-medium truncate max-w-50">
          {{ chat.activeConversation?.title || t('assistant.title_short') }}
        </span>
        <span
          v-if="chat.isStreaming"
          class="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <span class="inline-block w-1 h-1 bg-primary rounded-full animate-pulse" />
          {{ t('assistant.typing') }}
        </span>
        <button
          @click.stop="chat.closePanel()"
          class="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          :title="t('assistant.close')"
        >
          <X class="size-3.5" />
        </button>
      </div>
    </Transition>

    <!-- Full Chat Panel -->
    <Transition name="panel">
      <div
        v-if="chat.isOpen && !chat.isMinimized"
        :class="[
          'mb-3 bg-background border rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300',
          chat.isFullScreen
            ? 'fixed inset-2 sm:inset-4 rounded-2xl'
            : 'w-100 max-w-[calc(100vw-2rem)] h-145 max-h-[calc(100vh-8rem)]'
        ]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-2.5 border-b bg-muted/20 shrink-0">
          <div class="flex items-center gap-2 min-w-0">
            <MessageCircle class="size-4 text-primary shrink-0" />
            <span class="text-sm font-semibold truncate">{{ t('assistant.title') }}</span>
          </div>
          <div class="flex items-center gap-0.5 shrink-0">
            <!-- Open in Full View -->
            <button
              @click="handleOpenFull"
              class="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              :title="t('assistant.open_full')"
            >
              <ExternalLink class="size-4" />
            </button>
            <!-- Fullscreen Toggle -->
            <button
              @click="chat.toggleFullScreen()"
              class="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              :title="chat.isFullScreen ? t('assistant.exit_fullscreen') : t('assistant.fullscreen')"
            >
              <Minimize2 v-if="chat.isFullScreen" class="size-4" />
              <Maximize2 v-else class="size-4" />
            </button>
            <!-- Minimize -->
            <button
              @click="chat.minimizePanel()"
              class="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              :title="t('assistant.minimize')"
            >
              <Minus class="size-4" />
            </button>
            <!-- Close -->
            <button
              @click="chat.closePanel()"
              class="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              :title="t('assistant.close')"
            >
              <X class="size-4" />
            </button>
          </div>
        </div>
        <!-- Panel body -->
        <div class="flex-1 min-h-0 flex flex-col">
          <AiChatPanel />
        </div>
      </div>
    </Transition>

    <!-- Floating Toggle Button -->
    <button
      @click="handleToggle"
      :class="[
        'flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-200',
        chat.isOpen
          ? 'bg-muted text-muted-foreground hover:bg-muted/80'
          : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl'
      ]"
      :title="chat.isOpen ? t('assistant.close') : t('assistant.open')"
    >
      <X v-if="chat.isOpen && !chat.isMinimized" class="size-5" />
      <MessageCircle v-else class="size-5" />
      <span v-if="!chat.isOpen" class="text-sm font-medium">{{ t('assistant.ask_ai') }}</span>
    </button>
  </div>
</template>

<style scoped>
.panel-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 1, 1);
}
.panel-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}
.panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.minibar-enter-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.minibar-leave-active {
  transition: all 0.12s cubic-bezier(0.4, 0, 1, 1);
}
.minibar-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.minibar-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
