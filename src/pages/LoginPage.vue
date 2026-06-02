<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Input from '../components/ui/Input.vue'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const ui = useUIStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)

    if (ui.isStoreFixed && auth.isRoot) {
      error.value = 'Root users cannot sign in to a per-store dashboard. Please use the root dashboard.'
      auth.logout()
      loading.value = false
      return
    }

    router.push('/')
  } catch (err: any) {
    if (!err.response) {
      error.value = t('common.error') + ': ' + (t('dashboard.load_failed'))
    } else if (err.response.status === 429) {
      error.value = 'Too many attempts. Please try again in a moment.'
    } else {
      error.value = err.response?.data?.message
        || err.response?.data?.errors?.email?.[0]
        || err.response?.data?.errors?.password?.[0]
        || t('auth.invalid_credentials')
    }
  } finally {
    loading.value = false
  }
}

function toggleLang() {
  locale.value = locale.value === 'en' ? 'my' : 'en'
  localStorage.setItem('locale', locale.value)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
    <div class="w-full max-w-[380px]">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-foreground shadow-lg">
          <span class="text-lg font-bold text-background">S</span>
        </div>
        <h1 class="text-xl font-semibold tracking-tight text-foreground">{{ t('app') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ t('auth.sign_in') }}</p>
      </div>

      <Card>
        <CardHeader class="py-3 px-5 border-b">
          <div class="flex items-center justify-between">
            <CardTitle class="text-sm font-medium">{{ t('auth.login') }}</CardTitle>
            <button @click="toggleLang" class="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {{ locale === 'en' ? 'မြန်မာ' : 'English' }}
            </button>
          </div>
        </CardHeader>
        <CardContent class="p-5">
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs text-muted-foreground ml-1">{{ t('auth.email') }}</label>
              <Input v-model="email" type="email" required placeholder="admin@simppos.test" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs text-muted-foreground ml-1">{{ t('auth.password') }}</label>
              <Input v-model="password" type="password" required minlength="6" placeholder="••••••••" />
            </div>

            <div v-if="error" class="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-in slide-in-from-top-1">
              {{ error }}
            </div>

            <Button type="submit" class="w-full h-10" :disabled="loading">
              <span v-if="loading" class="size-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
              {{ loading ? t('common.loading') : t('auth.sign_in') }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p class="mt-8 text-center text-xs text-muted-foreground/50">
        &copy; 2026 SimpCommerce
      </p>
    </div>
  </div>
</template>
