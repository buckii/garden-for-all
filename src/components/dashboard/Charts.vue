<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    <!-- Production Trends Chart -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Production Trends (Last 12 Weeks)</h3>
      <div class="h-64">
        <div v-if="productionTrends.length > 0" class="h-full">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
        <div v-else class="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">No trend data available</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Produce Breakdown Chart -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Produce This Month</h3>
      <div class="h-64 flex items-center justify-center">
        <div class="w-full">
          <div v-if="produceBreakdown.length > 0" class="space-y-3">
            <div v-for="(item, index) in produceBreakdown.slice(0, 8)" :key="index" class="flex items-center">
              <div class="flex-1 flex items-center">
                <div :class="[
                  'w-4 h-4 rounded-full mr-3',
                  getColorClass(index)
                ]"></div>
                <span class="text-sm font-medium text-gray-700">{{ item.name }}</span>
              </div>
              <div class="flex-shrink-0 flex items-center space-x-3">
                <span class="text-sm font-medium text-garden-green-600 w-20 text-right">
                  {{ item.quantity.toFixed(1) }} lbs
                </span>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-400">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <p class="mt-2 text-sm">No produce data available</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Value Distribution -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Value Distribution</h3>
      <div class="space-y-4">
        <div v-if="summary.year.value > 0" class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Today vs Year Target</span>
            <span class="text-sm font-medium">
              {{ ((summary.today.value / summary.year.value) * 100).toFixed(1) }}%
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min(100, (summary.today.value / summary.year.value) * 100)}%` }"></div>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Week vs Year Target</span>
            <span class="text-sm font-medium">
              {{ ((summary.week.value / summary.year.value) * 100).toFixed(1) }}%
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-green-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min(100, (summary.week.value / summary.year.value) * 100)}%` }"></div>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Month vs Year Target</span>
            <span class="text-sm font-medium">
              {{ ((summary.month.value / summary.year.value) * 100).toFixed(1) }}%
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-yellow-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min(100, (summary.month.value / summary.year.value) * 100)}%` }"></div>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 py-8">
          <p>No data available for comparison</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div class="space-y-3 max-h-64 overflow-y-auto">
        <div v-if="recentEntries.length > 0">
          <div v-for="(entry, index) in recentEntries.slice(0, 10)" :key="index"
            class="flex items-center space-x-3 py-2">
            <div class="flex-shrink-0 w-8 h-8 bg-garden-green-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-garden-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">
                <span v-if="entry.quantity > 0">
                  {{ entry.quantity }} {{ entry.unit }} of
                </span>
                {{ getProduceName(entry.produce_type_id || entry.produceTypeId) }}
              </p>
              <p class="text-xs text-gray-500">
                {{ formatTimeAgo(entry.harvestDate || entry.harvest_date) }}
                <span v-if="entry.harvester_name || entry.harvesterName"> • {{ entry.harvester_name ||
                  entry.harvesterName }}</span>
              </p>
            </div>
            <div class="flex-shrink-0 text-right">
              <p class="text-sm font-medium text-gray-900">
                {{ (entry.weight || 0).toFixed(1) }} lbs
              </p>
              <p v-if="entry.weightEstimated || entry.weight_estimated" class="text-xs text-gray-400">
                estimated
              </p>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 py-8">
          <svg class="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p class="mt-2 text-sm">No recent activity</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)


type HarvestEntry = Database['public']['Tables']['harvest_entries']['Row']
type ProduceType = Database['public']['Tables']['produce_types']['Row']

interface DashboardSummary {
  today: { quantity: number; value: number }
  week: { quantity: number; value: number }
  month: { quantity: number; value: number }
  year: { quantity: number; value: number }
}

interface Props {
  summary: DashboardSummary
  recentEntries: HarvestEntry[]
  produceBreakdown: { name: string; quantity: number; value: number }[]
  productionTrends: { date: string; quantity: number; weight?: number; value: number; produce_type_id?: string }[]
  produceTypes: ProduceType[]
}

const props = defineProps<Props>()

const chartData = computed(() => {
  // Group trends by week and product (last 12 weeks)
  const weeklyData = new Map<string, Map<string, number>>()
  const productTotals = new Map<string, number>()
  const now = new Date()

  // Generate labels for the last 12 weeks
  const weeks = []
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i * 7 + now.getDay()))
    const weekKey = formatWeek(weekStart)
    weeks.push(weekKey)
    weeklyData.set(weekKey, new Map())
  }

  // Aggregate daily trends into weekly totals by product and calculate totals
  props.productionTrends.forEach(trend => {
    // Find the produce type for this trend
    const produceType = props.produceTypes.find(p =>
      p.id === trend.produce_type_id || p._id === trend.produce_type_id
    )
    const productName = produceType?.name || 'Unknown Product'

    const date = new Date(trend.date + 'T00:00:00')
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay()) // Get start of week (Sunday)
    const weekKey = formatWeek(weekStart)

    if (weeklyData.has(weekKey)) {
      const weekProducts = weeklyData.get(weekKey)!
      // Use weight if available, otherwise fall back to quantity
      const weight = trend.weight || trend.quantity || 0
      weekProducts.set(productName, (weekProducts.get(productName) || 0) + weight)
    }

    // Track total production for each product over the 12-week period
    const weight = trend.weight || trend.quantity || 0
    productTotals.set(productName, (productTotals.get(productName) || 0) + weight)
  })

  // Get top 5 products by total production
  const sortedProducts = Array.from(productTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0])

  // Generate colors for products
  const productColors = {
    0: '#10b981', // green-500
    1: '#f59e0b', // amber-500
    2: '#8b5cf6', // violet-500
    3: '#ef4444', // red-500
    4: '#3b82f6', // blue-500
    'Other': '#6b7280' // gray-500
  }

  // Create datasets for top 5 products
  const datasets = sortedProducts.map((product, index) => ({
    label: product,
    data: weeks.map(week => {
      const weekProducts = weeklyData.get(week)!
      return weekProducts.get(product) || 0
    }),
    backgroundColor: productColors[index as keyof typeof productColors],
    borderWidth: 0,
    borderRadius: 2,
  }))

  // Add "Other" dataset for all remaining products
  const otherData = weeks.map(week => {
    const weekProducts = weeklyData.get(week)!
    let otherTotal = 0
    weekProducts.forEach((quantity, product) => {
      if (!sortedProducts.includes(product)) {
        otherTotal += quantity
      }
    })
    return otherTotal
  })

  // Only add "Other" dataset if there's actually other data
  if (otherData.some(value => value > 0)) {
    datasets.push({
      label: 'Other',
      data: otherData,
      backgroundColor: productColors['Other'],
      borderWidth: 0,
      borderRadius: 2,
    })
  }

  return {
    labels: weeks,
    datasets
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'rect',
        padding: 15,
        color: '#6b7280',
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#10b981',
      borderWidth: 1,
      displayColors: true,
      callbacks: {
        label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} lbs`,
        title: (context: any) => `Week of ${context[0].label}`,
        footer: (tooltipItems: any) => {
          const weekTotal = tooltipItems.reduce((sum: number, item: any) => sum + item.parsed.y, 0)
          const weekIndex = tooltipItems[0].dataIndex

          // Calculate 12-week totals for comparison
          const allWeeksTotal = tooltipItems[0].chart.data.datasets.reduce((sum: number, dataset: any) => {
            return sum + dataset.data.reduce((dataSum: number, value: number) => dataSum + value, 0)
          }, 0)

          const weekPercentage = allWeeksTotal > 0 ? ((weekTotal / allWeeksTotal) * 100).toFixed(1) : '0.0'

          return [
            `Week Total: ${weekTotal.toFixed(1)} lbs`,
            `12-Week Total: ${allWeeksTotal.toFixed(1)} lbs`,
            `Week is ${weekPercentage}% of 12-week total`
          ]
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false
      },
      ticks: {
        color: '#6b7280',
        maxRotation: 45,
        minRotation: 0
      }
    },
    y: {
      stacked: true,
      beginAtZero: true,
      grid: {
        color: 'rgba(107, 114, 128, 0.1)'
      },
      ticks: {
        color: '#6b7280',
        callback: (value: any) => `${value} lbs`
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
  }
}))

