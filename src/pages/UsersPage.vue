<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2, Search, ShieldCheck } from 'lucide-vue-next'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
import Pagination from '../components/Pagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'
import PageHeader from '../components/PageHeader.vue'
import { useNotify } from '../lib/notify'
import { useAuthStore } from '../stores/auth'
import { useListing } from '../composables'
import { useUserApi } from '../composables/api'
import type { User } from '../types'

const { t } = useI18n()
const { success, error } = useNotify()
const authStore = useAuthStore()
const userApi = useUserApi()

const { items: users, meta, loading, loadPage } = useListing<User>('/users')
const showForm = ref(false)
const editing = ref<User | null>(null)
const form = ref({ name: '', email: '', password: '', role: 'staff' })
const search = ref('')

const roleOptions = [
  { label: 'STAFF', value: 'staff' },
  { label: 'ADMIN', value: 'admin' },
]

const filtered = computed(() =>
  users.value.filter((u) => {
    if (!search.value) return true
    const q = search.value.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  }),
)

const openCreate = () => {
  editing.value = null
  form.value = { name: '', email: '', password: '', role: 'staff' }
  showForm.value = true
}

const openEdit = (user: User) => {
  editing.value = user
  form.value = { name: user.name, email: user.email, password: '', role: user.role }
  showForm.value = true
}

const save = async () => {
  try {
    if (editing.value) {
      const payload: Record<string, any> = { name: form.value.name, email: form.value.email, role: form.value.role }
      if (form.value.password) payload.password = form.value.password
      await userApi.update(editing.value.id, payload)
      success(t('common.save'))
    } else {
      await userApi.create(form.value)
      success(t('common.create'))
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

const remove = async (id: number, name: string) => {
  if (id === authStore.user?.id) {
    error(t('users.cannot_delete_self'))
    return
  }
  if (!confirm(`${t('common.confirm')} — ${name}?`)) return
  try {
    await userApi.remove(id)
    users.value = users.value.filter((u) => u.id !== id)
    success(t('common.delete'))
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
}

const roleBadge = (role: string) => {
  return role === 'admin' ? 'default' as const : 'secondary' as const
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader title="Users" subtitle="Manage platform access and assign security roles" action-label="New User" @action="openCreate" />

    <div v-if="showForm" class="animate-in slide-in-from-top-4 duration-300">
      <Card class="max-w-xl border-border/60 shadow-none bg-muted/5">
        <CardHeader class="pb-3 border-b border-border/40">
          <CardTitle class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {{ editing ? 'EDIT USER' : 'NEW USER' }}
          </CardTitle>
        </CardHeader>
        <CardContent class="p-6 space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label class="text-[11px] font-medium text-foreground ml-0.5">{{ t('users.name') }}</label>
              <Input v-model="form.name" class="h-9" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-medium text-foreground ml-0.5">{{ t('users.role') }}</label>
              <Select v-model="form.role" :options="roleOptions" />
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-[11px] font-medium text-foreground ml-0.5">{{ t('auth.email') }}</label>
            <Input v-model="form.email" type="email" class="h-9" />
          </div>
          <div class="space-y-1.5">
            <label class="text-[11px] font-medium text-foreground ml-0.5">{{ editing ? 'New Password' : t('auth.password') }}</label>
            <Input v-model="form.password" type="password" :placeholder="editing ? t('users.password_leave') : ''" class="h-9" />
          </div>
          <div class="flex items-center gap-3 pt-4 border-t">
            <Button size="sm" @click="save" class="h-9 px-8">{{ t('common.save').toUpperCase() }}</Button>
            <Button variant="ghost" size="sm" @click="showForm = false" class="h-9">{{ t('common.cancel').toUpperCase() }}</Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card class="shadow-none border-border/60 bg-muted/5">
      <CardContent class="p-4">
        <div class="relative max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input v-model="search" :placeholder="t('common.search')" class="pl-9 h-9 text-xs border-border/40 shadow-none bg-background" />
        </div>
      </CardContent>
    </Card>

    <LoadingSpinner v-if="loading" />

    <EmptyState v-else-if="users.length === 0" :icon="ShieldCheck" :title="t('common.no_data')" />

    <div v-else class="border rounded-lg overflow-hidden bg-card">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b bg-muted/20">
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('users.name') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{{ t('auth.email') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('users.role') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Created</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="u in filtered" :key="u.id" class="hover:bg-muted/30 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="size-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold border">
                    {{ u.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <span class="font-semibold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">{{ u.name }}</span>
                    <p v-if="u.id === authStore.user?.id" class="text-[9px] font-bold text-primary uppercase mt-0.5">Your Account</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-muted-foreground font-medium hidden sm:table-cell truncate max-w-40">{{ u.email }}</td>
              <td class="px-6 py-4">
                <Badge :variant="roleBadge(u.role)" class="h-5 px-2 text-[9px] font-medium uppercase tracking-wider">
                  {{ u.role }}
                </Badge>
              </td>
              <td class="px-6 py-4 text-muted-foreground font-medium hidden md:table-cell tabular-nums">{{ u.created_at?.split('T')[0] }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" class="size-7" @click="openEdit(u)">
                    <Pencil class="size-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button v-if="u.id !== authStore.user?.id" variant="ghost" size="icon" class="size-7 text-destructive" @click="remove(u.id, u.name)">
                    <Trash2 class="size-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="pt-8">
      <Pagination :meta="meta" @page="loadPage" />
    </div>
  </div>
</template>
