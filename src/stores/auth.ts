import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../lib/axios'
import type { User } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function fetchCsrfCookie() {
    await api.get('/sanctum/csrf-cookie')
  }

  async function login(email: string, password: string) {
    await fetchCsrfCookie()
    const { data } = await api.post('/auth/login', { email, password })
    user.value = data.user ?? data.data ?? data
  }

  async function fetchUser() {
    try {
      const { data } = await api.get('/auth/me')
      user.value = data.data ?? data
    } catch {
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  function setUser(u: User) {
    user.value = u
  }

  function logout() {
    user.value = null
  }

  return { user, isAuthenticated, isAdmin, initialized, login, fetchUser, setUser, logout }
})
