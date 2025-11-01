<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900">Year-to-Date County Distribution</h2>
      <p v-if="countyStats" class="text-gray-600 text-sm mt-1">
        Production summary for {{ countyStats.year }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
    </div>

    <!-- County Stats Display -->
    <div v-else-if="countyStats && countyStats.counties && countyStats.counties.length > 0" class="space-y-6">
      <!-- County Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="county in countyStats.counties"
          :key="county.county"
          class="bg-gradient-to-br from-garden-green-50 to-white rounded-lg p-5 border border-garden-green-100 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-lg font-semibold text-gray-900">{{ county.county }}</h3>
            <svg class="w-6 h-6 text-garden-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>

          <div class="space-y-2">
            <!-- Total Weight -->
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Total Weight:</span>
              <span class="text-lg font-bold text-garden-green-600">
                {{ formatNumber(county.totalWeight) }} <span class="text-sm font-normal">lbs</span>
              </span>
            </div>

            <!-- Total Value -->
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Total Value:</span>
              <span class="text-md font-semibold text-gray-900">
                ${{ formatNumber(county.totalValue) }}
              </span>
            </div>

            <!-- Pantries Served -->
            <div class="flex justify-between items-center pt-2 border-t border-gray-200">
              <span class="text-xs text-gray-500">Pantries Served:</span>
              <span class="text-sm font-medium text-gray-700">{{ county.pantryCount }}</span>
            </div>

            <!-- Delivery Count -->
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500">Deliveries:</span>
              <span class="text-sm font-medium text-gray-700">{{ formatNumber(county.entryCount) }}</span>
            </div>

            <!-- Percentage of Total -->
            <div v-if="countyStats.totals" class="mt-3 pt-3 border-t border-gray-200">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-gray-500">% of Total:</span>
                <span class="text-xs font-medium text-gray-700">
                  {{ ((county.totalWeight / countyStats.totals.totalWeight) * 100).toFixed(1) }}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-garden-green-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${(county.totalWeight / countyStats.totals.totalWeight) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grand Totals Summary -->
      <div v-if="countyStats.totals" class="bg-garden-green-600 text-white rounded-lg p-6 mt-6">
        <h3 class="text-xl font-bold mb-4">YTD Totals (All Counties)</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-3xl font-bold">{{ formatNumber(countyStats.totals.totalWeight) }}</div>
            <div class="text-sm opacity-90">Total Pounds</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold">${{ formatNumber(countyStats.totals.totalValue) }}</div>
            <div class="text-sm opacity-90">Total Value</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold">{{ formatNumber(countyStats.totals.entryCount) }}</div>
            <div class="text-sm opacity-90">Total Deliveries</div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="text-center py-12 text-gray-500">
      <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
      <p>No county statistics available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  countyStats: any
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Helper function to format numbers with commas
const formatNumber = (num: number): string => {
  if (num === undefined || num === null) return '0'
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}
</script>

<style scoped>
/* Large screen optimizations for TV display */
@media (min-width: 1920px) {
  .text-3xl {
    font-size: 3rem;
    line-height: 1;
  }

  .text-xl {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }

  .text-lg {
    font-size: 1.5rem;
    line-height: 2rem;
  }

  .text-base {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }

  .text-sm {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }

  .text-xs {
    font-size: 1rem;
    line-height: 1.5rem;
  }
}
</style>
