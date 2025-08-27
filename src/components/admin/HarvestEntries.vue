<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-900">Harvest Entries</h2>
      <div class="text-sm text-gray-500">
        Total: {{ pagination.total || 0 }} entries
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white p-4 rounded-lg border border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            v-model="searchQuery"
            @input="debouncedSearch"
            type="text"
            placeholder="Search notes or harvester name..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
          />
        </div>

        <!-- Sort By -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            v-model="sortBy"
            @change="fetchEntries"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
          >
            <option value="harvestDate">Harvest Date</option>
            <option value="createdAt">Created Date</option>
            <option value="weight">Weight</option>
            <option value="quantity">Quantity</option>
          </select>
        </div>

        <!-- Sort Order -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Order</label>
          <select
            v-model="sortOrder"
            @change="fetchEntries"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-garden-green-600 mx-auto mb-4"></div>
        <p class="text-gray-500">Loading harvest entries...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      <p>{{ error }}</p>
    </div>

    <!-- Entries Table -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pantry
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity/Weight
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harvester
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="entry in entries" :key="entry._id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="text-sm">
                  <div class="font-medium text-gray-900">{{ entry.produceType?.name || 'Unknown' }}</div>
                  <div class="text-gray-500">{{ entry.produceType?.category?.name || 'N/A' }}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ entry.pantry?.name || 'Unknown' }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm">
                  <div class="font-medium text-gray-900">
                    {{ entry.quantity }} {{ entry.unit }}
                  </div>
                  <div class="text-gray-500">
                    {{ entry.weight?.toFixed(2) || '0.00' }} lbs
                    <span v-if="entry.weightEstimated" class="text-xs">(est.)</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">
                  {{ formatDate(entry.harvestDate) }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">
                  {{ entry.harvesterName || 'N/A' }}
                </div>
                <div v-if="entry.notes" class="text-xs text-gray-500 max-w-xs truncate" :title="entry.notes">
                  {{ entry.notes }}
                </div>
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <button
                  @click="editEntry(entry)"
                  class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  @click="deleteEntry(entry)"
                  class="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>
            <tr v-if="entries.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                No harvest entries found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="changePage(pagination.current - 1)"
            :disabled="!pagination.hasPrev"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="changePage(pagination.current + 1)"
            :disabled="!pagination.hasNext"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing {{ ((pagination.current - 1) * pagination.limit) + 1 }} to 
              {{ Math.min(pagination.current * pagination.limit, pagination.total) }} of 
              {{ pagination.total }} results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                @click="changePage(pagination.current - 1)"
                :disabled="!pagination.hasPrev"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                v-for="page in getVisiblePages()"
                :key="page"
                @click="changePage(page)"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === pagination.current
                    ? 'z-10 bg-garden-green-50 border-garden-green-500 text-garden-green-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="changePage(pagination.current + 1)"
                :disabled="!pagination.hasNext"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingEntry" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeEditModal">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white" @click.stop>
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Harvest Entry</h3>
          
          <form @submit.prevent="saveEntry" class="space-y-4">
            <!-- Produce Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Produce Type</label>
              <select
                v-model="editForm.produceTypeId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
              >
                <option value="">Select produce type...</option>
                <option 
                  v-for="type in adminStore.produceTypes" 
                  :key="type._id" 
                  :value="type._id"
                >
                  {{ type.category?.name }} - {{ type.name }}
                </option>
              </select>
            </div>

            <!-- Pantry -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Pantry</label>
              <select
                v-model="editForm.pantryId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
              >
                <option value="">Select pantry...</option>
                <option 
                  v-for="pantry in adminStore.foodPantries" 
                  :key="pantry._id" 
                  :value="pantry._id"
                >
                  {{ pantry.name }}
                </option>
              </select>
            </div>

            <!-- Quantity and Unit -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  v-model.number="editForm.quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <input
                  :value="selectedProduceTypeUnit"
                  type="text"
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p class="text-xs text-gray-500 mt-1">Unit is automatically set by the produce type</p>
              </div>
            </div>

            <!-- Weight -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Weight (lbs)</label>
              <input
                v-model.number="editForm.weight"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
              />
            </div>

            <!-- Harvest Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Harvest Date</label>
              <input
                v-model="editForm.harvestDate"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
              />
            </div>

            <!-- Harvester Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Harvester Name</label>
              <input
                v-model="editForm.harvesterName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
              />
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                v-model="editForm.notes"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeEditModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 text-sm font-medium text-white bg-garden-green-600 rounded-md hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()

// State
const entries = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const sortBy = ref('harvestDate')
const sortOrder = ref('desc')
const currentPage = ref(1)
const pageLimit = ref(20)
const pagination = ref({
  current: 1,
  pages: 1,
  total: 0,
  limit: 20,
  hasNext: false,
  hasPrev: false
})

// Edit modal state
const editingEntry = ref<any>(null)
const editForm = ref({
  produceTypeId: '',
  pantryId: '',
  quantity: 0,
  unit: '',
  weight: 0,
  harvestDate: '',
  harvesterName: '',
  notes: ''
})
const saving = ref(false)

// Debounced search
let searchTimeout: NodeJS.Timeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchEntries()
  }, 300)
}

