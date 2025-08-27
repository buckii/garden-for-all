<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Header -->
    <nav class="bg-gray-900 shadow-lg sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="flex items-center">
              <img 
                src="https://content.app-sources.com/s/79642463807075583/uploads/logo_options/2025_Horizontal_Logo_Color_-9406719.png?format=webp" 
                alt="Garden For All"
                class="h-10 w-auto"
              />
            </router-link>
          </div>
          
          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-4">
            <router-link 
              to="/dashboard"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </router-link>
            <router-link 
              to="/harvest"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Harvest
            </router-link>
            
            <!-- User Info & Logout -->
            <div class="flex items-center space-x-3 pl-4 border-l border-gray-600">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-garden-green-600 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div class="text-sm">
                  <p class="text-gray-100 font-medium">{{ userDisplayName }}</p>
                  <p class="text-gray-400 text-xs">Admin</p>
                </div>
              </div>
              <button
                @click="handleSignOut"
                class="text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden flex items-center">
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="text-gray-300 hover:text-white p-2 rounded-md"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        <div v-if="mobileMenuOpen" class="md:hidden">
          <div class="px-2 pt-2 pb-3 space-y-1 border-t border-gray-600">
            <router-link 
              to="/dashboard"
              @click="mobileMenuOpen = false"
              class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Dashboard
            </router-link>
            <router-link 
              to="/harvest"
              @click="mobileMenuOpen = false"
              class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Harvest
            </router-link>
            
            <div class="border-t border-gray-600 pt-3 mt-3">
              <div class="flex items-center px-3 py-2">
                <div class="w-8 h-8 bg-garden-green-600 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-gray-100 text-sm font-medium">{{ userDisplayName }}</p>
                  <p class="text-gray-400 text-xs">Admin</p>
                </div>
              </div>
              <button
                @click="handleSignOut(); mobileMenuOpen = false"
                class="text-gray-300 hover:text-red-400 block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="px-4 py-6 sm:px-0">
        <div class="border-4 border-dashed border-gray-200 rounded-lg">
          <!-- Tab Navigation -->
          <div class="bg-white">
            <div class="border-b border-gray-200">
              <!-- Desktop Tab Navigation -->
              <nav class="-mb-px hidden sm:flex space-x-8 px-6" aria-label="Tabs">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  @click="activeTab = tab.id"
                  :class="[
                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                    activeTab === tab.id
                      ? 'border-garden-green-500 text-garden-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  ]"
                >
                  <component :is="tab.icon" class="mr-2 h-5 w-5 inline" />
                  {{ tab.name }}
                </button>
              </nav>
              
              <!-- Mobile Tab Dropdown -->
              <div class="sm:hidden px-4 py-2">
                <select
                  v-model="activeTab"
                  class="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-garden-green-500 focus:outline-none focus:ring-garden-green-500"
                >
                  <option v-for="tab in tabs" :key="tab.id" :value="tab.id">
                    {{ tab.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <!-- Loading state for admin data -->
            <div v-if="adminStore.loading && (activeTab === 'categories' || activeTab === 'types' || activeTab === 'pantries')" 
                 class="flex justify-center items-center py-12">
              <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-garden-green-600 mx-auto mb-4"></div>
                <p class="text-gray-500">Loading {{ activeTab === 'categories' ? 'categories' : activeTab === 'types' ? 'produce types' : 'food pantries' }}...</p>
              </div>
            </div>
            
            <!-- Error state for admin data -->
            <div v-else-if="adminStore.error && (activeTab === 'categories' || activeTab === 'types' || activeTab === 'pantries')" 
                 class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium">Error loading data</h3>
                  <p class="text-sm">{{ adminStore.error }}</p>
                </div>
              </div>
            </div>
            
            <!-- Tab components -->
            <ProduceCategories v-else-if="activeTab === 'categories'" />
            <ProduceTypes v-else-if="activeTab === 'types'" />
            <FoodPantries v-else-if="activeTab === 'pantries'" />
            <HarvestEntries v-else-if="activeTab === 'entries'" />
            <div v-if="activeTab === 'export'" class="space-y-8">
              <div class="text-center">
                <svg class="mx-auto h-12 w-12 text-garden-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h3 class="mt-2 text-lg font-medium text-gray-900">Export Harvest Data</h3>
                <p class="mt-1 text-sm text-gray-500">Generate Excel reports for harvest tracking and analysis</p>
              </div>

              <!-- Export Options -->
              <div class="bg-gray-50 rounded-lg p-6 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Date Range -->
                  <div>
                    <h4 class="font-medium text-gray-900 mb-3">Date Range</h4>
                    <div class="space-y-3">
                      <div>
                        <label class="block text-sm text-gray-700 mb-1">Start Date</label>
                        <input
                          v-model="exportOptions.startDate"
                          type="date"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label class="block text-sm text-gray-700 mb-1">End Date</label>
                        <input
                          v-model="exportOptions.endDate"
                          type="date"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                        />
                      </div>
                      <button
                        @click="setCurrentYear"
                        class="text-sm text-garden-green-600 hover:text-garden-green-800"
                      >
                        Set to Current Year
                      </button>
                    </div>
                  </div>

                  <!-- Format Options -->
                  <div>
                    <h4 class="font-medium text-gray-900 mb-3">Export Format</h4>
                    <div class="space-y-2">
                      <label class="flex items-center">
                        <input
                          v-model="exportOptions.format"
                          type="radio"
                          value="summary"
                          class="mr-2 text-garden-green-600 focus:ring-garden-green-500"
                        />
                        <span class="text-sm">Summary Report</span>
                      </label>
                      <label class="flex items-center">
                        <input
                          v-model="exportOptions.format"
                          type="radio"
                          value="detailed"
                          class="mr-2 text-garden-green-600 focus:ring-garden-green-500"
                        />
                        <span class="text-sm">Detailed Report (All Data)</span>
                      </label>
                      <label class="flex items-center">
                        <input
                          v-model="exportOptions.format"
                          type="radio"
                          value="pantry"
                          class="mr-2 text-garden-green-600 focus:ring-garden-green-500"
                        />
                        <span class="text-sm">Pantry Commitment Report</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Export Actions -->
              <div class="flex justify-center space-x-4">
                <button
                  @click="exportData"
                  :disabled="exporting"
                  class="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-garden-green-600 hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg v-if="exporting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ exporting ? 'Exporting...' : 'Export to Excel' }}
                </button>
              </div>

              <!-- Export Results -->
              <div v-if="exportResult" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-green-800">Export Successful!</h3>
                    <div class="mt-1 text-sm text-green-700">
                      <p>File: {{ exportResult.filename }}</p>
                      <p>Records: {{ exportResult.recordCount }}</p>
                      <p v-if="exportResult.dateRange.startDate || exportResult.dateRange.endDate">
                        Date Range: {{ exportResult.dateRange.startDate || 'Beginning' }} to {{ exportResult.dateRange.endDate || 'End' }}
                      </p>
                    </div>
                  </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useHarvestStore } from '@/stores/harvest'
