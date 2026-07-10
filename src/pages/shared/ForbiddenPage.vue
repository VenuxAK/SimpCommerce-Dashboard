<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center p-4">
    <Card class="w-full max-w-[420px] text-center border shadow-lg">
      <CardContent class="pt-8 pb-8 space-y-6">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-13.332 9-18.03 9-23.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
          </svg>
        </div>
        
        <div class="space-y-2">
          <h1 class="text-2xl font-bold tracking-tight text-foreground">403 - Access Denied</h1>
          <p class="text-sm text-muted-foreground px-4">
            You do not have permission to access this store dashboard. Store management is restricted to authorized store staff.
          </p>
        </div>

        <Button @click="goHome" class="w-full sm:w-auto h-10 px-6">
          Return to Dashboard
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
