<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import Input from '../../components/ui/Input.vue'
import { useNotify } from '../../lib/notify'
import { useProfileApi } from '../../composables/api'

const { t } = useI18n()
const auth = useAuthStore()
const { success, error } = useNotify()
const profileApi = useProfileApi()
const form = ref({ name: '', email: '', password: '' })
const saving = ref(false)

onMounted(() => {
  if (auth.user) {
    form.value.name = auth.user.name
    form.value.email = auth.user.email
  }
})

const save = async () => {
  saving.value = true
  try {
    const payload: Record<string, any> = { name: form.value.name, email: form.value.email }
    if (form.value.password) payload.password = form.value.password
    const { data } = await profileApi.update(payload)
    auth.setUser(data.data)
    success(t('common.save') + ' ✅')
    form.value.password = ''
  } catch (e: any) {
    const msg = e?.response?.data?.errors
      ? Object.values(e.response.data.errors).flat().join(', ')
      : (e?.response?.data?.message || t('common.error'))
    error(msg)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6">
    <h1 class="text-xl sm:text-2xl font-semibold text-foreground">{{ t('profile.title') }}</h1>
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <CardTitle>{{ t('profile.info') }}</CardTitle>
        <Badge :variant="auth.user?.role === 'root' || auth.user?.role === 'store_owner' || auth.user?.role === 'store_manager' ? 'default' : 'secondary'">{{ auth.user?.role }}</Badge>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground/80">{{ t('users.name') }}</label>
          <Input v-model="form.name" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground/80">{{ t('auth.email') }}</label>
          <Input v-model="form.email" type="email" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground/80">{{ t('profile.new_password') }}</label>
          <Input v-model="form.password" type="password" :placeholder="t('profile.password_leave')" />
        </div>
        <Button :disabled="saving" @click="save" class="w-full sm:w-auto">
          {{ saving ? t('common.loading') : t('common.save') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
