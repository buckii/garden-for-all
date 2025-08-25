<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium text-gray-900">Produce Types</h3>
      <button
        @click="showAddModal = true"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-garden-green-600 hover:bg-garden-green-700"
      >
        <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Produce Type
      </button>
    </div>

    <!-- Category Filter -->
    <div class="flex space-x-4">
      <button
        @click="selectedCategoryId = null"
        :class="[
          'px-3 py-2 rounded-md text-sm font-medium',
          !selectedCategoryId 
            ? 'bg-garden-green-100 text-garden-green-800' 
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        All Categories
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        @click="selectedCategoryId = category.id"
        :class="[
          'px-3 py-2 rounded-md text-sm font-medium',
          selectedCategoryId === category.id 
            ? 'bg-garden-green-100 text-garden-green-800' 
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        {{ category.name }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {{ error }}
    </div>

    <div v-else class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        <li v-for="produceType in filteredProduceTypes" :key="produceType.id" class="px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center">
                <div class="mr-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-garden-green-100 text-garden-green-800">
                    {{ getCategoryName(produceType.category_id) }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ produceType.name }}</p>
                  <p class="text-sm text-gray-500">
                    Unit: {{ produceType.unit_type }} • 
                    Value: ${{ produceType.conversion_factor }}/{{ produceType.unit_type === 'pounds' ? 'lb' : produceType.unit_type === 'pints' ? 'pt' : 'bunch' }}
                  </p>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="editProduceType(produceType)"
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button
                @click="confirmDelete(produceType)"
                class="text-red-400 hover:text-red-600"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </li>
        <li v-if="filteredProduceTypes.length === 0" class="px-6 py-8 text-center text-gray-500">
          No produce types found. Add your first produce type to get started.
        </li>
      </ul>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ showEditModal ? 'Edit Produce Type' : 'Add New Produce Type' }}
          </h3>
          
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                v-model="formData.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                placeholder="e.g., Tomatoes"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                v-model="formData.category_id"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
              >
                <option value="">Select a category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Unit Type *
              </label>
              <select
                v-model="formData.unit_type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
              >
                <option value="">Select unit type</option>
                <option value="pounds">Pounds</option>
                <option value="pints">Pints</option>
                <option value="bunches">Bunches</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Conversion Factor ($ per unit) *
              </label>
              <input
                v-model.number="formData.conversion_factor"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
                placeholder="e.g., 3.50"
              />
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
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
          <h3 class="text-lg font-medium text-gray-900 mb-2">Delete Produce Type</h3>
          <p class="text-sm text-gray-500 mb-4">
            Are you sure you want to delete "{{ produceTypeToDelete?.name }}"? This action cannot be undone and will also delete all associated harvest entries.
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
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'


type ProduceType = Database['public']['Tables']['produce_types']['Row']

const adminStore = useAdminStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const submitting = ref(false)
const selectedCategoryId = ref<string | null>(null)
const produceTypeToEdit = ref<ProduceType | null>(null)
const produceTypeToDelete = ref<ProduceType | null>(null)

const formData = ref({
  name: '',
  category_id: '',
  unit_type: '',
  conversion_factor: 0
})

const { categories, produceTypes, loading, error } = adminStore

const filteredProduceTypes = computed(() => {
  if (!selectedCategoryId.value) return produceTypes
  return produceTypes.filter(pt => pt.category_id === selectedCategoryId.value)
})

onMounted(async () => {
  await Promise.all([
    adminStore.fetchCategories(),
    adminStore.fetchProduceTypes()
  ])
})

const getCategoryName = (categoryId: string) => {
  const category = categories.find(c => c.id === categoryId)
  return category?.name || 'Unknown'
}

const editProduceType = (produceType: ProduceType) => {
  produceTypeToEdit.value = produceType
  formData.value = {
    name: produceType.name,
    category_id: produceType.category_id,
    unit_type: produceType.unit_type,
    conversion_factor: produceType.conversion_factor
  }
  showEditModal.value = true
}

const confirmDelete = (produceType: ProduceType) => {
  produceTypeToDelete.value = produceType
  showDeleteModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (showEditModal.value && produceTypeToEdit.value) {
      await adminStore.updateProduceType(produceTypeToEdit.value.id, formData.value)
    } else {
      await adminStore.createProduceType(formData.value)
    }
    closeModal()
  } catch (err) {
    console.error('Failed to save produce type:', err)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!produceTypeToDelete.value) return
  
  submitting.value = true
  try {
    await adminStore.deleteProduceType(produceTypeToDelete.value.id)
    showDeleteModal.value = false
    produceTypeToDelete.value = null
  } catch (err) {
    console.error('Failed to delete produce type:', err)
  } finally {
    submitting.value = false
  }
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  produceTypeToEdit.value = null
  formData.value = {
    name: '',
    category_id: '',
    unit_type: '',
    conversion_factor: 0
  }
}
</script>