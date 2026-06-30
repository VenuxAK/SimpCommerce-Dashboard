<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { useNotify } from '../../lib/notify'
import type { DashboardSummary } from '../../types'
import { useRouter } from 'vue-router'
import { useTheme } from '../../lib/theme'
import { useAuthStore } from '../../stores/auth'
import { useReportApi, useBackupApi } from '../../composables/api'
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Save,
  Download,
  TrendingUp,
  ArrowRight,
  Users,
} from 'lucide-vue-next'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

const auth = useAuthStore()
const { t } = useI18n()
const router = useRouter()
const { success, error } = useNotify()
const reportApi = useReportApi()
const backupApi = useBackupApi()
const summary = ref<DashboardSummary | null>(null)
const systemSummary = ref<any | null>(null)
const loading = ref(true)
const chartData = ref<any>(null)
const chartRange = ref('7d')
const backups = ref<any[]>([])
const { isDark } = useTheme()

const quotes = [
  "Quality is not an act, it is a habit.",
  "Success is the sum of small efforts, repeated day-in and day-out.",
  "The only way to do great work is to love what you do.",
  "Don't count the days, make the days count.",
  "Strive not to be a success, but rather to be of value.",
  "Your attitude, not your aptitude, will determine your altitude."
]
const randomQuote = ref(quotes[Math.floor(Math.random() * quotes.length)])

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

const systemStatCards = computed(() => [
  {
    label: t('nav.stores'),
    value: systemSummary.value ? String(systemSummary.value.total_stores) : '—',
    icon: ShoppingBag,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
    route: '/stores',
  },
  {
    label: t('nav.users'),
    value: systemSummary.value ? String(systemSummary.value.total_users) : '—',
    icon: Users,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
    route: '/users',
  },
  {
    label: t('nav.backups'),
    value: systemSummary.value ? String(systemSummary.value.total_backups) : '—',
    icon: Save,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
    route: '/backups',
  },
])

const loadChart = async () => {
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
    const { data } = await reportApi.sales({ date_from: dateFrom, date_to: dateTo })
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

const load = async () => {
  if (auth.user?.role === 'sales_staff' || auth.user?.role === 'inventory_staff') {
    loading.value = false
    return
  }

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
      await loadChart()
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
    success(res.data.message || 'Backup queued for processing')
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
  } catch { error('Download failed') }
}

onMounted(load)

const statusBadge = (status: string) => {
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
      <h1 class="text-xl font-semibold tracking-tight text-foreground">{{ auth.role === 'root' ? t('dashboard.title') : t('nav.home') }}</h1>
      <p class="text-sm text-muted-foreground mt-1">{{ auth.role === 'root' ? t('nav.dashboard_overview') : '' }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex h-96 items-center justify-center">
      <div class="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <!-- Loaded -->
    <template v-else>
      <!-- Staff Welcome Message -->
      <template v-if="auth.user?.role === 'sales_staff' || auth.user?.role === 'inventory_staff'">
        <div class="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500 border rounded-xl bg-card shadow-sm mt-4">
          <div class="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <ShoppingBag class="size-8 text-primary" />
          </div>
          <h2 class="text-2xl font-bold tracking-tight mb-2">Welcome back, {{ auth.user?.name }}!</h2>
          <p class="text-muted-foreground max-w-[500px] text-sm mt-1 italic">
            "{{ randomQuote }}"
          </p>
        </div>
      </template>

      <!-- System Admin view -->
      <template v-else-if="auth.isRoot && systemSummary">
        <!-- Stat Cards -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="card in systemStatCards"
            :key="card.label"
            class="rounded-lg border bg-card p-5 transition-shadow hover:shadow-sm cursor-pointer"
            @click="router.push(card.route)"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-medium text-muted-foreground">{{ card.label }}</span>
              <div :class="['size-8 rounded-full flex items-center justify-center', card.bgClass]">
                <component :is="card.icon" :class="['size-4', card.iconClass]" />
              </div>
            </div>
            <div class="text-xl font-semibold tracking-tight">{{ card.value }}</div>
          </div>
        </div>

        <!-- Split: Audit Logs + Backups -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Recent Audit Logs -->
          <Card class="lg:col-span-2 shadow-none">
            <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
              <CardTitle class="text-sm font-medium">{{ t('nav.audit') }}</CardTitle>
              <Button variant="ghost" size="sm" class="text-xs gap-1" @click="router.push('/audit-logs')">
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
                        <Badge variant="secondary" class="h-5 px-1.5 text-[9px] font-medium uppercase">
                          {{ log.action }}
                        </Badge>
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

          <!-- Backups Section (System Admin) -->
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

      <!-- Store Admin view -->
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

        <!-- Chart -->
        <div class="grid gap-6 lg:grid-cols-1">
          <Card class="shadow-none">
            <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
              <CardTitle class="text-sm font-medium">{{ t('reports.sales_revenue') }}</CardTitle>
              <div class="flex items-center gap-1 bg-muted rounded-md p-0.5">
                <button
                  v-for="r in ['7d', '30d', 'month']" :key="r"
                  @click="chartRange = r; loadChart()"
                  :class="[
                    'span px-2.5 py-1 text-xs rounded-sm transition-all',
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
        </div>

        <!-- Recent Orders + Low Stock -->
        <div class="grid gap-6 lg:grid-cols-2">
          <Card class="shadow-none">
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

          <Card class="shadow-none">
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
    </template>
  </div>
</template>
