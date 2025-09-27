<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 hidden lg:block">
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
        </div>
        <div class="lg:ml-4 flex-1">
          <div class="text-sm font-medium text-gray-500">Today</div>
          <div class="text-xs text-gray-400 mb-1">{{ todayDate }}</div>
          <div class="text-2xl font-bold text-gray-900">
            {{ formatWeight(summary.today.quantity) }} <span class="text-lg text-gray-500">lbs</span>
          </div>
          <div class="text-sm text-gray-500 font-medium">
            {{ formatCurrency(summary.today.value) }} value
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 hidden lg:block">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
        <div class="lg:ml-4 flex-1">
          <div class="text-sm font-medium text-gray-500">This Week</div>
          <div class="text-xs text-gray-400 mb-1">{{ weekRange }}</div>
          <div class="text-2xl font-bold text-gray-900">
            {{ formatWeight(summary.week.quantity) }} <span class="text-lg text-gray-500">lbs</span>
          </div>
          <div class="text-sm text-gray-500 font-medium">
            {{ formatCurrency(summary.week.value) }} value
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 hidden lg:block">
          <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
        <div class="lg:ml-4 flex-1">
          <div class="text-sm font-medium text-gray-500">This Month</div>
          <div class="text-xs text-gray-400 mb-1">{{ monthRange }}</div>
          <div class="text-2xl font-bold text-gray-900">
            {{ formatWeight(summary.month.quantity) }} <span class="text-lg text-gray-500">lbs</span>
          </div>
          <div class="text-sm text-gray-500 font-medium">
            {{ formatCurrency(summary.month.value) }} value
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 hidden lg:block">
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
        </div>
        <div class="lg:ml-4 flex-1">
          <div class="text-sm font-medium text-gray-500">Year to Date</div>
          <div class="text-xs text-gray-400 mb-1">{{ yearRange }}</div>
          <div class="text-2xl font-bold text-gray-900">
            {{ formatWeight(summary.year.quantity) }} <span class="text-lg text-gray-500">lbs</span>
          </div>
          <div class="text-sm text-gray-500 font-medium">
            {{ formatCurrency(summary.year.value) }} value
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface DashboardSummary {
  today: { quantity: number; value: number }
  week: { quantity: number; value: number }
  month: { quantity: number; value: number }
  year: { quantity: number; value: number }
}

interface Props {
  summary: DashboardSummary
}

const props = defineProps<Props>()

// Currency formatting helper
const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Weight formatting helper
const formatWeight = (weight: number, decimals: number = 1) => {
  return weight.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// Date range calculations
const todayDate = computed(() => {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

const weekRange = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6)
  
  return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
})

const monthRange = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const yearRange = computed(() => {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  return `${startOfYear.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
})
</script>