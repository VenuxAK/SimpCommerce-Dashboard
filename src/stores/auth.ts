import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../lib/axios'
import type { User } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const savedRaw = localStorage.getItem('user')
  let savedUser: User | null = null
  if (savedRaw) {
    try {
      const parsed = JSON.parse(savedRaw)
      savedUser = parsed.id ? parsed : (parsed.data ?? null)
    } catch { savedUser = null }
  }

  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(savedUser)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function persistUser(u: User) {
    user.value = u
    localStorage.setItem('user', JSON.stringify(u))
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    token.value = data.token
    localStorage.setItem('token', data.token)
    persistUser(data.user)
  }

  async function fetchUser() {
    try {
      const { data } = await api.get('/auth/me')
      persistUser(data.data ?? data)
    } catch {
      logout()
    }
  }

  function setUser(u: User) {
    persistUser(u)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isAuthenticated, isAdmin, login, fetchUser, setUser, logout }
})
