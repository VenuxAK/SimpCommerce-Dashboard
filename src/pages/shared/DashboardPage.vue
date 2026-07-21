<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { useNotify } from '../../lib/notify'
import type { DashboardSummary } from '../../types'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from '../../lib/theme'
import { useAuthStore } from '../../stores/auth'
import { useReportApi, useBackupApi } from '../../composables/api'
import {
  DollarSign, ShoppingBag, Package, AlertTriangle,
  Save, Download, TrendingUp, ArrowRight, Users,
  CreditCard, Wallet, Banknote, ChevronRight, CalendarDays,
} from 'lucide-vue-next'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Filler, ArcElement, Legend,
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Filler, ArcElement, Legend)

const auth = useAuthStore()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const pathPrefix = computed(() => route.params.storeSlug ? `/store/${route.params.storeSlug}` : '')
const { success, error } = useNotify()
const reportApi = useReportApi()
const backupApi = useBackupApi()
const summary = ref<DashboardSummary | null>(null)
const systemSummary = ref<any | null>(null)
const loading = ref(true)
const salesChart = ref<any>(null)
const paymentChart = ref<any>(null)
const chartType = ref<'line' | 'bar'>('line')
const chartRange = ref<'today' | '7d' | 'month' | 'custom'>('today')
const customFrom = ref('')
const customTo = ref('')
const showCal = ref(false)
const backups = ref<any[]>([])
const { isDark } = useTheme()

const fg = computed(() => isDark.value ? '#f4f4f5' : '#18181b')
const muted = computed(() => isDark.value ? '#71717a' : '#a1a1aa')
const grid = computed(() => isDark.value ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
const tooltipBg = computed(() => isDark.value ? '#fafafa' : '#18181b')
const tooltipText = computed(() => isDark.value ? '#18181b' : '#fafafa')
const primary = computed(() => isDark.value ? '#a78bfa' : '#7c3aed')
const accent = computed(() => isDark.value ? '#60a5fa' : '#2563eb')

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: tooltipBg.value,
      titleColor: tooltipText.value,
      bodyColor: tooltipText.value,
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
      titleFont: { size: 12, weight: '600' },
      bodyFont: { size: 11 },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { maxTicksLimit: 5, color: muted.value, font: { size: 11 } },
      grid: { color: grid.value, drawTicks: false },
      border: { display: false },
    },
    x: {
      ticks: { color: muted.value, font: { size: 10 }, maxTicksLimit: 8 },
      grid: { display: false },
      border: { display: false },
    },
  },
}))

const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: tooltipBg.value,
      titleColor: tooltipText.value,
      bodyColor: tooltipText.value,
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
      titleFont: { size: 12, weight: '600' },
      bodyFont: { size: 11 },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { maxTicksLimit: 5, color: muted.value, font: { size: 11 } },
      grid: { color: grid.value, drawTicks: false },
      border: { display: false },
    },
    x: {
      ticks: { color: muted.value, font: { size: 10 }, maxTicksLimit: 8 },
      grid: { display: false },
      border: { display: false },
    },
  },
  elements: {
    line: {
      tension: 0.35,
      borderColor: primary.value,
      borderWidth: 2.5,
      fill: true,
      backgroundColor: (ctx: any) => {
        const grad = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300)
        grad.addColorStop(0, primary.value + '33')
        grad.addColorStop(1, primary.value + '03')
        return grad
      },
    },
    point: {
      radius: 3,
      hoverRadius: 6,
      backgroundColor: primary.value,
      borderColor: isDark.value ? '#18181b' : '#ffffff',
      borderWidth: 2,
    },
  },
}))

const donutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: muted.value,
        padding: 16,
        font: { size: 11 },
        usePointStyle: true,
        pointStyleWidth: 8,
      },
    },
    tooltip: {
      backgroundColor: tooltipBg.value,
      titleColor: tooltipText.value,
      bodyColor: tooltipText.value,
      padding: 12,
      cornerRadius: 8,
      titleFont: { size: 12, weight: '600' },
      bodyFont: { size: 11 },
    },
  },
}))

