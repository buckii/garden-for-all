<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    <!-- Production Trends Chart -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-1">Production Trends (Last 12 Weeks)</h3>
      <p class="text-sm text-gray-500 mb-4">{{ productionTrendsDateRange }}</p>
      <div class="h-64">
        <div v-if="productionTrends && productionTrends.datasets.length > 0" class="h-full">
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
      <h3 class="text-lg font-semibold text-gray-900 mb-1">Top Produce This Month</h3>
      <p class="text-sm text-gray-500 mb-4">{{ topProduceThisMonthDateRange }}</p>
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

    <!-- Period Comparison Chart -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Period Comparisons</h3>
      <div class="h-64">
        <div v-if="periodComparison" class="h-full">
          <Bar :data="periodComparisonData" :options="periodComparisonOptions" />
        </div>
        <div v-else class="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">No comparison data available</p>
          </div>
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
  productionTrends: { labels: string[]; datasets: any[]; summary: any } | null
  periodComparison: any | null
  produceTypes: ProduceType[]
}

const props = defineProps<Props>()

// Computed date ranges for chart subheadings
const productionTrendsDateRange = computed(() => {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - (12 * 7)) // 12 weeks ago
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  return `${formatDate(startDate)} - ${formatDate(now)}`
})

const topProduceThisMonthDateRange = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

// Date ranges for period comparison tooltips
const periodComparisonDateRanges = computed(() => {
  const now = new Date()
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  // Current year dates
  const last7DaysStart = new Date(now)
  last7DaysStart.setDate(now.getDate() - 7)
  
  const last30DaysStart = new Date(now)
  last30DaysStart.setDate(now.getDate() - 30)
  
  const yearStart = new Date(now.getFullYear(), 0, 1)
  
  // Prior year dates
  const lastYear7DaysStart = new Date(last7DaysStart)
  lastYear7DaysStart.setFullYear(lastYear7DaysStart.getFullYear() - 1)
  const lastYear7DaysEnd = new Date(now)
  lastYear7DaysEnd.setFullYear(lastYear7DaysEnd.getFullYear() - 1)
  
  const lastYear30DaysStart = new Date(last30DaysStart)
  lastYear30DaysStart.setFullYear(lastYear30DaysStart.getFullYear() - 1)
  const lastYear30DaysEnd = new Date(now)
  lastYear30DaysEnd.setFullYear(lastYear30DaysEnd.getFullYear() - 1)
  
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
  const lastYearSameDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  
  return {
    current: [
      `${formatDate(last7DaysStart)} - ${formatDate(now)}`,           // 7 Days
      `${formatDate(last30DaysStart)} - ${formatDate(now)}`,          // 30 Days
      `${formatDate(yearStart)} - ${formatDate(now)}`                 // Year to Date
    ],
    priorYear: [
      `${formatDate(lastYear7DaysStart)} - ${formatDate(lastYear7DaysEnd)}`,     // 7 Days Prior Year
      `${formatDate(lastYear30DaysStart)} - ${formatDate(lastYear30DaysEnd)}`,   // 30 Days Prior Year
      `${formatDate(lastYearStart)} - ${formatDate(lastYearSameDate)}`           // Year to Date Prior Year
    ]
  }
})

const chartData = computed(() => {
  // Use server-side processed data directly
  if (!props.productionTrends) {
    return { labels: [], datasets: [] }
  }

  return {
    labels: props.productionTrends.labels,
    datasets: props.productionTrends.datasets
  }
})

// Use period comparison data from API
const periodComparison = computed(() => {
  return props.periodComparison
})

const periodComparisonData = computed(() => {
  const comp = periodComparison.value
  
  if (!comp) {
    return { labels: [], datasets: [] }
  }
  
  return {
    labels: ['7 Days', '30 Days', 'Year to Date'],
    datasets: [
      {
        label: 'Current Period',
        data: [comp.last7Days, comp.last30Days, comp.currentYtd],
        backgroundColor: '#10b981', // green-500
        borderWidth: 0,
        borderRadius: 4,
      },
      {
        label: 'Prior Year',
        data: [comp.previous7Days, comp.previous30Days, comp.previousYtd],
        backgroundColor: '#d1d5db', // gray-300
        borderWidth: 0,
        borderRadius: 4,
      }
    ]
  }
})

const periodComparisonOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'rect',
        padding: 12,
        color: '#6b7280',
        font: {
          size: 11
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#10b981',
      borderWidth: 1,
      callbacks: {
        label: (context: any) => {
          const label = context.dataset.label
          const value = context.parsed.y
          const dateRanges = periodComparisonDateRanges.value
          
          // Get the appropriate date range based on dataset and data index
          const isCurrentPeriod = context.datasetIndex === 0
          const dateRange = isCurrentPeriod 
            ? dateRanges.current[context.dataIndex] 
            : dateRanges.priorYear[context.dataIndex]
            
          return [
            `${label}: ${value.toFixed(1)} lbs`,
            `${dateRange}`
          ]
        },
        afterLabel: (context: any) => {
          if (context.datasetIndex === 0) {
            const comp = periodComparison.value
            if (!comp) return ''
            
            const changes = [comp.change7Days, comp.change30Days, comp.changeYtd]
            const percentChange = changes[context.dataIndex].toFixed(1)
            const current = context.parsed.y
            const previous = context.chart.data.datasets[1].data[context.dataIndex]
            const change = current - previous
            const arrow = change >= 0 ? '↑' : '↓'
            return `Change: ${arrow} ${Math.abs(change).toFixed(1)} lbs (${percentChange}%)`
          }
          return ''
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(107, 114, 128, 0.1)'
      },
      ticks: {
        color: '#6b7280',
        callback: (value: any) => `${value} lbs`,
        font: {
          size: 11
        }
      }
    }
  }
}))

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
  } else if (entry.unit === 'half-pints') {
    // Approximate: 1 half-pint ≈ 0.25 pounds (varies by produce)
    return entry.quantity * 0.25
  } else if (entry.unit === 'bouquets') {
    // Approximate: 1 bouquet ≈ 0.25 pounds (varies by produce)
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
  if (!timestamp) return ''

  // Parse date consistently to avoid timezone issues
  let date: Date
  if (timestamp.includes('T')) {
    // Full timestamp with time
    date = new Date(timestamp)
  } else {
    // Date-only string, parse as local date
    date = new Date(timestamp + 'T00:00:00')
  }

  // Harvest dates are meaningful only to the day, so compare calendar days in
  // local time (ignore hours/minutes) and round to absorb DST 23h/25h days.
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const msPerDay = 1000 * 60 * 60 * 24
  const diffInDays = Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / msPerDay)

  if (diffInDays === 0) return 'today'
  if (diffInDays === 1) return 'tomorrow'
  if (diffInDays === -1) return 'yesterday'
  if (diffInDays > 1) return `in ${diffInDays} days`
  return `${Math.abs(diffInDays)} days ago`
}
</script>