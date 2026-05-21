<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import { useNotify } from '../lib/notify'
import { useAuthStore } from '../stores/auth'
import Pagination from '../components/Pagination.vue'
import type { User } from '../types'

const { t } = useI18n()
const { success, error } = useNotify()
const authStore = useAuthStore()
const users = ref<User[]>([])
const meta = ref<any>(null)
const showForm = ref(false)
const editing = ref<User | null>(null)
const form = ref({ name: '', email: '', password: '', role: 'staff' })
const loading = ref(true)
const search = ref('')

async function loadPage(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/users', { params: { page } })
    users.value = data.data
    meta.value = { current_page: data.meta.current_page, last_page: data.meta.last_page, total: data.meta.total, per_page: data.meta.per_page }
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPage())

const filtered = computed(() =>
  users.value.filter((u) => {
    if (!search.value) return true
    const q = search.value.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  }),
)

function openCreate() {
  editing.value = null
  form.value = { name: '', email: '', password: '', role: 'staff' }
  showForm.value = true
}

function openEdit(user: User) {
  editing.value = user
  form.value = { name: user.name, email: user.email, password: '', role: user.role }
  showForm.value = true
}

async function save() {
  try {
    if (editing.value) {
      const payload: Record<string, any> = { name: form.value.name, email: form.value.email, role: form.value.role }
      if (form.value.password) payload.password = form.value.password
      await api.put(`/users/${editing.value.id}`, payload)
      success(t('common.save') + ' ✅')
    } else {
      await api.post('/users', form.value)
      success(t('common.create') + ' ✅')
    }
    showForm.value = false
    await loadPage(1)
  } catch (e: any) {
    const msg = e?.response?.data?.errors
      ? Object.values(e.response.data.errors).flat().join(', ')
      : (e?.response?.data?.message || t('common.error'))
    error(msg)
  }
}

async function remove(id: number, name: string) {
  if (id === authStore.user?.id) {
    error(t('users.cannot_delete_self'))
    return
  }
  if (!confirm(`${t('common.confirm')} — ${name}?`)) return
  try {
    await api.delete(`/users/${id}`)
    users.value = users.value.filter((u) => u.id !== id)
    success(t('common.delete') + ' ✅')
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
}

function roleBadge(role: string) {
  return role === 'admin' ? 'default' as const : 'secondary' as const
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ t('users.title') }}</h1>
      <Button @click="openCreate" class="w-full sm:w-auto"><Plus class="size-4" /> {{ t('users.new_user') }}</Button>
    </div>

    <div v-if="loading" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('common.loading') }}</div>

    <Card v-if="showForm" class="max-w-md">
      <CardHeader><CardTitle>{{ editing ? t('users.edit_user') : t('users.new_user') }}</CardTitle></CardHeader>
      <CardContent class="space-y-3">
        <Input v-model="form.name" :placeholder="t('users.name')" />
        <Input v-model="form.email" type="email" :placeholder="t('auth.email')" />
        <Input v-model="form.password" type="password" :placeholder="editing ? t('users.password_leave') : t('auth.password')" />
        <p v-if="editing && !form.password" class="text-xs text-zinc-400 dark:text-zinc-500">{{ t('users.password_leave') }}</p>
        <select v-model="form.role"
          class="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100">
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <div class="flex gap-2">
          <Button @click="save">{{ t('common.save') }}</Button>
          <Button variant="outline" @click="showForm = false">{{ t('common.cancel') }}</Button>
        </div>
      </CardContent>
    </Card>

    <template v-else>
      <Input v-model="search" :placeholder="t('common.search')" class="sm:max-w-xs" />

      <Card>
        <CardContent class="p-0 overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('users.name') }}</th>
                <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium hidden sm:table-cell">{{ t('auth.email') }}</th>
                <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('users.role') }}</th>
                <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium hidden md:table-cell">{{ t('common.date') }}</th>
                <th class="px-3 sm:px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in filtered" :key="u.id"
                class="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <td class="px-3 sm:px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {{ u.name }}
                  <span v-if="u.id === authStore.user?.id" class="text-xs text-zinc-400 dark:text-zinc-500 ml-1">(you)</span>
                </td>
                <td class="px-3 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400 truncate max-w-40 hidden sm:table-cell">{{ u.email }}</td>
                <td class="px-3 sm:px-4 py-3">
                  <Badge :variant="roleBadge(u.role)">{{ u.role }}</Badge>
                </td>
                <td class="px-3 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap hidden md:table-cell">{{ u.created_at?.split('T')[0] }}</td>
                <td class="px-3 sm:px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" @click="openEdit(u)">
                    <Pencil class="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" @click="remove(u.id, u.name)" class="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400">
                    <Trash2 class="size-4" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p v-if="!loading && filtered.length === 0" class="text-sm text-zinc-400 dark:text-zinc-500 py-8 text-center">{{ t('common.no_data') }}</p>
      <Pagination :meta="meta" @page="loadPage" />
    </template>
  </div>
</template>
