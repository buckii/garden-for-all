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
          <div class="text-sm text-gray-500">
            Last updated: {{ formattedLastUpdated }}
          </div>
          <button @click="refreshData" :disabled="loading"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300"
            title="Refresh Data">
            <svg :class="['w-5 h-5', { 'animate-spin': loading }]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
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
            :production-trends="productionTrends" :produce-types="produceTypes" />
        </div>

        <!-- Pantry Commitment Tracker -->
        <div class="space-y-4">
          <div v-if="loading" class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex justify-center items-center py-8">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600 mx-auto mb-3"></div>
                <p class="text-gray-500 text-sm">Loading pantry commitments...</p>
              </div>
            </div>
          </div>
          <CommitmentTracker v-else :pantry-progress="pantryProgress" :loading="loading"
            @view-details="viewPantryDetails" />
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

    <!-- Pantry Details Modal -->
    <div v-if="selectedPantry" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-6 border max-w-2xl shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold text-gray-900">{{ selectedPantry.name }}</h3>
            <button @click="selectedPantry = null" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <!-- Progress Overview -->
            <div v-if="selectedPantryProgress" class="bg-garden-green-50 rounded-lg p-4">
              <h4 class="font-semibold text-gray-800 mb-3">Progress Overview</h4>
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-garden-green-600">{{ selectedPantryProgress.percentage.toFixed(1)
                    }}%</div>
                  <div class="text-sm text-gray-600">Complete</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">{{ selectedPantryProgress.remaining.toFixed(1) }}</div>
                  <div class="text-sm text-gray-600">lbs Remaining</div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div class="bg-garden-green-600 h-3 rounded-full transition-all duration-300"
                  :style="{ width: `${Math.min(100, selectedPantryProgress.percentage)}%` }"></div>
              </div>
              <div class="flex justify-between text-sm text-gray-600">
                <span>{{ selectedPantryProgress.delivered.toFixed(1) }} lbs delivered</span>
                <span>{{ selectedPantryProgress.committed.toFixed(1) }} lbs committed</span>
              </div>
            </div>

            <!-- Contact Information -->
            <div v-if="selectedPantry.contactInfo">
              <h4 class="font-semibold text-gray-800 mb-3">Contact Information</h4>
              <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                <div v-if="selectedPantry.contactInfo.phone" class="flex items-center">
                  <svg class="w-4 h-4 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span class="text-gray-700">{{ selectedPantry.contactInfo.phone }}</span>
                </div>
                <div v-if="selectedPantry.contactInfo.email" class="flex items-center">
                  <svg class="w-4 h-4 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span class="text-gray-700">{{ selectedPantry.contactInfo.email }}</span>
                </div>
                <div v-if="selectedPantry.contactInfo.address" class="flex items-start">
                  <svg class="w-4 h-4 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="text-gray-700">{{ selectedPantry.contactInfo.address }}</span>
                </div>
              </div>
            </div>

            <!-- Annual Commitments -->
            <div v-if="selectedPantry.commitmentAmounts">
              <h4 class="font-semibold text-gray-800 mb-3">Annual Commitments</h4>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="text-center p-3 bg-white rounded-lg">
                    <div class="text-xl font-bold text-garden-green-600">{{ selectedPantry.commitmentAmounts.total || 0
                      }}</div>
                    <div class="text-sm text-gray-600">Total lbs</div>
                  </div>
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Vegetables:</span>
                      <span class="font-medium">{{ selectedPantry.commitmentAmounts.vegetables || 0 }} lbs</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Fruits:</span>
                      <span class="font-medium">{{ selectedPantry.commitmentAmounts.fruits || 0 }} lbs</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Herbs:</span>
                      <span class="font-medium">{{ selectedPantry.commitmentAmounts.herbs || 0 }} lbs</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Flowers:</span>
                      <span class="font-medium">{{ selectedPantry.commitmentAmounts.flowers || 0 }} lbs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Delivery History Placeholder -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h5 class="font-medium text-yellow-800">Delivery Tracking</h5>
                  <p class="text-sm text-yellow-700">Delivery tracking system is not yet implemented. Progress currently
                    shows 0% for all pantries.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Charts from '@/components/dashboard/Charts.vue'
import CommitmentTracker from '@/components/dashboard/CommitmentTracker.vue'
import ProductionSummary from '@/components/dashboard/ProductionSummary.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useAuth } from '@/composables/useAuth'
import { usePusher } from '@/composables/usePusher'
import { useDashboardStore } from '@/stores/dashboard'
import { useHarvestStore } from '@/stores/harvest'
import { computed, onMounted, onUnmounted, ref } from 'vue'


type FoodPantry = Database['public']['Tables']['food_pantries']['Row']

const dashboardStore = useDashboardStore()
const harvestStore = useHarvestStore()
const { subscribeToHarvestUpdates } = usePusher()
const { isAuthenticated } = useAuth()

const selectedPantry = ref<FoodPantry | null>(null)
const currentTime = ref(new Date().toLocaleTimeString())
const refreshInterval = ref<NodeJS.Timeout | null>(null)


// Store getters - use computed to maintain reactivity
const summary = computed(() => dashboardStore.summary)
const recentEntries = computed(() => dashboardStore.recentEntries)
const pantryProgress = computed(() => dashboardStore.pantryProgress)
const produceBreakdown = computed(() => dashboardStore.produceBreakdown)
const productionTrends = computed(() => dashboardStore.productionTrends)
const loading = computed(() => dashboardStore.loading)
const error = computed(() => dashboardStore.error)

const produceTypes = computed(() => harvestStore.produceTypes)

// Get progress data for the selected pantry
const selectedPantryProgress = computed(() => {
  if (!selectedPantry.value) return null
  return pantryProgress.value.find(p => p.pantry.id === selectedPantry.value?.id) || null
})

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
  return new Date().toLocaleTimeString('en-US', {
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

  // Set up real-time updates
  subscribeToHarvestUpdates(() => {
    dashboardStore.fetchAll()
  })

  // Auto-refresh every 30 seconds
  refreshInterval.value = setInterval(() => {
    dashboardStore.fetchAll()
    currentTime.value = new Date().toLocaleTimeString()
  }, 30000)

  // Update clock every second
  setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

const refreshData = async () => {
  await dashboardStore.fetchAll()
}

const viewPantryDetails = (pantry: FoodPantry) => {
  selectedPantry.value = pantry
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