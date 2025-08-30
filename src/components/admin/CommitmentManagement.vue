<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-4 mx-auto p-6 border max-w-4xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Modal Header -->
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold text-gray-900">
            Commitment Management - {{ pantry?.name }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {{ successMessage }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-6">
          <!-- Year Selection -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-medium text-gray-900">Select Year</h4>
              <select v-model="selectedYear" @change="fetchCommitments" 
                class="border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
          </div>

          <!-- Current Commitment -->
          <div v-if="currentCommitment" class="bg-white border rounded-lg p-6">
            <div class="flex justify-between items-start mb-4">
              <h4 class="text-lg font-medium text-gray-900">{{ selectedYear }} Weekly Commitment</h4>
              <div class="flex space-x-2">
                <button @click="editMode = !editMode" 
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  {{ editMode ? 'Cancel' : 'Edit' }}
                </button>
                <button @click="deleteCommitment" 
                  class="text-red-600 hover:text-red-800 text-sm font-medium">
                  Delete
                </button>
              </div>
            </div>

            <!-- Commitment Form/Display -->
            <div v-if="editMode" class="space-y-4">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Vegetables (lbs/week)</label>
                  <input v-model.number="commitmentForm.weeklyCommitment.vegetables" type="number" min="0" step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Fruits (lbs/week)</label>
                  <input v-model.number="commitmentForm.weeklyCommitment.fruits" type="number" min="0" step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Herbs (lbs/week)</label>
                  <input v-model.number="commitmentForm.weeklyCommitment.herbs" type="number" min="0" step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Flowers (lbs/week)</label>
                  <input v-model.number="commitmentForm.weeklyCommitment.flowers" type="number" min="0" step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Total (lbs/week)</label>
                <input v-model.number="commitmentForm.weeklyCommitment.total" type="number" min="0" step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" />
              </div>
              <div class="flex justify-end space-x-3">
                <button @click="editMode = false" 
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                  Cancel
                </button>
                <button @click="saveCommitment" :disabled="submitting"
                  class="px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700 disabled:opacity-50">
                  {{ submitting ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </div>

            <!-- Commitment Display -->
            <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div class="bg-green-50 p-3 rounded">
                <div class="text-2xl font-bold text-green-600">{{ currentCommitment.weeklyCommitment?.vegetables || 0 }}</div>
                <div class="text-sm text-gray-600">Vegetables/week</div>
              </div>
              <div class="bg-orange-50 p-3 rounded">
                <div class="text-2xl font-bold text-orange-600">{{ currentCommitment.weeklyCommitment?.fruits || 0 }}</div>
                <div class="text-sm text-gray-600">Fruits/week</div>
              </div>
              <div class="bg-purple-50 p-3 rounded">
                <div class="text-2xl font-bold text-purple-600">{{ currentCommitment.weeklyCommitment?.herbs || 0 }}</div>
                <div class="text-sm text-gray-600">Herbs/week</div>
              </div>
              <div class="bg-pink-50 p-3 rounded">
                <div class="text-2xl font-bold text-pink-600">{{ currentCommitment.weeklyCommitment?.flowers || 0 }}</div>
                <div class="text-sm text-gray-600">Flowers/week</div>
              </div>
            </div>
          </div>

          <!-- Create New Commitment -->
          <div v-else class="bg-gray-50 border rounded-lg p-6">
            <h4 class="text-lg font-medium text-gray-900 mb-4">Create {{ selectedYear }} Weekly Commitment</h4>
            <div class="space-y-4">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Vegetables (lbs/week)</label>
                  <input v-model.number="commitmentForm.weeklyCommitment.vegetables" type="number" min="0" step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Fruits (lbs/week)</label>
                  <input v-model.number="commitmentForm.weeklyCommitment.fruits" type="number" min="0" step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Herbs (lbs/week)</label>
                  <input v-model.number="commitmentForm.weeklyCommitment.herbs" type="number" min="0" step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Flowers (lbs/week)</label>
                  <input v-model.number="commitmentForm.weeklyCommitment.flowers" type="number" min="0" step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Total (lbs/week)</label>
                <input v-model.number="commitmentForm.weeklyCommitment.total" type="number" min="0" step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" />
              </div>
              <div class="flex justify-end">
                <button @click="createCommitment" :disabled="submitting"
                  class="px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700 disabled:opacity-50">
                  {{ submitting ? 'Creating...' : 'Create Commitment' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Progress Dashboard -->
          <div v-if="currentCommitment && progress" class="bg-white border rounded-lg p-6">
            <h4 class="text-lg font-medium text-gray-900 mb-4">Year-to-Date Progress ({{ progress.weeksElapsed }} weeks)</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div v-for="(category, key) in progressCategories" :key="key" class="bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-gray-700 capitalize">{{ key }}</span>
                  <span :class="getProgressColor(category.percentage)" class="text-sm font-bold">
                    {{ category.percentage.toFixed(0) }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div :class="getProgressColor(category.percentage, true)" 
                       class="h-2 rounded-full transition-all duration-500"
                       :style="{ width: Math.min(category.percentage, 100) + '%' }"></div>
                </div>
                <div class="text-xs text-gray-600">
                  {{ category.actual.toFixed(1) }} / {{ category.target.toFixed(1) }} lbs
                </div>
              </div>
            </div>

            <!-- Detailed Progress Table -->
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Target</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YTD Target</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual YTD</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(category, key) in progressCategories" :key="key">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{{ key }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ category.weekly.toFixed(1) }} lbs</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ category.target.toFixed(1) }} lbs</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ category.actual.toFixed(1) }} lbs</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span :class="category.variance >= 0 ? 'text-green-600' : 'text-red-600'" class="font-medium">
                        {{ (category.variance >= 0 ? '+' : '') }}{{ category.variance.toFixed(1) }} lbs
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  show: boolean
  pantry: any
}

interface Emits {
  (e: 'close'): void
  (e: 'updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref('')
const submitting = ref(false)
const editMode = ref(false)
const selectedYear = ref(new Date().getFullYear())
const currentCommitment = ref<any>(null)
const progress = ref<any>(null)

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/.netlify/functions'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1]
})

const commitmentForm = ref({
  pantryId: '',
  year: selectedYear.value,
  weeklyCommitment: {
    vegetables: 0,
    fruits: 0,
    herbs: 0,
    flowers: 0,
    total: 0
  }
})

const progressCategories = computed(() => {
  if (!currentCommitment.value || !progress.value) return {}
  
  const categories = ['vegetables', 'fruits', 'herbs', 'flowers', 'total']
  const result: any = {}
  
  categories.forEach(category => {
    const weekly = currentCommitment.value.weeklyCommitment?.[category] || 0
    const target = weekly * progress.value.weeksElapsed
    const actual = progress.value.actualDeliveries?.[category] || 0
    const variance = actual - target
    const percentage = target > 0 ? (actual / target) * 100 : 0
    
    result[category] = {
      weekly,
      target,
      actual,
      variance,
      percentage
    }
  })
  
  return result
})

// Watch for pantry changes
watch(() => props.pantry, (newPantry) => {
  if (newPantry && props.show) {
    commitmentForm.value.pantryId = newPantry.id || newPantry._id
    fetchCommitments()
  }
})

// Watch for show changes
watch(() => props.show, (show) => {
  if (show && props.pantry) {
    commitmentForm.value.pantryId = props.pantry.id || props.pantry._id
    fetchCommitments()
  }
})

const fetchCommitments = async () => {
  if (!props.pantry) return
  
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`${API_BASE}/pantry-commitments?pantryId=${props.pantry.id || props.pantry._id}&year=${selectedYear.value}&includeProgress=true`, {
      headers: getAuthHeader()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch commitments')
    }
    
    const result = await response.json()
    const commitments = result.data || []
    
    if (commitments.length > 0) {
      currentCommitment.value = commitments[0]
      progress.value = commitments[0].progress
      
      // Update form with current values
      commitmentForm.value = {
        pantryId: props.pantry.id || props.pantry._id,
        year: selectedYear.value,
        weeklyCommitment: { ...currentCommitment.value.weeklyCommitment }
      }
    } else {
      currentCommitment.value = null
      progress.value = null
      resetForm()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch commitments'
  } finally {
    loading.value = false
  }
}

const createCommitment = async () => {
  submitting.value = true
  error.value = null
  
  try {
    const response = await fetch(`${API_BASE}/pantry-commitments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(commitmentForm.value)
    })
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Failed to create commitment')
    }
    
    successMessage.value = 'Commitment created successfully!'
    await fetchCommitments()
    emit('updated')
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create commitment'
  } finally {
    submitting.value = false
  }
}

const saveCommitment = async () => {
  if (!currentCommitment.value) return
  
  submitting.value = true
  error.value = null
  
  try {
    const response = await fetch(`${API_BASE}/pantry-commitments?id=${currentCommitment.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(commitmentForm.value)
    })
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Failed to update commitment')
    }
    
    successMessage.value = 'Commitment updated successfully!'
    editMode.value = false
    await fetchCommitments()
    emit('updated')
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update commitment'
  } finally {
    submitting.value = false
  }
}

const deleteCommitment = async () => {
  if (!currentCommitment.value || !confirm('Are you sure you want to delete this commitment?')) return
  
  submitting.value = true
  error.value = null
  
  try {
    const response = await fetch(`${API_BASE}/pantry-commitments?id=${currentCommitment.value._id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    })
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Failed to delete commitment')
    }
    
    successMessage.value = 'Commitment deleted successfully!'
    await fetchCommitments()
    emit('updated')
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete commitment'
  } finally {
    submitting.value = false
  }
}

const getProgressColor = (percentage: number, isBackground = false) => {
  const baseClass = isBackground ? 'bg-' : 'text-'
  if (percentage >= 100) return `${baseClass}green-500`
  if (percentage >= 75) return `${baseClass}green-400`
  if (percentage >= 50) return `${baseClass}yellow-500`
  if (percentage >= 25) return `${baseClass}orange-500`
  return `${baseClass}red-500`
}

const resetForm = () => {
  commitmentForm.value = {
    pantryId: props.pantry?.id || props.pantry?._id || '',
    year: selectedYear.value,
    weeklyCommitment: {
      vegetables: 0,
      fruits: 0,
      herbs: 0,
      flowers: 0,
      total: 0
    }
  }
}

const closeModal = () => {
  editMode.value = false
  error.value = null
  successMessage.value = ''
  emit('close')
}
</script>