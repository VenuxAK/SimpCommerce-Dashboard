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
      backgroundColor: '#09090b',
      titleColor: '#fafafa',
      bodyColor: '#fafafa',
      padding: 12,
      cornerRadius: 4,
      displayColors: false,
      titleFont: { size: 12, weight: 'bold' },
      bodyFont: { size: 12 },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { maxTicksLimit: 5, color: '#71717a', font: { size: 10, weight: '500' } },
      grid: { color: 'rgba(113, 113, 122, 0.08)', drawTicks: false },
      border: { display: false },
    },
    x: {
      ticks: { color: '#71717a', font: { size: 10, weight: '500' } },
      grid: { display: false },
      border: { display: false },
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
          backgroundColor: isDark ? 'rgba(250, 250, 250, 0.9)' : 'rgba(24, 24, 27, 0.9)',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 32,
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
    const res = await api.post('/backups')
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
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black tracking-tight text-foreground">{{ t('dashboard.title') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">Overview of your store performance</p>
      </div>
    </div>

    <div v-if="loading" class="flex h-96 items-center justify-center text-muted-foreground">
      <div class="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <div v-else-if="summary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card class="border-none bg-primary text-primary-foreground shadow-xl shadow-primary/10">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-[10px] font-black uppercase tracking-widest opacity-70">{{ t('dashboard.today_sales') }}</CardTitle>
          <DollarSign class="size-4 opacity-70" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-black tracking-tighter">{{ summary.today_sales.toLocaleString() }} Ks</div>
        </CardContent>
      </Card>

      <Card class="shadow-sm border-zinc-200/60 dark:border-zinc-800/60">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ t('dashboard.today_orders') }}</CardTitle>
          <ShoppingBag class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-black tracking-tighter text-foreground">{{ summary.today_orders_count }}</div>
        </CardContent>
      </Card>

      <Card class="shadow-sm border-zinc-200/60 dark:border-zinc-800/60">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ t('dashboard.total_products') }}</CardTitle>
          <Package class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-black tracking-tighter text-foreground">{{ summary.total_products }}</div>
          <p class="text-[10px] font-bold text-muted-foreground uppercase mt-1">{{ summary.total_variants }} total variants</p>
        </CardContent>
      </Card>

      <Card class="shadow-sm border-zinc-200/60 dark:border-zinc-800/60">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ t('dashboard.low_stock') }}</CardTitle>
          <AlertTriangle class="size-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-black tracking-tighter text-destructive">{{ summary.low_stock_count }}</div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <Card class="lg:col-span-2 shadow-sm border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        <CardHeader class="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
          <CardTitle class="text-xs font-bold uppercase tracking-wider text-foreground">Sales Revenue</CardTitle>
          <div class="flex p-0.5 rounded-lg bg-background border border-border">
            <button v-for="r in ['7d', '30d', 'month']" :key="r" 
              @click="chartRange = r; loadChart()" 
              :class="['px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all', chartRange === r ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']"
            >
              {{ r }}
            </button>
          </div>
        </CardHeader>
        <CardContent v-if="chartData" class="p-6 h-72">
          <Bar :data="chartData" :options="chartOptions" />
        </CardContent>
        <CardContent v-else class="flex h-72 items-center justify-center text-xs font-medium text-muted-foreground">No sales data for this period.</CardContent>
      </Card>

      <Card class="shadow-sm border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        <CardHeader class="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
          <CardTitle class="text-xs font-bold uppercase tracking-wider text-foreground">Database Backups</CardTitle>
          <Button size="icon" variant="outline" class="size-7 rounded-md" @click="createBackup"><Save class="size-3.5" /></Button>
        </CardHeader>
        <CardContent class="p-0">
          <div v-for="b in backups.slice(0, 6)" :key="b.filename" class="flex items-center justify-between px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors group">
            <div class="min-w-0">
              <p class="text-xs font-bold text-foreground truncate">{{ b.filename }}</p>
              <p class="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">{{ b.created_at }}</p>
            </div>
            <button @click="downloadBackup(b.filename)" class="size-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
              <Download class="size-3.5" />
            </button>
          </div>
          <div v-if="!backups.length" class="p-8 text-center text-xs font-medium text-muted-foreground">No backups found.</div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="space-y-3">
        <h2 class="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">{{ t('dashboard.recent_orders') }}</h2>
        <Card class="shadow-sm border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
          <CardContent class="p-0">
            <div v-for="order in summary?.recent_orders" :key="order.id"
              class="flex items-center justify-between border-b px-4 py-4 last:border-0 cursor-pointer hover:bg-muted/30 transition-all group"
              @click="router.push('/sales/' + order.id)"
            >
              <div class="flex items-center gap-4 min-w-0">
                <div class="size-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground font-black text-xs">#</div>
                <div class="min-w-0">
                  <p class="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{{ order.order_number }}</p>
                  <p class="text-[10px] text-muted-foreground font-bold uppercase">{{ order.created_at }}</p>
                </div>
              </div>
              <div class="flex items-center gap-6 shrink-0">
                <Badge :variant="statusBadge(order.status) as any" class="px-2 py-0 text-[10px] font-black uppercase">{{ order.status }}</Badge>
                <span class="text-sm font-black text-foreground">{{ order.total_amount.toLocaleString() }} Ks</span>
              </div>
            </div>
            <div v-if="!summary?.recent_orders?.length" class="p-12 text-center text-xs font-medium text-muted-foreground">{{ t('dashboard.no_orders') }}</div>
          </CardContent>
        </Card>
      </div>

      <div class="space-y-3">
        <h2 class="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">{{ t('dashboard.low_stock') }}</h2>
        <Card class="shadow-sm border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
          <CardContent class="p-0">
            <div v-for="item in summary?.low_stock_variants" :key="item.id" class="flex items-center justify-between border-b px-4 py-4 last:border-0 hover:bg-muted/30 transition-all">
              <div class="flex items-center gap-4 min-w-0">
                <div class="size-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive font-black text-xs">!</div>
                <div class="min-w-0">
                  <p class="text-sm font-bold text-foreground truncate">{{ item.product }}</p>
                  <p class="text-[10px] text-muted-foreground font-bold uppercase">{{ item.size }} / {{ item.color }} · {{ item.sku }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4 shrink-0">
                <div class="text-right mr-2">
                  <p class="text-xs font-black text-foreground">{{ item.stock }} left</p>
                  <div class="w-16 h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                    <div class="h-full bg-destructive transition-all" :style="{ width: (item.stock / 10 * 100) + '%' }"></div>
                  </div>
                </div>
                <Badge variant="destructive" class="px-2 py-0 text-[10px] font-black uppercase">Low</Badge>
              </div>
            </div>
            <div v-if="!summary?.low_stock_variants?.length" class="p-12 text-center text-xs font-medium text-muted-foreground">All items in stock.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
