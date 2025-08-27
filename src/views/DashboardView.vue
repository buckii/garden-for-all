<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Header -->
    <nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="flex items-center">
              <div class="w-8 h-8 bg-garden-green-600 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
                </svg>
              </div>
              <h1 class="ml-3 text-xl font-semibold text-gray-900">Garden For All Dashboard</h1>
            </router-link>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-500">
              Last updated: {{ formattedLastUpdated }}
            </div>
            <button
              @click="refreshData"
              :disabled="loading"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh Data"
            >
              <svg 
                :class="['w-5 h-5', { 'animate-spin': loading }]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
            <router-link 
              to="/harvest"
              class="bg-garden-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-garden-green-700"
            >
              + Add Harvest
            </router-link>
            <router-link 
              to="/admin"
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Admin
            </router-link>
            
            <!-- User Info & Logout (only show if authenticated) -->
            <div v-if="isAuthenticated" class="flex items-center space-x-3 pl-4 border-l border-gray-300">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-garden-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-garden-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div class="text-sm">
                  <p class="text-gray-700 font-medium">{{ userDisplayName }}</p>
                  <p class="text-gray-500 text-xs" v-if="isAdmin">Admin</p>
                </div>
              </div>
              <button
                @click="handleSignOut"
                class="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Dashboard Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Header with Date/Time -->
      <div class="mb-8 text-center">
        <h2 class="text-3xl font-bold text-gray-900">{{ currentDate }}</h2>
        <p class="text-lg text-gray-600">{{ currentTime }}</p>
        
        <!-- Weather Widget Placeholder -->
        <div class="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
          <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          <span class="text-blue-700 font-medium">Perfect day for gardening! 🌱</span>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
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
          <Charts
            v-else
            :summary="summary"
            :recent-entries="recentEntries"
            :produce-breakdown="produceBreakdown"
            :production-trends="productionTrends"
            :produce-types="produceTypes"
          />
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
          <CommitmentTracker
            v-else
            :pantry-progress="pantryProgress"
            :loading="loading"
            @view-details="viewPantryDetails"
          />
        </div>
      </div>
    </div>

    <!-- Fullscreen Toggle (for TV Display) -->
    <button
      @click="toggleFullscreen"
      class="fixed bottom-4 right-4 p-3 bg-garden-green-600 text-white rounded-full shadow-lg hover:bg-garden-green-700 transition-colors"
      title="Toggle Fullscreen"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
      </svg>
    </button>

    <!-- Pantry Details Modal -->
    <div v-if="selectedPantry" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">{{ selectedPantry.name }}</h3>
            <button
              @click="selectedPantry = null"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="space-y-3">
            <div v-if="selectedPantry.contact_info">
              <h4 class="font-medium text-gray-700">Contact Information</h4>
              <div class="text-sm text-gray-600 space-y-1">
                <p v-if="selectedPantry.contact_info.phone">📞 {{ selectedPantry.contact_info.phone }}</p>
                <p v-if="selectedPantry.contact_info.email">✉️ {{ selectedPantry.contact_info.email }}</p>
                <p v-if="selectedPantry.contact_info.address">📍 {{ selectedPantry.contact_info.address }}</p>
              </div>
            </div>
            
            <div v-if="selectedPantry.commitment_amounts">
              <h4 class="font-medium text-gray-700">Annual Commitments</h4>
              <div class="text-sm text-gray-600 space-y-1">
                <p>Total: {{ selectedPantry.commitment_amounts.total || 0 }} lbs</p>
                <p>Vegetables: {{ selectedPantry.commitment_amounts.vegetables || 0 }} lbs</p>
                <p>Fruits: {{ selectedPantry.commitment_amounts.fruits || 0 }} lbs</p>
                <p>Herbs: {{ selectedPantry.commitment_amounts.herbs || 0 }} lbs</p>
                <p>Flowers: {{ selectedPantry.commitment_amounts.flowers || 0 }} lbs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import { useHarvestStore } from '@/stores/harvest'
import { usePusher } from '@/composables/usePusher'
import { useAuth } from '@/composables/useAuth'
import ProductionSummary from '@/components/dashboard/ProductionSummary.vue'
import Charts from '@/components/dashboard/Charts.vue'
import CommitmentTracker from '@/components/dashboard/CommitmentTracker.vue'


type FoodPantry = Database['public']['Tables']['food_pantries']['Row']

const router = useRouter()
const dashboardStore = useDashboardStore()
const harvestStore = useHarvestStore()
const { subscribeToHarvestUpdates } = usePusher()
const { user, isAuthenticated, isAdmin, signOut } = useAuth()

const selectedPantry = ref<FoodPantry | null>(null)
const currentTime = ref(new Date().toLocaleTimeString())
const refreshInterval = ref<NodeJS.Timeout | null>(null)

// User display name
const userDisplayName = computed(() => {
  if (!user.value) return 'User'
  return user.value.email?.split('@')[0] || user.value.email || 'User'
})

// Store getters - use computed to maintain reactivity
const summary = computed(() => dashboardStore.summary)
const recentEntries = computed(() => dashboardStore.recentEntries)
const pantryProgress = computed(() => dashboardStore.pantryProgress)
const produceBreakdown = computed(() => dashboardStore.produceBreakdown)
const productionTrends = computed(() => dashboardStore.productionTrends)
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

const handleSignOut = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Sign out failed:', error)
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