import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../lib/axios'
import type { User, UserRole } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => user.value?.role ?? '')

  const isRoot = computed(() => role.value === 'root')
  const isStoreOwner = computed(() => role.value === 'store_owner')
  const isStoreManager = computed(() => role.value === 'store_manager')
  const isInventoryStaff = computed(() => role.value === 'inventory_staff')
  const isSalesStaff = computed(() => role.value === 'sales_staff')

  const isStoreUser = computed(() =>
    isStoreOwner.value || isStoreManager.value || isInventoryStaff.value || isSalesStaff.value,
  )

  const canManageCatalog = computed(() =>
    isRoot.value || isStoreOwner.value || isStoreManager.value || isInventoryStaff.value,
  )

  const canManageSales = computed(() =>
    isRoot.value || isStoreOwner.value || isStoreManager.value,
  )

  const canManageStoreUsers = computed(() =>
    isRoot.value || isStoreOwner.value,
  )

  const canManageSystem = computed(() => isRoot.value)

  function hasRole(r: UserRole): boolean {
    return role.value === r
  }

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

  return {
    token, user, isAuthenticated, role, initialized,
    isRoot, isStoreOwner, isStoreManager, isInventoryStaff, isSalesStaff,
    isStoreUser, canManageCatalog, canManageSales, canManageStoreUsers, canManageSystem,
    hasRole, login, fetchUser, setUser, logout,
  }
})
