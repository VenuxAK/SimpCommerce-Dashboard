<template>
  <router-view />
  <NotificationToast />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import NotificationToast from './components/NotificationToast.vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

onMounted(() => {
  if (auth.isAuthenticated) {
    auth.fetchUser()
  }
})
</script>