const statCards = computed(() => [
  { label: t('dashboard.today_sales'), value: summary.value ? summary.value.today_sales.toLocaleString() + ' Ks' : '--', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: t('dashboard.today_orders'), value: summary.value ? String(summary.value.today_orders_count) : '--', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: t('dashboard.total_products'), value: summary.value ? String(summary.value.total_products) : '--', subtitle: summary.value ? summary.value.total_variants + ' variants' : '', icon: Package, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { label: t('dashboard.low_stock'), value: summary.value ? String(summary.value.low_stock_count) : '--', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
])

const loadCharts = async () => {
  const now = new Date()
  let dateFrom: string
  let dateTo: string
  if (chartRange.value === 'today') {
    dateFrom = now.toISOString().split('T')[0]
    dateTo = dateFrom
  } else if (chartRange.value === '7d') {
    dateFrom = new Date(now.getTime() - 6 * 86400000).toISOString().split('T')[0]
    dateTo = now.toISOString().split('T')[0]
  } else if (chartRange.value === 'custom') {
    dateFrom = customFrom.value || now.toISOString().split('T')[0]
    dateTo = customTo.value || now.toISOString().split('T')[0]
  } else {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    dateTo = now.toISOString().split('T')[0]
  }

  // Sales chart (shared data — chart type toggles between line and bar)
  try {
    const { data } = await reportApi.sales({ date_from: dateFrom, date_to: dateTo })
    if (data.daily_breakdown?.length) {
      const days = data.daily_breakdown
      const totals = days.map((d: any) => d.total)
      salesChart.value = {
        labels: days.map((d: any) => {
          const dt = new Date(d.date)
          return dt.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        }),
        datasets: [{
          label: 'Sales',
          data: totals,
          backgroundColor: (ctx: any) => {
            const grad = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300)
            grad.addColorStop(0, primary.value + '99')
            grad.addColorStop(1, primary.value + '22')
            return grad
          },
          borderColor: primary.value,
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 32,
        }],
      }
    }
  } catch { salesChart.value = null }

  // Payment methods donut
  try {
    const pm = await reportApi.paymentMethods({ date_from: dateFrom, date_to: dateTo })
    if (pm.data.data?.length) {
      const items = pm.data.data
      const colorMap: Record<string, string> = {
        cash: '#10b981',
        transfer: '#6366f1',
        stripe: '#f59e0b',
      }
      paymentChart.value = {
        labels: items.map((i: any) => i.method.charAt(0).toUpperCase() + i.method.slice(1)),
        datasets: [{
          data: items.map((i: any) => i.total),
          backgroundColor: items.map((i: any) => colorMap[i.method] || muted.value),
          borderColor: isDark.value ? '#18181b' : '#ffffff',
          borderWidth: 2,
        }],
      }
    }
  } catch { paymentChart.value = null }
}

const load = async () => {
  loading.value = true
  try {
    if (auth.isRoot) {
      const { data } = await reportApi.systemDashboard()
      systemSummary.value = data
      const res = await backupApi.list()
      backups.value = res.data.data || []
    } else {
      const { data } = await reportApi.dashboard()
      summary.value = data
      await loadCharts()
    }
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

const createBackup = async () => {
  try {
    const res = await backupApi.create()
    success(res.data.message || t('dashboard.backup_queued'))
    setTimeout(async () => {
      if (auth.isRoot) {
        const listRes = await backupApi.list()
        backups.value = listRes.data.data || []
        const { data } = await reportApi.systemDashboard()
        systemSummary.value = data
      }
    }, 2000)
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
}

const downloadBackup = async (filename: string) => {
  try {
    const response = await backupApi.download(filename)
    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url; link.download = filename; link.click()
    URL.revokeObjectURL(url)
  } catch { error(t('dashboard.download_failed')) }
}

onMounted(load)

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    completed: 'success', pending: 'warning', cancelled: 'destructive', refunded: 'secondary',
    shipped: 'default', delivered: 'success', processing: 'warning',
  }
  return map[status] || 'default'
}
</script>
<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-xl font-semibold tracking-tight text-foreground">{{ auth.isRoot ? t('nav.dashboard') : t('nav.home') }}</h1>
      <p class="text-sm text-muted-foreground mt-1">{{ auth.isRoot ? t('nav.dashboard_overview') : '' }}</p>
    </div>

    <div v-if="loading" class="flex h-96 items-center justify-center">
      <div class="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <template v-else>
      <!-- Staff Welcome -->
      <div v-if="auth.user?.role === 'sales_staff' || auth.user?.role === 'inventory_staff'" class="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card shadow-sm">
        <div class="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <ShoppingBag class="size-8 text-primary" />
        </div>
        <h2 class="text-2xl font-bold tracking-tight mb-2">{{ t("dashboard.welcome_back", { name: auth.user?.name }) }}</h2>
        <p class="text-muted-foreground max-w-[500px] text-sm mt-1 italic">Quality is not an act, it is a habit.</p>
      </div>

      <!-- System Admin View -->
      <template v-else-if="auth.isRoot && systemSummary">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="card in [
            { label: t('nav.stores'), value: systemSummary.total_stores, icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-500/10', route: '/stores' },
            { label: t('nav.users'), value: systemSummary.total_users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', route: '/users' },
            { label: t('nav.backups'), value: systemSummary.total_backups, icon: Save, color: 'text-violet-500', bg: 'bg-violet-500/10', route: '/backups' },
          ]" :key="card.label"
            class="rounded-lg border bg-card p-5 transition-shadow hover:shadow-sm cursor-pointer"
            @click="router.push(card.route)">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-medium text-muted-foreground">{{ card.label }}</span>
              <div :class="['size-8 rounded-full flex items-center justify-center', card.bg]">
                <component :is="card.icon" :class="['size-4', card.color]" />
              </div>
            </div>
            <div class="text-xl font-semibold tracking-tight">{{ card.value }}</div>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-3 mt-6">
          <Card class="lg:col-span-2 shadow-none">
            <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
              <CardTitle class="text-sm font-medium">{{ t('nav.audit') }}</CardTitle>
              <Button variant="ghost" size="sm" class="text-xs gap-1" @click="router.push(pathPrefix + '/audit-logs')">
                {{ t('common.details') }} <ArrowRight class="size-3" />
              </Button>
            </CardHeader>
            <CardContent class="p-0 divide-y overflow-hidden rounded-b-lg">
              <div v-if="!systemSummary.recent_audit_logs?.length" class="p-8 text-center text-sm text-muted-foreground">
                {{ t('common.no_data') }}
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="border-b bg-muted/20">
                      <th class="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                      <th class="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                      <th class="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-center">Action</th>
                      <th class="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Target</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    <tr v-for="log in systemSummary.recent_audit_logs" :key="log.id" class="hover:bg-muted/30 transition-colors">
                      <td class="px-5 py-3 text-muted-foreground tabular-nums whitespace-nowrap">
                        {{ log.created_at?.split('T')[0] }} {{ log.created_at?.split('T')[1]?.split('.')[0] }}
                      </td>
                      <td class="px-5 py-3">
                        <div class="flex items-center gap-2">
                          <div class="size-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold border shrink-0">
                            {{ log.user?.name?.charAt(0) || 'S' }}
                          </div>
                          <span class="font-semibold text-foreground">{{ log.user?.name || 'System' }}</span>
                        </div>
                      </td>
                      <td class="px-5 py-3 text-center">
                        <Badge variant="secondary" class="h-5 px-1.5 text-[9px] font-medium uppercase">{{ log.action }}</Badge>
                      </td>
                      <td class="px-5 py-3 text-muted-foreground font-medium">
                        {{ log.model_type?.split('\\').pop() }} <span class="text-[10px] text-muted-foreground/60">(#{{ log.model_id }})</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card class="shadow-none">
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
      </template>


      <!-- Store Admin View -->
      <template v-else-if="summary">
        <!-- Stat Cards -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="card in statCards" :key="card.label" class="rounded-lg border bg-card p-5 transition-shadow hover:shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-medium text-muted-foreground">{{ card.label }}</span>
              <div :class="['size-8 rounded-full flex items-center justify-center', card.bg]">
                <component :is="card.icon" :class="['size-4', card.color]" />
              </div>
            </div>
            <div class="text-xl font-semibold tracking-tight">{{ card.value }}</div>
            <p v-if="card.subtitle" class="text-xs text-muted-foreground mt-1">{{ card.subtitle }}</p>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Sales Chart (Line/Bar toggle) -->
          <Card class="lg:col-span-2 shadow-none">
            <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
              <CardTitle class="text-sm font-medium">{{ t('reports.sales_revenue') }}</CardTitle>
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 bg-muted rounded-md p-0.5">
                  <button
                    @click="chartType = 'line'; loadCharts()"
                    :class="['px-2.5 py-1 text-xs rounded-sm transition-all', chartType === 'line' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
                    Line
                  </button>
                  <button
                    @click="chartType = 'bar'; loadCharts()"
                    :class="['px-2.5 py-1 text-xs rounded-sm transition-all', chartType === 'bar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
                    Bar
                  </button>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1 bg-muted rounded-md p-0.5">
                    <button v-for="r in [{k:'today',l:'Today'},{k:'7d',l:'7d'},{k:'month',l:'Month'}]" :key="r.k"
                      @click="chartRange = r.k; showCal = false; loadCharts()"
                      :class="['px-2.5 py-1 text-xs rounded-sm transition-all', chartRange === r.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
                      {{ r.l }}
                    </button>
                  </div>
                  <div class="relative">
                    <button
                      @click="showCal = !showCal; if (showCal) { chartRange = 'custom' }"
                      :class="['px-2 py-1 text-xs rounded-sm transition-all flex items-center gap-1', chartRange === 'custom' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground']">
                      <CalendarDays class="size-3.5" />
                    </button>
                    <div v-if="showCal" class="absolute right-0 top-full mt-1 z-50 flex gap-2 rounded-lg border bg-popover p-3 shadow-lg">
                      <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-muted-foreground">From</label>
                        <input v-model="customFrom" type="date" class="h-8 w-36 rounded border px-2 text-xs" @change="loadCharts()" />
                      </div>
                      <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-muted-foreground">To</label>
                        <input v-model="customTo" type="date" class="h-8 w-36 rounded border px-2 text-xs" @change="loadCharts()" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent v-if="salesChart" class="p-5 h-[300px]">
              <Line v-if="chartType === 'line'" :data="salesChart" :options="lineOptions" />
              <Bar v-else :data="salesChart" :options="barOptions" />
            </CardContent>
            <CardContent v-else class="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              <div class="flex flex-col items-center gap-2">
                <TrendingUp class="size-8 text-muted-foreground/40" />
                <span>{{ t('common.no_data') }}</span>
              </div>
            </CardContent>
          </Card>

          <!-- Payment Methods Donut -->
          <Card class="shadow-none">
            <CardHeader class="py-3 px-5 border-b">
              <CardTitle class="text-sm font-medium">{{ t("dashboard.payment_methods") }}</CardTitle>
            </CardHeader>
            <CardContent v-if="paymentChart" class="p-5 h-[300px] flex items-center">
              <Doughnut :data="paymentChart" :options="donutOptions" />
            </CardContent>
            <CardContent v-else class="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              <div class="flex flex-col items-center gap-2">
                <Wallet class="size-8 text-muted-foreground/40" />
                <span>{{ t('common.no_data') }}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Recent Orders + Low Stock -->
        <div class="grid gap-6 lg:grid-cols-2">
          <Card class="shadow-none">
            <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
              <CardTitle class="text-sm font-medium">{{ t('dashboard.recent_orders') }}</CardTitle>
              <Button variant="ghost" size="sm" class="text-xs gap-1" @click="router.push(pathPrefix + '/sales')">
                {{ t('common.details') }} <ArrowRight class="size-3" />
              </Button>
            </CardHeader>
            <CardContent class="p-0 divide-y">
              <div v-for="order in summary?.recent_orders" :key="order.id"
                class="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors group"
                @click="router.push(pathPrefix + '/sales/' + order.id)">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div class="size-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium shrink-0">#</div>
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

          <Card class="shadow-none">
            <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
              <CardTitle class="text-sm font-medium">{{ t('dashboard.low_stock') }}</CardTitle>
              <Button variant="ghost" size="sm" class="text-xs gap-1" @click="router.push(pathPrefix + '/stock')">
                {{ t('common.details') }} <ArrowRight class="size-3" />
              </Button>
            </CardHeader>
            <CardContent class="p-0 divide-y">
              <div v-for="item in summary?.low_stock_variants" :key="item.id"
                class="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div class="size-8 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500 font-medium text-xs shrink-0">!</div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-foreground truncate">{{ item.product }}</p>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ item.size }} / {{ item.color }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <div class="text-right">
                    <p class="text-sm font-medium text-foreground tabular-nums">{{ item.stock }} {{ t("common.left") }}</p>
                    <div class="w-16 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                      <div class="h-full bg-amber-500 rounded-full transition-all" :style="{ width: Math.min((item.stock / 10) * 100, 100) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!summary?.low_stock_variants?.length" class="p-8 text-center text-sm text-muted-foreground">All items in stock.</div>
            </CardContent>
          </Card>
        </div>
      </template>
    </template>
  </div>
</template>