const colorClasses = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-gray-500'
]

const getColorClass = (index: number) => {
  return colorClasses[index % colorClasses.length]
}

const getProduceName = (produceTypeId: string) => {
  const produceType = props.produceTypes.find(p => p.id === produceTypeId)
  return produceType?.name || 'Unknown'
}

const getEntryValue = (entry: HarvestEntry) => {
  const produceType = props.produceTypes.find(p => p.id === entry.produce_type_id)
  return entry.quantity * (produceType?.conversion_factor || 0)
}

const getApproximateWeight = (entry: HarvestEntry) => {
  // Convert different units to approximate pounds
  if (entry.unit === 'pounds') {
    return entry.quantity
  } else if (entry.unit === 'pints') {
    // Approximate: 1 pint ≈ 0.5 pounds (varies by produce)
    return entry.quantity * 0.5
  } else if (entry.unit === 'bunches') {
    // Approximate: 1 bunch ≈ 0.25 pounds (varies by produce)
    return entry.quantity * 0.25
  }
  // Default fallback
  return entry.quantity * 0.3
}

const formatDate = (dateStr: string) => {
  // Parse date as local date to avoid timezone conversion
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  })
}

const formatWeek = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  })
}

const formatTimeAgo = (timestamp: string) => {
  const now = new Date()

  // Parse date consistently to avoid timezone issues
  let date: Date
  if (timestamp.includes('T')) {
    // Full timestamp with time
    date = new Date(timestamp)
  } else {
    // Date-only string, parse as local date
    date = new Date(timestamp + 'T00:00:00')
  }

  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }
}
</script>