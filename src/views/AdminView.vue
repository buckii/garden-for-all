<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="px-4 py-6 sm:px-0">
        <div class="border-4 border-dashed border-gray-200 rounded-lg">
          <!-- Tab Navigation -->
          <div class="bg-white">
            <div class="border-b border-gray-200">
              <!-- Desktop Grouped Navigation -->
              <div class="hidden sm:flex items-center justify-between px-6 py-4">
                <div class="flex space-x-8">
                  <!-- Configuration Group -->
                  <div class="relative" @mouseenter="showConfigDropdown = true" @mouseleave="showConfigDropdown = false">
                    <button :class="[
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isInGroup(activeTab, 'config')
                        ? 'bg-garden-green-100 text-garden-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    ]">
                      <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      Configuration
                      <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    <div v-if="showConfigDropdown" class="absolute z-10 top-full w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div class="py-1">
                        <button @click="setActiveTab('categories')" :class="['block w-full text-left px-4 py-2 text-sm', activeTab === 'categories' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Categories
                        </button>
                        <button @click="setActiveTab('types')" :class="['block w-full text-left px-4 py-2 text-sm', activeTab === 'types' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Produce Types
                        </button>
                        <button @click="setActiveTab('locations')" :class="['block w-full text-left px-4 py-2 text-sm', activeTab === 'locations' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Harvest Locations
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Data Management Group -->
                  <div class="relative" @mouseenter="showDataDropdown = true" @mouseleave="showDataDropdown = false">
                    <button :class="[
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isInGroup(activeTab, 'data')
                        ? 'bg-garden-green-100 text-garden-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    ]">
                      <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      Data Management
                      <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    <div v-if="showDataDropdown" class="absolute z-10 top-full w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div class="py-1">
                        <button @click="setActiveTab('pantries')" :class="['block w-full text-left px-4 py-2 text-sm', activeTab === 'pantries' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Food Pantries
                        </button>
                        <router-link to="/commitments" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Commitments
                        </router-link>
                        <button @click="setActiveTab('entries')" :class="['block w-full text-left px-4 py-2 text-sm', activeTab === 'entries' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Harvest Entries
                        </button>
                        <button @click="setActiveTab('orders')" :class="['block w-full text-left px-4 py-2 text-sm', activeTab === 'orders' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Orders
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- User Management -->
                  <button
                    @click="setActiveTab('users')"
                    :class="[
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      activeTab === 'users'
                        ? 'bg-garden-green-100 text-garden-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    ]"
                  >
                    <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                    </svg>
                    Users
                  </button>

                  <!-- Export -->
                  <button
                    @click="setActiveTab('export')"
                    :class="[
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      activeTab === 'export'
                        ? 'bg-garden-green-100 text-garden-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    ]"
                  >
                    <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export Data
                  </button>
                </div>
              </div>
              
              <!-- Mobile Navigation -->
              <div class="sm:hidden px-4 py-2">
                <select
                  v-model="activeTab"
                  class="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-garden-green-500 focus:outline-none focus:ring-garden-green-500"
                >
                  <optgroup label="Configuration">
                    <option value="categories">Categories</option>
                    <option value="types">Produce Types</option>
                    <option value="locations">Harvest Locations</option>
                  </optgroup>
                  <optgroup label="Data Management">
                    <option value="pantries">Food Pantries</option>
                    <option value="commitments">Commitments</option>
                    <option value="entries">Harvest Entries</option>
                    <option value="orders">Orders</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="users">Users</option>
                    <option value="export">Export Data</option>
                  </optgroup>
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
            <HarvestLocations v-else-if="activeTab === 'locations'" />
            <HarvestEntries v-else-if="activeTab === 'entries'" />
            <OrderManagement v-else-if="activeTab === 'orders'" />
            <UserManagement v-else-if="activeTab === 'users'" />
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
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHarvestStore } from '@/stores/harvest'
import { useAdminStore } from '@/stores/admin'
import { exportHarvestData } from '@/utils/excelExport'
import AppHeader from '@/components/layout/AppHeader.vue'
import ProduceCategories from '@/components/admin/ProduceCategories.vue'
import ProduceTypes from '@/components/admin/ProduceTypes.vue'
import FoodPantries from '@/components/admin/FoodPantries.vue'
import HarvestLocations from '@/components/admin/HarvestLocations.vue'
import HarvestEntries from '@/components/admin/HarvestEntries.vue'
import OrderManagement from '@/components/admin/OrderManagement.vue'
import UserManagement from '@/components/admin/UserManagement.vue'

const route = useRoute()
const router = useRouter()
const harvestStore = useHarvestStore()
const adminStore = useAdminStore()

const activeTab = ref('categories')
const exporting = ref(false)
const exportResult = ref<any>(null)
const showConfigDropdown = ref(false)
const showDataDropdown = ref(false)

const exportOptions = ref({
  startDate: '',
  endDate: '',
  format: 'detailed'
})

// Initialize stores
onMounted(async () => {
  // Check for tab query parameter
  if (route.query.tab && typeof route.query.tab === 'string') {
    activeTab.value = route.query.tab
  }
  
  // Fetch all admin data in parallel
  await Promise.all([
    adminStore.fetchCategories(),
    adminStore.fetchProduceTypes(),
    adminStore.fetchFoodPantries()
  ])
})

// Watch for route changes
watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string') {
    activeTab.value = newTab
  }
})

// Watch for activeTab changes to handle navigation
watch(activeTab, (newTab) => {
  if (newTab === 'commitments') {
    router.push('/commitments')
  }
})

// Helper functions for grouped navigation
const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
  showConfigDropdown.value = false
  showDataDropdown.value = false
}

const isInGroup = (tabId: string, groupName: string): boolean => {
  const groups = {
    config: ['categories', 'types', 'locations'],
    data: ['pantries', 'commitments', 'entries', 'orders']
  }
  return groups[groupName]?.includes(tabId) || false
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
    // Fetch harvest entries based on date range from our API
    const params = new URLSearchParams()
    if (exportOptions.value.startDate) params.append('startDate', exportOptions.value.startDate)
    if (exportOptions.value.endDate) params.append('endDate', exportOptions.value.endDate)
    
    const response = await fetch(`/.netlify/functions/harvest-list?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    if (!data.success) throw new Error(data.error)

    const result = await exportHarvestData(
      data.data || [],
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