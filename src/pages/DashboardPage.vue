<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { DollarSign, ShoppingBag, Package, AlertTriangle, Download, Save } from 'lucide-vue-next'
import api from '../lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { useNotify } from '../lib/notify'
import type { DashboardSummary } from '../types'
import { useRouter } from 'vue-router'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

const { t } = useI18n()
const router = useRouter()
const { success, error } = useNotify()
const summary = ref<DashboardSummary | null>(null)
const loading = ref(true)
const chartData = ref<any>(null)
const chartRange = ref('7d')
const backups = ref<any[]>([])
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#18181b',
      titleColor: '#f4f4f5',
      bodyColor: '#f4f4f5',
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { maxTicksLimit: 6, color: '#a1a1aa', font: { size: 11 } },
      grid: { color: 'rgba(113, 113, 122, 0.12)' },
    },
    x: {
      ticks: { color: '#a1a1aa', font: { size: 10 }, maxRotation: 45 },
      grid: { display: false },
    },
  },
}

async function loadChart() {
  const now = new Date()
  let dateFrom: string
  if (chartRange.value === '7d') {
    dateFrom = new Date(now.getTime() - 6 * 86400000).toISOString().split('T')[0]
  } else if (chartRange.value === '30d') {
    dateFrom = new Date(now.getTime() - 29 * 86400000).toISOString().split('T')[0]
  } else {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  }
  const dateTo = now.toISOString().split('T')[0]

  try {
    const { data } = await api.get('/reports/sales', { params: { date_from: dateFrom, date_to: dateTo } })
    if (data.daily_breakdown?.length) {
      const isDark = document.documentElement.classList.contains('dark')
      const days = data.daily_breakdown
      chartData.value = {
        labels: days.map((d: any) => {
          const date = new Date(d.date)
          return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        }),
        datasets: [{
          label: 'Sales (Ks)',
          data: days.map((d: any) => d.total),
          backgroundColor: days.map(() => isDark ? 'rgba(161, 161, 170, 0.8)' : 'rgba(113, 113, 122, 0.8)'),
          borderColor: isDark ? 'rgba(212, 212, 216, 0.6)' : 'rgba(82, 82, 91, 0.6)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      }
    } else {
      chartData.value = null
    }
  } catch { chartData.value = null }
}

async function load() {
  loading.value = true
  try {
    const [sumRes, backupRes] = await Promise.all([
      api.get('/dashboard/summary'),
      api.get('/backups'),
    ])
    summary.value = sumRes.data
    backups.value = backupRes.data.data || []
    await loadChart()
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

async function createBackup() {
  try {
    const res = await api.post('/backup')
    backups.value.unshift({ filename: res.data.filename, created_at: new Date().toISOString() })
    success('Backup created ✅')
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
}

async function downloadBackup(filename: string) {
  try {
    const response = await api.get(`/backups/${filename}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url; link.download = filename; link.click()
    URL.revokeObjectURL(url)
  } catch { error('Download failed') }
}

onMounted(load)

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed: 'success',
    pending: 'warning',
    cancelled: 'destructive',
    refunded: 'secondary',
  }
  return map[status] || 'default'
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ t('dashboard.title') }}</h1>

    <div v-if="loading" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('common.loading') }}</div>

    <div v-if="summary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{{ t('dashboard.today_sales') }}</CardTitle>
          <DollarSign class="size-4 text-zinc-400 dark:text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ summary.today_sales.toLocaleString() }} Ks</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{{ t('dashboard.today_orders') }}</CardTitle>
          <ShoppingBag class="size-4 text-zinc-400 dark:text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ summary.today_orders_count }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{{ t('dashboard.total_products') }}</CardTitle>
          <Package class="size-4 text-zinc-400 dark:text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ summary.total_products }} / {{ summary.total_variants }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{{ t('dashboard.low_stock') }}</CardTitle>
          <AlertTriangle class="size-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ summary.low_stock_count }}</div>
        </CardContent>
      </Card>
    </div>

    <Card class="p-4">
      <CardHeader class="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle class="text-sm text-zinc-500">Sales</CardTitle>
        <div class="flex gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs">
          <button @click="chartRange = '7d'; loadChart()" :class="['px-3 py-1.5 transition-colors', chartRange === '7d' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800']">7 days</button>
          <button @click="chartRange = '30d'; loadChart()" :class="['px-3 py-1.5 transition-colors', chartRange === '30d' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800']">30 days</button>
          <button @click="chartRange = 'month'; loadChart()" :class="['px-3 py-1.5 transition-colors', chartRange === 'month' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800']">Month</button>
        </div>
      </CardHeader>
      <CardContent v-if="chartData" class="h-48 sm:h-64">
        <Bar :data="chartData" :options="chartOptions" />
      </CardContent>
      <CardContent v-else class="text-sm text-zinc-400 text-center py-8">No sales data for this period.</CardContent>
    </Card>

    <Card class="p-4">
      <CardHeader class="flex flex-row items-center justify-between">
        <CardTitle class="text-sm text-zinc-500">Backups</CardTitle>
        <Button size="sm" @click="createBackup"><Save class="size-4" /> Backup Now</Button>
      </CardHeader>
      <CardContent class="space-y-1">
        <div v-for="b in backups.slice(0, 5)" :key="b.filename" class="flex items-center justify-between text-sm py-1">
          <span class="text-zinc-600 dark:text-zinc-400 truncate">{{ b.filename }}</span>
          <button @click="downloadBackup(b.filename)" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            <Download class="size-4" />
          </button>
        </div>
        <p v-if="!backups.length" class="text-xs text-zinc-400">No backups yet.</p>
      </CardContent>
    </Card>

    <div v-if="summary?.low_stock_variants.length" class="space-y-2">
      <h2 class="font-semibold text-zinc-700 dark:text-zinc-300">{{ t('dashboard.low_stock') }}</h2>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Card v-for="item in summary.low_stock_variants" :key="item.id">
          <CardContent class="flex items-center justify-between p-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ item.product }}</p>
              <p class="text-xs text-zinc-400 dark:text-zinc-500 truncate">{{ item.size }} / {{ item.color }} · {{ item.sku }}</p>
            </div>
            <Badge variant="warning" class="shrink-0">{{ item.stock }}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>

    <div class="space-y-2">
      <h2 class="font-semibold text-zinc-700 dark:text-zinc-300">{{ t('dashboard.recent_orders') }}</h2>
      <Card v-if="summary?.recent_orders?.length">
        <CardContent class="p-0 overflow-x-auto">
          <div v-for="order in summary.recent_orders" :key="order.id"
            class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 sm:px-6 py-3 last:border-0 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            @click="router.push('/sales/' + order.id)"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ order.order_number }}</p>
              <p class="text-xs text-zinc-400 dark:text-zinc-500">{{ order.created_at }}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <Badge :variant="statusBadge(order.status) as any">{{ order.status }}</Badge>
              <span class="font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-100">{{ order.total_amount.toLocaleString() }} Ks</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <p v-else class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('dashboard.no_orders') }}</p>
    </div>
  </div>
</template>
