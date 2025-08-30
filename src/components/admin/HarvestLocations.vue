<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Harvest Locations</h2>
        <p class="text-gray-600">Manage growth and harvest locations with automatic geocoding</p>
      </div>
      <button @click="showAddModal = true"
        class="px-4 py-2 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 transition-colors">
        Add Location
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {{ error }}
    </div>

    <!-- Locations List -->
    <div v-else class="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div v-if="locations.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <p class="mt-4 text-lg text-gray-500">No harvest locations</p>
        <button @click="showAddModal = true"
          class="mt-2 text-garden-green-600 hover:text-garden-green-700">
          Add your first location
        </button>
      </div>

      <div v-else>
        <!-- Table Header -->
        <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div class="grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div class="col-span-3">Location Name</div>
            <div class="col-span-6">Address</div>
            <div class="col-span-2">Coordinates</div>
            <div class="col-span-1">Actions</div>
          </div>
        </div>

        <!-- Locations List -->
        <div class="divide-y divide-gray-200">
          <div v-for="location in locations" :key="location._id || location.id"
            class="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div class="grid grid-cols-12 gap-4 items-center">
              <!-- Location Name -->
              <div class="col-span-3">
                <div class="font-medium text-gray-900">{{ location.name }}</div>
              </div>

              <!-- Address -->
              <div class="col-span-6">
                <div class="text-sm text-gray-900">{{ location.address.street }}</div>
                <div class="text-xs text-gray-500">{{ location.address.city }}, {{ location.address.state }} {{ location.address.zip }}</div>
              </div>

              <!-- Coordinates -->
              <div class="col-span-2">
                <div v-if="location.coordinates" class="text-xs text-gray-500 flex items-center justify-between">
                  <span>{{ location.coordinates.latitude?.toFixed(4) }}, {{ location.coordinates.longitude?.toFixed(4) }}</span>
                  <a :href="`https://www.google.com/maps?q=${location.coordinates.latitude},${location.coordinates.longitude}`"
                     target="_blank"
                     class="text-blue-500 hover:text-blue-700 text-xs underline ml-2">
                    Map
                  </a>
                </div>
                <div v-else class="text-xs text-gray-400">Not geocoded</div>
              </div>

              <!-- Actions -->
              <div class="col-span-1">
                <div class="flex space-x-1">
                  <button @click="editLocation(location)"
                    class="text-blue-400 hover:text-blue-600 p-1"
                    title="Edit Location">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button @click="deleteLocation(location)"
                    class="text-red-400 hover:text-red-600 p-1"
                    title="Delete Location">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Location Modal -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-6 border max-w-2xl shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <!-- Modal Header -->
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold text-gray-900">
              {{ showEditModal ? 'Edit Location' : 'Add New Location' }}
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Error/Success Messages -->
          <div v-if="modalError" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
            <p class="text-sm text-red-700">{{ modalError }}</p>
          </div>

          <div v-if="modalSuccess" class="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
            <p class="text-sm text-green-700">{{ modalSuccess }}</p>
          </div>

          <form @submit.prevent="saveLocation" class="space-y-6">
            <!-- Location Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
              <input type="text" v-model="locationForm.name" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>

            <!-- Address -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                <input type="text" v-model="locationForm.address.street" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input type="text" v-model="locationForm.address.city" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input type="text" v-model="locationForm.address.state" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                <input type="text" v-model="locationForm.address.zip" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              </div>
            </div>

            <!-- Submit Buttons -->
            <div class="flex justify-end space-x-4 pt-4 border-t">
              <button type="button" @click="closeModal"
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" :disabled="modalLoading"
                class="px-6 py-2 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <span v-if="modalLoading">Saving...</span>
                <span v-else>{{ showEditModal ? 'Save Changes' : 'Add Location' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface HarvestLocation {
  _id?: string
  id?: string
  name: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  isActive: boolean
}

// State
const locations = ref<HarvestLocation[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const modalLoading = ref(false)
const modalError = ref<string | null>(null)
const modalSuccess = ref<string | null>(null)
const editingLocation = ref<HarvestLocation | null>(null)

const locationForm = ref({
  name: '',
  address: {
    street: '',
    city: '',
    state: '',
    zip: ''
  }
})

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/.netlify/functions'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Fetch locations
const fetchLocations = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`${API_BASE}/harvest-locations`, {
      headers: getAuthHeader()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch locations')
    }
    
    const result = await response.json()
    locations.value = result.data || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch locations'
  } finally {
    loading.value = false
  }
}

// Edit location
const editLocation = (location: HarvestLocation) => {
  editingLocation.value = location
  locationForm.value = {
    name: location.name,
    address: { ...location.address }
  }
  showEditModal.value = true
}

// Delete location
const deleteLocation = async (location: HarvestLocation) => {
  if (!confirm(`Are you sure you want to delete "${location.name}"?`)) return
  
  try {
    const response = await fetch(`${API_BASE}/harvest-locations?id=${location._id || location.id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete location')
    }
    
    await fetchLocations()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete location'
  }
}

// Save location (create or update)
const saveLocation = async () => {
  modalLoading.value = true
  modalError.value = null
  modalSuccess.value = null
  
  try {
    const isEdit = showEditModal.value && editingLocation.value
    const url = isEdit 
      ? `${API_BASE}/harvest-locations?id=${editingLocation.value._id || editingLocation.value.id}`
      : `${API_BASE}/harvest-locations`
    
    const response = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(locationForm.value)
    })
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Failed to save location')
    }
    
    const result = await response.json()
    
    // Check for warning about geocoding failure
    if (result.warning) {
      modalSuccess.value = `Location ${isEdit ? 'updated' : 'created'} successfully. ⚠️ ${result.warning}`
    } else {
      modalSuccess.value = `Location ${isEdit ? 'updated' : 'created'} successfully with coordinates!`
    }
    
    // Refresh locations list
    await fetchLocations()
    
    // Close modal after a moment
    setTimeout(() => {
      closeModal()
    }, 1500)
    
  } catch (err) {
    modalError.value = err instanceof Error ? err.message : 'Failed to save location'
  } finally {
    modalLoading.value = false
  }
}

// Close modal
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  modalError.value = null
  modalSuccess.value = null
  editingLocation.value = null
  locationForm.value = {
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    }
  }
}

onMounted(() => {
  fetchLocations()
})
</script>