<template>
  <router-view />
  <NotificationToast />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import NotificationToast from './components/NotificationToast.vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

watch(locale, (val) => {
  document.documentElement.setAttribute('lang', val)
})

document.documentElement.setAttribute('lang', locale.value)
</script>