import { useAdminStore } from '@/stores/admin'
import { exportHarvestData } from '@/utils/excelExport'
import ProduceCategories from '@/components/admin/ProduceCategories.vue'
import ProduceTypes from '@/components/admin/ProduceTypes.vue'
import FoodPantries from '@/components/admin/FoodPantries.vue'
import HarvestEntries from '@/components/admin/HarvestEntries.vue'

const router = useRouter()
const { signOut, user } = useAuth()
const harvestStore = useHarvestStore()
const adminStore = useAdminStore()

const activeTab = ref('categories')
const exporting = ref(false)
const exportResult = ref<any>(null)
const mobileMenuOpen = ref(false)

// User display name
const userDisplayName = computed(() => {
  if (!user.value) return 'Admin'
  return user.value.email?.split('@')[0] || user.value.email || 'Admin'
})

const exportOptions = ref({
  startDate: '',
  endDate: '',
  format: 'detailed'
})

// Initialize stores
onMounted(async () => {
  // Fetch all admin data in parallel
  await Promise.all([
    adminStore.fetchCategories(),
    adminStore.fetchProduceTypes(),
    adminStore.fetchFoodPantries()
  ])
})

// Define tab icons as strings for now
const tabs = [
  { 
    id: 'categories', 
    name: 'Categories',
    icon: 'svg' // We'll use inline SVG
  },
  { 
    id: 'types', 
    name: 'Produce Types',
    icon: 'svg'
  },
  { 
    id: 'pantries', 
    name: 'Food Pantries',
    icon: 'svg'
  },
  { 
    id: 'entries', 
    name: 'Harvest Entries',
    icon: 'svg'
  },
  { 
    id: 'export', 
    name: 'Export Data',
    icon: 'svg'
  }
]

const handleSignOut = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Sign out failed:', error)
  }
}

const setCurrentYear = () => {
  const currentYear = new Date().getFullYear()
  exportOptions.value.startDate = `${currentYear}-01-01`
  exportOptions.value.endDate = `${currentYear}-12-31`
}

const exportData = async () => {
  exporting.value = true
  exportResult.value = null
  
  try {
    // Fetch harvest entries based on date range
    const { data: harvestEntries, error } = await supabase
      .from('harvest_entries')
      .select(`
        *,
        produce_type:produce_types(
          *,
          category:produce_categories(*)
        )
      `)
      .gte('harvest_date', exportOptions.value.startDate || '1900-01-01')
      .lte('harvest_date', exportOptions.value.endDate || '2100-12-31')
      .order('harvest_date', { ascending: true })

    if (error) throw error

    const result = await exportHarvestData(
      harvestEntries || [],
      harvestStore.produceTypes,
      adminStore.categories,
      adminStore.foodPantries,
      {
        startDate: exportOptions.value.startDate,
        endDate: exportOptions.value.endDate,
        format: exportOptions.value.format as 'summary' | 'detailed' | 'pantry'
      }
    )

    exportResult.value = result
    
    // Clear result after 10 seconds
    setTimeout(() => {
      exportResult.value = null
    }, 10000)
    
  } catch (error) {
    console.error('Export failed:', error)
    alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    exporting.value = false
  }
}
</script>