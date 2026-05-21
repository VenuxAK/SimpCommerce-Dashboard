<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Input from '../components/ui/Input.vue'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
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
  <div class="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>{{ t('auth.login') }}</CardTitle>
          <button @click="toggleLang" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
            {{ locale === 'en' ? 'မြန်မာ' : 'English' }}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('auth.email') }}</label>
            <Input v-model="email" type="email" required />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('auth.password') }}</label>
            <Input v-model="password" type="password" required minlength="6" />
          </div>
          <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? t('common.loading') : t('auth.sign_in') }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
