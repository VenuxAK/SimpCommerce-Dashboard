<template>
  <router-view />
  <NotificationToast />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import NotificationToast from './components/NotificationToast.vue'
import { useAuthStore } from './stores/auth'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const { locale } = useI18n()

onMounted(() => {
  document.documentElement.setAttribute('lang', locale.value)
  if (auth.isAuthenticated) {
    auth.fetchUser()
  }
})

watch(locale, (val) => {
  document.documentElement.setAttribute('lang', val)
})
</script>
