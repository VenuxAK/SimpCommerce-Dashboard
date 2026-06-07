<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { useNotify } from '../lib/notify'
import type { DashboardSummary } from '../types'
import { useRouter } from 'vue-router'
import { useTheme } from '../lib/theme'
import { useAuthStore } from '../stores/auth'
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Save,
  Download,
  TrendingUp,
  ArrowRight,
} from 'lucide-vue-next'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

const auth = useAuthStore()
const { t } = useI18n()
const router = useRouter()
const { success, error } = useNotify()
const summary = ref<DashboardSummary | null>(null)
const loading = ref(true)
const chartData = ref<any>(null)
const chartRange = ref('7d')
const backups = ref<any[]>([])
const { isDark } = useTheme()

const barColor = computed(() => (isDark.value ? '#f4f4f5' : '#18181b'))
const gridColor = computed(() => (isDark.value ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'))
const tickColor = computed(() => (isDark.value ? '#71717a' : '#a1a1aa'))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: isDark.value ? '#fafafa' : '#18181b',
      titleColor: isDark.value ? '#18181b' : '#fafafa',
      bodyColor: isDark.value ? '#18181b' : '#fafafa',
      padding: 10,
      cornerRadius: 6,
      displayColors: false,
      titleFont: { size: 11, weight: 500 },
      bodyFont: { size: 11 },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { maxTicksLimit: 5, color: tickColor.value, font: { size: 11 } },
      grid: { color: gridColor.value, drawTicks: false },
      border: { display: false },
    },
    x: {
      ticks: { color: tickColor.value, font: { size: 10 } },
      grid: { display: false },
      border: { display: false },
    },
  },
}))

