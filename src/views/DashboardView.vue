<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <!-- Dashboard Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Dashboard Header with Refresh -->
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-600">Garden For All Production Overview</p>
        </div>
        <div class="flex items-center space-x-4">
          <RecordHarvestQR />
          <div class="text-sm text-gray-500">
            Last updated: {{ formattedLastUpdated }}
          </div>
          <button @click="refreshData" :disabled="loading || refreshing"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300"
            title="Refresh Data">
            <svg :class="['w-5 h-5', { 'animate-spin': loading || refreshing }]" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Date/Time Display -->
      <div class="mb-8 text-center">
        <h2 class="text-3xl font-bold text-gray-900">{{ currentDate }}</h2>
        <p class="text-lg text-gray-600">{{ currentTime }}</p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !error" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-garden-green-600"></div>
      </div>

      <!-- Dashboard Components -->
      <div v-else class="space-y-8">
        <!-- Production Summary Cards -->
        <div class="space-y-4">
          <div v-if="loading" class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex justify-center items-center py-8">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600 mx-auto mb-3"></div>
                <p class="text-gray-500 text-sm">Loading production summary...</p>
              </div>
            </div>
          </div>
          <ProductionSummary v-else :summary="summary" />
        </div>

        <!-- Charts and Visualizations -->
        <div class="space-y-4">
          <div v-if="loading" class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex justify-center items-center py-8">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600 mx-auto mb-3"></div>
                <p class="text-gray-500 text-sm">Loading charts and analytics...</p>
              </div>
            </div>
          </div>
          <Charts v-else :summary="summary" :recent-entries="recentEntries" :produce-breakdown="produceBreakdown"
            :production-trends="productionTrends" :period-comparison="periodComparison" :produce-types="produceTypes" />
        </div>

        <!-- Pantry Commitment Tracker -->
        <div class="space-y-4">
          <CommitmentTracker :loading="loading" />
        </div>

        <!-- Annual Commitment Progress -->
        <div class="space-y-4">
          <AnnualCommitmentProgress :loading="loading" />
        </div>

        <!-- County Statistics -->
        <div class="space-y-4">
          <CountyStats :county-stats="countyStats" :loading="loading" />
        </div>
      </div>
    </div>

    <!-- Fullscreen Toggle (for TV Display) -->
    <button @click="toggleFullscreen"
      class="fixed bottom-4 right-4 p-3 bg-garden-green-600 text-white rounded-full shadow-lg hover:bg-garden-green-700 transition-colors"
      title="Toggle Fullscreen">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    </button>

  </div>
</template>

<script setup lang="ts">
import AnnualCommitmentProgress from '@/components/dashboard/AnnualCommitmentProgress.vue'
import Charts from '@/components/dashboard/Charts.vue'
import CommitmentTracker from '@/components/dashboard/CommitmentTracker.vue'
import CountyStats from '@/components/dashboard/CountyStats.vue'
import ProductionSummary from '@/components/dashboard/ProductionSummary.vue'
import RecordHarvestQR from '@/components/dashboard/RecordHarvestQR.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useAuth } from '@/composables/useAuth'
import { usePusher } from '@/composables/usePusher'
import { useDashboardStore } from '@/stores/dashboard'
import { useHarvestStore } from '@/stores/harvest'
import { computed, onMounted, onUnmounted, ref } from 'vue'


const dashboardStore = useDashboardStore()
const harvestStore = useHarvestStore()
const { subscribeToHarvestUpdates, subscribeToAdminUpdates, subscribeToDashboardUpdates } = usePusher()
const { isAuthenticated } = useAuth()

const currentTime = ref(new Date().toLocaleTimeString())


// Store getters - use computed to maintain reactivity
const summary = computed(() => dashboardStore.summary)
const recentEntries = computed(() => dashboardStore.recentEntries)
const produceBreakdown = computed(() => dashboardStore.produceBreakdown)
const productionTrends = computed(() => dashboardStore.productionTrends)
const periodComparison = computed(() => dashboardStore.periodComparison)
const countyStats = computed(() => dashboardStore.countyStats)
const loading = computed(() => dashboardStore.loading)
const error = computed(() => dashboardStore.error)

const produceTypes = computed(() => harvestStore.produceTypes)

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Formatted last updated timestamp
const formattedLastUpdated = computed(() => {
  if (!dashboardStore.lastUpdated) return '—'
  return dashboardStore.lastUpdated.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
})

onMounted(async () => {
  // Initial data load
  await Promise.all([
    dashboardStore.fetchAll(),
    harvestStore.fetchProduceTypes()
  ])

  // Set up real-time updates for data changes
  const handleDataUpdate = () => {
    dashboardStore.fetchAll()
  }

  // Subscribe to all relevant events
  subscribeToHarvestUpdates(handleDataUpdate)
  subscribeToAdminUpdates(handleDataUpdate)
  subscribeToDashboardUpdates(handleDataUpdate)

  // Update clock every second
  setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => {
  // No polling intervals to clean up anymore
})

const refreshing = ref(false)
const refreshData = async () => {
  refreshing.value = true
  try {
    await dashboardStore.fetchAll()
  } finally {
    refreshing.value = false
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
</script>

<style scoped>
/* Large screen optimizations for TV display */
@media (min-width: 1920px) {
  .text-3xl {
    @apply text-5xl;
  }

  .text-lg {
    @apply text-2xl;
  }

  .text-base {
    @apply text-xl;
  }

  .text-sm {
    @apply text-lg;
  }
}
</style>