<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
        </div>
        <div class="ml-4 flex-1">
          <div class="text-sm font-medium text-gray-500">Today</div>
          <div class="text-2xl font-bold text-gray-900">
            {{ summary.today.quantity.toFixed(1) }}
          </div>
          <div class="text-sm text-green-600 font-medium">
            ${{ summary.today.value.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
        <div class="ml-4 flex-1">
          <div class="text-sm font-medium text-gray-500">This Week</div>
          <div class="text-2xl font-bold text-gray-900">
            {{ summary.week.quantity.toFixed(1) }}
          </div>
          <div class="text-sm text-green-600 font-medium">
            ${{ summary.week.value.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
        <div class="ml-4 flex-1">
          <div class="text-sm font-medium text-gray-500">This Month</div>
          <div class="text-2xl font-bold text-gray-900">
            {{ summary.month.quantity.toFixed(1) }}
          </div>
          <div class="text-sm text-green-600 font-medium">
            ${{ summary.month.value.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
        </div>
        <div class="ml-4 flex-1">
          <div class="text-sm font-medium text-gray-500">Year to Date</div>
          <div class="text-2xl font-bold text-gray-900">
            {{ summary.year.quantity.toFixed(1) }}
          </div>
          <div class="text-sm text-green-600 font-medium">
            ${{ summary.year.value.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface DashboardSummary {
  today: { quantity: number; value: number }
  week: { quantity: number; value: number }
  month: { quantity: number; value: number }
  year: { quantity: number; value: number }
}

interface Props {
  summary: DashboardSummary
}

defineProps<Props>()
</script>