const statCards = computed(() => [
  {
    label: t('dashboard.today_sales'),
    value: summary.value ? summary.value.today_sales.toLocaleString() + ' Ks' : '—',
    icon: DollarSign,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  {
    label: t('dashboard.today_orders'),
    value: summary.value ? String(summary.value.today_orders_count) : '—',
    icon: ShoppingBag,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  {
    label: t('dashboard.total_products'),
    value: summary.value ? String(summary.value.total_products) : '—',
    subtitle: summary.value ? summary.value.total_variants + ' variants' : '',
    icon: Package,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  {
    label: t('dashboard.low_stock'),
    value: summary.value ? String(summary.value.low_stock_count) : '—',
    icon: AlertTriangle,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
])

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
      const days = data.daily_breakdown
      chartData.value = {
        labels: days.map((d: any) => {
          const date = new Date(d.date)
          return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        }),
        datasets: [{
          label: 'Sales',
          data: days.map((d: any) => d.total),
          backgroundColor: barColor.value,
          borderRadius: 3,
          maxBarThickness: 20,
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
    const { data } = await api.get('/dashboard/summary')
    summary.value = data
    await loadChart()
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }

  // Load backups (root only).
  if (auth.isRoot) {
    try {
      const res = await api.get('/backups')
      backups.value = res.data.data || []
    } catch {}
  }
}

async function createBackup() {
  try {
    const res = await api.post('/backups')
    backups.value.unshift({ filename: res.data.filename, created_at: new Date().toISOString() })
    success('Backup created')
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
  <div class="space-y-8">
    <!-- Page Header -->
    <div>
      <h1 class="text-xl font-semibold tracking-tight text-foreground">{{ t('dashboard.title') }}</h1>
      <p class="text-sm text-muted-foreground mt-1">{{ t('nav.dashboard_overview') }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex h-96 items-center justify-center">
      <div class="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <template v-else-if="summary">
      <!-- Stat Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="card in statCards" :key="card.label" class="rounded-lg border bg-card p-5 transition-shadow hover:shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-muted-foreground">{{ card.label }}</span>
            <div :class="['size-8 rounded-full flex items-center justify-center', card.bgClass]">
              <component :is="card.icon" :class="['size-4', card.iconClass]" />
            </div>
          </div>
          <div class="text-xl font-semibold tracking-tight">{{ card.value }}</div>
          <p v-if="card.subtitle" class="text-xs text-muted-foreground mt-1">{{ card.subtitle }}</p>
        </div>
      </div>

      <!-- Chart + Backups -->
      <div class="grid gap-6" :class="auth.isRoot ? 'lg:grid-cols-3' : 'lg:grid-cols-1'">
        <Card :class="auth.isRoot ? 'lg:col-span-2' : ''">
          <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
            <CardTitle class="text-sm font-medium">{{ t('reports.sales_revenue') }}</CardTitle>
            <div class="flex items-center gap-1 bg-muted rounded-md p-0.5">
              <button
                v-for="r in ['7d', '30d', 'month']" :key="r"
                @click="chartRange = r; loadChart()"
                :class="[
                  'px-2.5 py-1 text-xs rounded-sm transition-all',
                  chartRange === r ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                ]"
              >
                {{ r }}
              </button>
            </div>
          </CardHeader>
          <CardContent v-if="chartData" class="p-5 h-[300px]">
            <Bar :data="chartData" :options="chartOptions" />
          </CardContent>
          <CardContent v-else class="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            <div class="flex flex-col items-center gap-2">
              <TrendingUp class="size-8 text-muted-foreground/40" />
              <span>{{ t('common.no_data') }}</span>
            </div>
          </CardContent>
        </Card>

        <Card v-if="auth.isRoot">
          <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
            <CardTitle class="text-sm font-medium">{{ t('nav.backups') }}</CardTitle>
            <Button size="icon" variant="outline" class="size-7" @click="createBackup">
              <Save class="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent class="p-0 divide-y">
            <div v-for="b in backups.slice(0, 6)" :key="b.filename" class="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group">
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-foreground truncate">{{ b.filename }}</p>
                <p class="text-[11px] text-muted-foreground mt-0.5">{{ b.created_at }}</p>
              </div>
              <button @click="downloadBackup(b.filename)" class="size-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <Download class="size-3.5" />
              </button>
            </div>
            <div v-if="!backups.length" class="p-8 text-center text-sm text-muted-foreground">{{ t('nav.no_backups') }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- Recent Orders + Low Stock -->
      <div class="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
            <CardTitle class="text-sm font-medium">{{ t('dashboard.recent_orders') }}</CardTitle>
            <Button variant="ghost" size="sm" class="text-xs gap-1" @click="router.push('/sales')">
              {{ t('common.details') }} <ArrowRight class="size-3" />
            </Button>
          </CardHeader>
          <CardContent class="p-0 divide-y">
            <div
              v-for="order in summary?.recent_orders" :key="order.id"
              class="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors group"
              @click="router.push('/sales/' + order.id)"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="size-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium shrink-0">
                  #
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{{ order.order_number }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ order.created_at }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4 shrink-0">
                <Badge :variant="statusBadge(order.status) as any" class="text-[10px] font-medium px-1.5 py-0.5">{{ order.status }}</Badge>
                <span class="text-sm font-medium tabular-nums text-foreground">{{ order.total_amount.toLocaleString() }} Ks</span>
              </div>
            </div>
            <div v-if="!summary?.recent_orders?.length" class="p-8 text-center text-sm text-muted-foreground">{{ t('dashboard.no_orders') }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
            <CardTitle class="text-sm font-medium">{{ t('dashboard.low_stock') }}</CardTitle>
            <Button variant="ghost" size="sm" class="text-xs gap-1" @click="router.push('/stock')">
              {{ t('common.details') }} <ArrowRight class="size-3" />
            </Button>
          </CardHeader>
          <CardContent class="p-0 divide-y">
            <div
              v-for="item in summary?.low_stock_variants" :key="item.id"
              class="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="size-8 rounded-md bg-warning/10 flex items-center justify-center text-warning font-medium text-xs shrink-0">
                  !
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-foreground truncate">{{ item.product }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ item.size }} / {{ item.color }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <div class="text-right">
                  <p class="text-sm font-medium text-foreground tabular-nums">{{ item.stock }} left</p>
                  <div class="w-16 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <div class="h-full bg-warning rounded-full transition-all" :style="{ width: Math.min((item.stock / 10) * 100, 100) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="!summary?.low_stock_variants?.length" class="p-8 text-center text-sm text-muted-foreground">All items in stock.</div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
