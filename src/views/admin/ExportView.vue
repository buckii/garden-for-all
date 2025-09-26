<template>
  <AdminLayout>
    <div class="space-y-8">
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
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useHarvestStore } from '@/stores/harvest'
import { useAdminStore } from '@/stores/admin'
import { exportHarvestData } from '@/utils/excelExport'
import AdminLayout from '@/components/admin/AdminLayout.vue'

const harvestStore = useHarvestStore()
const adminStore = useAdminStore()

const exporting = ref(false)
const exportResult = ref<any>(null)

const exportOptions = ref({
  startDate: '',
  endDate: '',
  format: 'detailed'
})

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