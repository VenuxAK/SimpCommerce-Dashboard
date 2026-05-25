import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../lib/axios'
import type { User } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    token.value = data.token
    localStorage.setItem('token', data.token)
    user.value = data.user
  }

  async function fetchUser() {
    if (!token.value) {
      initialized.value = true
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      user.value = data.data ?? data
    } catch {
      logout()
    } finally {
      initialized.value = true
    }
  }

  function setUser(u: User) {
    user.value = u
  }

  function logout() {
    token.value = null
    user.value = null
    initialized.value = true
    localStorage.removeItem('token')
  }

  return { token, user, isAuthenticated, isAdmin, initialized, login, fetchUser, setUser, logout }
})
