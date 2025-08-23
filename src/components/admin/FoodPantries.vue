<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium text-gray-900">Food Pantries</h3>
      <button
        @click="showAddModal = true"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-garden-green-600 hover:bg-garden-green-700"
      >
        <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Pantry
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {{ error }}
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="pantry in foodPantries"
        :key="pantry.id"
        class="bg-white overflow-hidden shadow rounded-lg"
      >
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-medium text-gray-900">{{ pantry.name }}</h4>
            <div class="flex space-x-2">
              <button
                @click="editPantry(pantry)"
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button
                @click="confirmDelete(pantry)"
                class="text-red-400 hover:text-red-600"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="space-y-3">
            <!-- Contact Info -->
            <div v-if="pantry.contact_info">
              <p v-if="pantry.contact_info.phone" class="text-sm text-gray-600 flex items-center">
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                {{ pantry.contact_info.phone }}
              </p>
              <p v-if="pantry.contact_info.email" class="text-sm text-gray-600 flex items-center">
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {{ pantry.contact_info.email }}
              </p>
              <p v-if="pantry.contact_info.address" class="text-sm text-gray-600 flex items-start">
                <svg class="mr-2 h-4 w-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {{ pantry.contact_info.address }}
              </p>
            </div>
            
            <!-- Commitment -->
            <div v-if="pantry.commitment_amounts" class="pt-3 border-t border-gray-200">
              <p class="text-sm font-medium text-gray-700 mb-2">Annual Commitment</p>
              <div class="space-y-1">
                <p class="text-sm text-gray-600">
                  Total: <span class="font-medium text-garden-green-600">${{ pantry.commitment_amounts.total || 0 }}</span>
                </p>
                <div class="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <span>Vegetables: ${{ pantry.commitment_amounts.vegetables || 0 }}</span>
                  <span>Fruits: ${{ pantry.commitment_amounts.fruits || 0 }}</span>
                  <span>Herbs: ${{ pantry.commitment_amounts.herbs || 0 }}</span>
                  <span>Flowers: ${{ pantry.commitment_amounts.flowers || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="foodPantries.length === 0" class="col-span-full">
        <div class="text-center py-12 bg-white rounded-lg shadow">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <p class="mt-2 text-sm text-gray-500">No food pantries found. Add your first pantry to get started.</p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ showEditModal ? 'Edit Food Pantry' : 'Add New Food Pantry' }}
          </h3>
          
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                v-model="formData.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                placeholder="e.g., New Albany Food Pantry"
              />
            </div>
            
            <!-- Contact Information -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900">Contact Information</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    v-model="formData.contact_info.phone"
                    type="tel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                    placeholder="614-555-0101"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    v-model="formData.contact_info.email"
                    type="email"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                    placeholder="contact@pantry.org"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  v-model="formData.contact_info.address"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                  placeholder="123 Main St, City, State ZIP"
                ></textarea>
              </div>
            </div>
            
            <!-- Commitment Amounts -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900">Annual Commitment (Dollar Values)</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Vegetables
                  </label>
                  <input
                    v-model.number="formData.commitment_amounts.vegetables"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Fruits
                  </label>
                  <input
                    v-model.number="formData.commitment_amounts.fruits"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Herbs
                  </label>
                  <input
                    v-model.number="formData.commitment_amounts.herbs"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Flowers
                  </label>
                  <input
                    v-model.number="formData.commitment_amounts.flowers"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Total Commitment
                </label>
                <input
                  v-model.number="formData.commitment_amounts.total"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                  placeholder="Total annual commitment value"
                />
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="px-4 py-2 text-sm font-medium text-white bg-garden-green-600 border border-transparent rounded-md hover:bg-garden-green-700 disabled:opacity-50"
              >
                {{ submitting ? 'Saving...' : (showEditModal ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Delete Food Pantry</h3>
          <p class="text-sm text-gray-500 mb-4">
            Are you sure you want to delete "{{ pantryToDelete?.name }}"? This action cannot be undone.
          </p>
          
          <div class="flex justify-center space-x-3">
            <button
              @click="showDeleteModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="handleDelete"
              :disabled="submitting"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {{ submitting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import type { Database } from '@/lib/supabase'

type FoodPantry = Database['public']['Tables']['food_pantries']['Row']

const adminStore = useAdminStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const submitting = ref(false)
const pantryToEdit = ref<FoodPantry | null>(null)
const pantryToDelete = ref<FoodPantry | null>(null)

const formData = ref({
  name: '',
  contact_info: {
    phone: '',
    email: '',
    address: ''
  },
  commitment_amounts: {
    vegetables: 0,
    fruits: 0,
    herbs: 0,
    flowers: 0,
    total: 0
  }
})

const { foodPantries, loading, error } = adminStore

onMounted(() => {
  adminStore.fetchFoodPantries()
})

const editPantry = (pantry: FoodPantry) => {
  pantryToEdit.value = pantry
  formData.value = {
    name: pantry.name,
    contact_info: {
      phone: pantry.contact_info?.phone || '',
      email: pantry.contact_info?.email || '',
      address: pantry.contact_info?.address || ''
    },
    commitment_amounts: {
      vegetables: pantry.commitment_amounts?.vegetables || 0,
      fruits: pantry.commitment_amounts?.fruits || 0,
      herbs: pantry.commitment_amounts?.herbs || 0,
      flowers: pantry.commitment_amounts?.flowers || 0,
      total: pantry.commitment_amounts?.total || 0
    }
  }
  showEditModal.value = true
}

const confirmDelete = (pantry: FoodPantry) => {
  pantryToDelete.value = pantry
  showDeleteModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const submitData = {
      name: formData.value.name,
      contact_info: formData.value.contact_info,
      commitment_amounts: formData.value.commitment_amounts
    }

    if (showEditModal.value && pantryToEdit.value) {
      await adminStore.updateFoodPantry(pantryToEdit.value.id, submitData)
    } else {
      await adminStore.createFoodPantry(submitData)
    }
    closeModal()
  } catch (err) {
    console.error('Failed to save food pantry:', err)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!pantryToDelete.value) return
  
  submitting.value = true
  try {
    await adminStore.deleteFoodPantry(pantryToDelete.value.id)
    showDeleteModal.value = false
    pantryToDelete.value = null
  } catch (err) {
    console.error('Failed to delete food pantry:', err)
  } finally {
    submitting.value = false
  }
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  pantryToEdit.value = null
  formData.value = {
    name: '',
    contact_info: {
      phone: '',
      email: '',
      address: ''
    },
    commitment_amounts: {
      vegetables: 0,
      fruits: 0,
      herbs: 0,
      flowers: 0,
      total: 0
    }
  }
}
</script>