// Fetch harvest entries
const fetchEntries = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: pageLimit.value.toString(),
      search: searchQuery.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })

    const response = await fetch(`/.netlify/functions/harvest-list?${params}`)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch harvest entries')
    }

    entries.value = result.data.entries || []
    pagination.value = result.data.pagination || pagination.value

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    loading.value = false
  }
}

// Change page
const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.value.pages) {
    currentPage.value = page
    fetchEntries()
  }
}

// Get visible page numbers for pagination
const getVisiblePages = () => {
  const current = pagination.value.current
  const total = pagination.value.pages
  const delta = 2 // Number of pages to show on each side of current page
  
  let start = Math.max(1, current - delta)
  let end = Math.min(total, current + delta)
  
  // Adjust if we're near the beginning or end
  if (current <= delta) {
    end = Math.min(total, 2 * delta + 1)
  }
  if (current + delta >= total) {
    start = Math.max(1, total - 2 * delta)
  }
  
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
}

// Edit entry
const editEntry = (entry: any) => {
  editingEntry.value = entry
  editForm.value = {
    produceTypeId: entry.produceTypeId || entry.produce_type_id,
    pantryId: entry.pantryId || entry.pantry_id,
    quantity: entry.quantity,
    unit: entry.unit,
    weight: entry.weight,
    harvestDate: entry.harvestDate || entry.harvest_date,
    harvesterName: entry.harvesterName || entry.harvester_name || '',
    notes: entry.notes || ''
  }
}

// Close edit modal
const closeEditModal = () => {
  editingEntry.value = null
  editForm.value = {
    produceTypeId: '',
    pantryId: '',
    quantity: 0,
    unit: '',
    weight: 0,
    harvestDate: '',
    harvesterName: '',
    notes: ''
  }
}

// Save entry
const saveEntry = async () => {
  saving.value = true
  
  try {
    // Update unit based on selected produce type
    const updatedForm = {
      ...editForm.value,
      unit: selectedProduceTypeUnit.value
    }
    
    const response = await fetch(`/.netlify/functions/harvest-update?id=${editingEntry.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedForm)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update harvest entry')
    }

    // Refresh the list
    await fetchEntries()
    closeEditModal()

  } catch (err) {
    alert(`Failed to save changes: ${err instanceof Error ? err.message : 'Unknown error'}`)
  } finally {
    saving.value = false
  }
}

// Delete entry
const deleteEntry = async (entry: any) => {
  if (!confirm(`Are you sure you want to delete this harvest entry for ${entry.produceType?.name || 'Unknown'}?`)) {
    return
  }

  try {
    const response = await fetch(`/.netlify/functions/harvest-delete?id=${entry._id}`, {
      method: 'DELETE'
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete harvest entry')
    }

    // Refresh the list
    await fetchEntries()

  } catch (err) {
    alert(`Failed to delete entry: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

// Format date
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}

// Get unit for selected produce type
const selectedProduceTypeUnit = computed(() => {
  if (!editForm.value.produceTypeId) return ''
  const selectedType = adminStore.produceTypes.find((type: any) => type._id === editForm.value.produceTypeId)
  return selectedType?.unitType || 'items'
})

// Initialize
onMounted(async () => {
  // Load admin data if not already loaded
  await Promise.all([
    adminStore.fetchProduceTypes(),
    adminStore.fetchFoodPantries()
  ])
  
  // Load harvest entries
  await fetchEntries()
})
</script>