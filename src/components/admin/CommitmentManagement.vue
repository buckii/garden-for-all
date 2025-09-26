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

        <!-- Error State -->
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {{ successMessage }}
        </div>

        <!-- Content -->
        <div class="space-y-6">
          <!-- Date Range Filter -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-medium text-gray-900">View Commitments</h4>
              <div class="flex space-x-2">
                <input v-model="filterStartDate" type="date" placeholder="Start date"
                  class="border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <input v-model="filterEndDate" type="date" placeholder="End date"
                  class="border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <button @click="fetchCommitments" 
                  class="px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700">
                  Filter
                </button>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center py-6">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
          </div>

          <!-- Existing Commitments List -->
          <div v-if="commitments.length > 0" class="space-y-2">
            <h4 class="text-lg font-medium text-gray-900 mb-3">Weekly Commitments ({{ commitments.length }})</h4>
            
            <!-- Table Header -->
            <div class="bg-gray-50 rounded-lg">
              <div class="grid grid-cols-12 gap-2 px-4 py-3 text-sm font-medium text-gray-900">
                <div class="col-span-2">Week Of</div>
                <div class="col-span-4">Product/Category</div>
                <div class="col-span-2">Weight</div>
                <div class="col-span-3">Notes</div>
                <div class="col-span-1">Actions</div>
              </div>
            </div>
            
            <!-- Commitment Rows -->
            <div v-for="commitment in commitments" :key="commitment._id" class="bg-white border rounded-lg">
              <div class="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-gray-50">
                <div class="col-span-2 text-gray-600">
                  {{ formatDateCompact(commitment.weekStartDate) }}
                </div>
                <div class="col-span-4">
                  <span v-if="commitment.commitmentType === 'total'" class="font-medium text-gray-900">Total Weight</span>
                  <span v-else-if="commitment.commitmentType === 'category'" class="font-medium text-blue-600">{{ getCategoryName(commitment.categoryId) }}</span>
                  <span v-else-if="commitment.commitmentType === 'produce_type'" class="font-medium text-green-600">{{ getProduceTypeName(commitment.produceTypeId) }}</span>
                </div>
                <div class="col-span-2">
                  <span class="font-semibold text-garden-green-600">{{ commitment.weeklyWeightLbs }} lbs</span>
                </div>
                <div class="col-span-3">
                  <span v-if="commitment.notes" class="text-gray-600 text-xs">{{ commitment.notes }}</span>
                  <span v-else class="text-gray-400 text-xs">-</span>
                </div>
                <div class="col-span-1">
                  <div class="flex space-x-1">
                    <button @click="editCommitment(commitment)" 
                      class="text-blue-600 hover:text-blue-800 text-xs font-medium p-1">
                      Edit
                    </button>
                    <button @click="deleteCommitment(commitment)" 
                      class="text-red-600 hover:text-red-800 text-xs font-medium p-1">
                      Del
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Create/Edit Commitment Form -->
          <div class="bg-gray-50 border rounded-lg p-6">
            <h4 class="text-lg font-medium text-gray-900 mb-4">
              {{ editingCommitment ? 'Edit' : 'Create New' }} Weekly Commitment
            </h4>
            
            <!-- Commitment Type Radio Buttons -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-3">Commitment Type</label>
              <div class="space-y-3">
                <label class="flex items-start space-x-3">
                  <input v-model="commitmentForm.commitmentType" type="radio" value="total" 
                    class="mt-1 h-4 w-4 text-garden-green-600 focus:ring-garden-green-500 border-gray-300">
                  <div>
                    <div class="text-sm font-medium text-gray-900">Total Weight</div>
                    <div class="text-sm text-gray-500">Commit to a total weight regardless of specific products</div>
                  </div>
                </label>
                <label class="flex items-start space-x-3">
                  <input v-model="commitmentForm.commitmentType" type="radio" value="category" 
                    class="mt-1 h-4 w-4 text-garden-green-600 focus:ring-garden-green-500 border-gray-300">
                  <div>
                    <div class="text-sm font-medium text-gray-900">By Category</div>
                    <div class="text-sm text-gray-500">Commit to a specific category (Vegetables, Fruits, Herbs, etc.)</div>
                  </div>
                </label>
                <label class="flex items-start space-x-3">
                  <input v-model="commitmentForm.commitmentType" type="radio" value="produce_type" 
                    class="mt-1 h-4 w-4 text-garden-green-600 focus:ring-garden-green-500 border-gray-300">
                  <div>
                    <div class="text-sm font-medium text-gray-900">Specific Product</div>
                    <div class="text-sm text-gray-500">Commit to a specific produce type (Tomatoes, Lettuce, etc.)</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Category Selection (shown when category is selected) -->
            <div v-if="commitmentForm.commitmentType === 'category'" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
              <select v-model="commitmentForm.categoryId" required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="">Choose a category...</option>
                <option v-for="category in categories" :key="category._id" :value="category._id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <!-- Produce Type Selection (shown when produce_type is selected) -->
            <div v-if="commitmentForm.commitmentType === 'produce_type'" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
              <select v-model="commitmentForm.produceTypeId" required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="">Choose a product...</option>
                <option v-for="product in produceTypes" :key="product._id" :value="product._id">
                  {{ product.name }} ({{ product.unitType }})
                </option>
              </select>
            </div>

            <!-- Weight Input -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Weekly Weight (lbs)</label>
              <input v-model.number="commitmentForm.weeklyWeightLbs" type="number" min="0" step="0.1" required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500" 
                placeholder="Enter weekly weight in pounds">
            </div>

            <!-- Date Range -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-3">Commitment Period</label>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Start Date (auto-adjusts to Monday)</label>
                  <input v-model="commitmentForm.startDate" type="date" required
                    @change="validateMonday('startDate')"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500">
                  <div v-if="dateValidation.startDate" class="text-xs text-red-500 mt-1">{{ dateValidation.startDate }}</div>
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">End Date (auto-adjusts to Monday)</label>
                  <input v-model="commitmentForm.endDate" type="date" required
                    @change="validateMonday('endDate')"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500">
                  <div v-if="dateValidation.endDate" class="text-xs text-red-500 mt-1">{{ dateValidation.endDate }}</div>
                </div>
              </div>
              <div v-if="weekCount > 0" class="text-xs text-gray-500 mt-2">
                This will create {{ weekCount }} weekly commitment{{ weekCount !== 1 ? 's' : '' }} 
                ({{ (commitmentForm.weeklyWeightLbs * weekCount).toFixed(1) }} lbs total)
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea v-model="commitmentForm.notes" rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-garden-green-500 focus:border-garden-green-500"
                placeholder="Additional notes about this commitment..."></textarea>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3">
              <button v-if="editingCommitment" @click="cancelEdit" 
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button @click="saveCommitment" :disabled="submitting || !isFormValid"
                class="px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ submitting ? 'Saving...' : (editingCommitment ? 'Update' : 'Create') }} Commitment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

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
// Initialize filter dates from localStorage or default to current calendar year
const getCurrentYear = () => new Date().getFullYear()
const getStoredDateRange = () => {
  const stored = localStorage.getItem('commitmentDateRange')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.warn('Invalid stored date range, using defaults')
    }
  }
  return {
    startDate: `${getCurrentYear()}-01-01`,
    endDate: `${getCurrentYear()}-12-31`
  }
}

const storedRange = getStoredDateRange()
const filterStartDate = ref(storedRange.startDate)
const filterEndDate = ref(storedRange.endDate)

// Helper to get stored commitment form data
const getStoredCommitmentData = () => {
  const stored = localStorage.getItem('commitmentFormData')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.warn('Invalid stored commitment form data, using defaults')
    }
  }
  return {
    startDate: '',
    endDate: '',
    commitmentType: 'total'
  }
}
const commitments = ref<any[]>([])
const categories = ref<any[]>([])
const produceTypes = ref<any[]>([])
const editingCommitment = ref<any>(null)

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/.netlify/functions'

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}


const storedCommitmentData = getStoredCommitmentData()
const commitmentForm = ref({
  pantryId: props.pantry?.id || props.pantry?._id || '',
  commitmentType: storedCommitmentData.commitmentType,
  produceTypeId: '',
  categoryId: '',
  weeklyWeightLbs: 0,
  startDate: storedCommitmentData.startDate,
  endDate: storedCommitmentData.endDate,
  notes: ''
})

const dateValidation = ref({
  startDate: '',
  endDate: ''
})

const weekCount = computed(() => {
  if (!commitmentForm.value.startDate || !commitmentForm.value.endDate) {
    return 0
  }
  
  const start = new Date(commitmentForm.value.startDate)
  const end = new Date(commitmentForm.value.endDate)
  
  if (start > end) {
    return 0
  }
  
  // Calculate number of weeks (including start and end weeks)
  const diffTime = Math.abs(end - start)
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1
  return diffWeeks
})

const isFormValid = computed(() => {
  if (!commitmentForm.value.commitmentType || !commitmentForm.value.weeklyWeightLbs || commitmentForm.value.weeklyWeightLbs <= 0) {
    return false
  }
  
  if (!commitmentForm.value.startDate || !commitmentForm.value.endDate) {
    return false
  }
  
  if (commitmentForm.value.commitmentType === 'category' && !commitmentForm.value.categoryId) {
    return false
  }
  
  if (commitmentForm.value.commitmentType === 'produce_type' && !commitmentForm.value.produceTypeId) {
    return false
  }
  
  // Dates are auto-corrected to Mondays, so no need to check validation errors
  
  return new Date(commitmentForm.value.startDate) <= new Date(commitmentForm.value.endDate)
})

// Watch for pantry changes
watch(() => props.pantry, (newPantry) => {
  if (newPantry && props.show) {
    const pantryId = newPantry.id || newPantry._id
    commitmentForm.value.pantryId = pantryId
    fetchCommitments()
  }
})

// Watch for show changes
watch(() => props.show, (show) => {
  if (show && props.pantry) {
    const pantryId = props.pantry.id || props.pantry._id
    commitmentForm.value.pantryId = pantryId
    fetchCommitments()
    fetchReferenceData()
  }
})

// Watch date range changes and save to localStorage
watch([filterStartDate, filterEndDate], ([startDate, endDate]) => {
  if (startDate && endDate) {
    localStorage.setItem('commitmentDateRange', JSON.stringify({
      startDate,
      endDate
    }))
  }
})

// Watch commitment form changes and save to localStorage
watch(() => [commitmentForm.value.startDate, commitmentForm.value.endDate, commitmentForm.value.commitmentType], ([startDate, endDate, commitmentType]) => {
  localStorage.setItem('commitmentFormData', JSON.stringify({
    startDate: startDate || '',
    endDate: endDate || '',
    commitmentType: commitmentType || 'total'
  }))
})

const fetchReferenceData = async () => {
  try {
    // Fetch categories and produce types from dedicated endpoints
    const [categoriesResponse, produceTypesResponse] = await Promise.all([
      fetch(`${API_BASE}/produce-categories`, { headers: getAuthHeader() }),
      fetch(`${API_BASE}/produce-types`, { headers: getAuthHeader() })
    ])

    if (categoriesResponse.ok) {
      const categoriesResult = await categoriesResponse.json()
      categories.value = categoriesResult.data || []
    }

    if (produceTypesResponse.ok) {
      const produceTypesResult = await produceTypesResponse.json()
      produceTypes.value = produceTypesResult.data || []
    }
  } catch (err) {
    console.error('Failed to fetch reference data:', err)
    // Fallback to basic categories if API fails
    categories.value = [
      { _id: 'vegetables', name: 'Vegetables' },
      { _id: 'fruits', name: 'Fruits' },
      { _id: 'herbs', name: 'Herbs' },
      { _id: 'greens', name: 'Greens' },
      { _id: 'flowers', name: 'Flowers' }
    ]
  }
}

const fetchCommitments = async () => {
  if (!props.pantry) return
  
  loading.value = true
  error.value = null
  
  try {
    // Build query parameters
    const pantryParam = props.pantry.id || props.pantry._id
    const params = new URLSearchParams({ pantryId: pantryParam })
    
    if (filterStartDate.value) {
      params.append('startDate', filterStartDate.value)
    }
    if (filterEndDate.value) {
      params.append('endDate', filterEndDate.value)
    }
    
    const response = await fetch(`${API_BASE}/commitments?${params}`, {
      headers: getAuthHeader()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch commitments')
    }
    
    const result = await response.json()
    commitments.value = result.data || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch commitments'
  } finally {
    loading.value = false
  }
}

const validateMonday = (field: 'startDate' | 'endDate') => {
  const dateValue = commitmentForm.value[field]
  if (!dateValue) {
    dateValidation.value[field] = ''
    return
  }
  
  // Parse date as local timezone to avoid timezone shifts
  // dateValue format is YYYY-MM-DD from HTML date input
  const [year, month, day] = dateValue.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month is 0-indexed
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  if (dayOfWeek !== 1) {
    // Calculate days to subtract to get to Monday of the same week
    // Sunday = 0, Monday = 1, Tuesday = 2, etc.
    // If Sunday (0), we need to go back 6 days to get to Monday
    // If Tuesday (2), we need to go back 1 day to get to Monday
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    
    // Create the Monday date
    const mondayDate = new Date(year, month - 1, day - daysToSubtract)
    
    // Format as YYYY-MM-DD for the input
    const mondayString = mondayDate.toISOString().split('T')[0]
    
    // Update the form field
    commitmentForm.value[field] = mondayString
  }
  
  // Clear any validation errors since we auto-correct
  dateValidation.value[field] = ''
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateCompact = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric'
  })
}

const editCommitment = (commitment: any) => {
  editingCommitment.value = commitment
  const weekStartDate = new Date(commitment.weekStartDate).toISOString().split('T')[0]
  
  // Handle populated objects or IDs for produceTypeId and categoryId
  const produceTypeId = commitment.produceTypeId?._id || commitment.produceTypeId || ''
  const categoryId = commitment.categoryId?._id || commitment.categoryId || ''
  
  commitmentForm.value = {
    pantryId: props.pantry.id || props.pantry._id,
    commitmentType: commitment.commitmentType,
    produceTypeId,
    categoryId,
    weeklyWeightLbs: commitment.weeklyWeightLbs,
    startDate: weekStartDate,
    endDate: weekStartDate, // For editing, we'll just edit the single week
    notes: commitment.notes || ''
  }
}

const cancelEdit = () => {
  editingCommitment.value = null
  resetForm()
}

const saveCommitment = async () => {
  if (!isFormValid.value) return
  
  submitting.value = true
  error.value = null
  
  try {
    const method = editingCommitment.value ? 'PUT' : 'POST'
    const url = editingCommitment.value 
      ? `${API_BASE}/commitments?id=${editingCommitment.value._id}`
      : `${API_BASE}/commitments`
    
    // Clean form data based on commitment type
    const formData: any = { ...commitmentForm.value }
    if (formData.commitmentType !== 'category') {
      delete formData.categoryId
    }
    if (formData.commitmentType !== 'produce_type') {
      delete formData.produceTypeId
    }
    
    // For editing, the API expects weekStartDate field, not startDate
    if (editingCommitment.value) {
      formData.weekStartDate = formData.startDate
      delete formData.startDate
      delete formData.endDate
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(formData)
    })
    
    if (!response.ok) {
      const errorResult = await response.json()
      throw new Error(errorResult.error || 'Failed to save commitment')
    }
    
    const result = await response.json()
    
    if (editingCommitment.value) {
      successMessage.value = 'Commitment updated successfully!'
    } else {
      const count = result.data?.length || 1
      successMessage.value = `${count} weekly commitment${count !== 1 ? 's' : ''} created successfully!`
    }
    editingCommitment.value = null
    resetForm()
    await fetchCommitments()
    emit('updated')
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save commitment'
  } finally {
    submitting.value = false
  }
}

const deleteCommitment = async (commitment: any) => {
  if (!confirm('Are you sure you want to delete this commitment?')) return
  
  submitting.value = true
  error.value = null
  
  try {
    const response = await fetch(`${API_BASE}/commitments?id=${commitment._id}`, {
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

const getCategoryName = (categoryId: any) => {
  // Handle populated object from API
  if (categoryId && typeof categoryId === 'object' && categoryId.name) {
    return categoryId.name
  }
  // Handle string ID (fallback for non-populated data)
  if (typeof categoryId === 'string') {
    const category = categories.value.find(c => c._id === categoryId)
    return category ? category.name : 'Unknown Category'
  }
  return 'Unknown Category'
}

const getProduceTypeName = (produceTypeId: any) => {
  // Handle populated object from API
  if (produceTypeId && typeof produceTypeId === 'object' && produceTypeId.name) {
    return produceTypeId.name
  }
  // Handle string ID (fallback for non-populated data)
  if (typeof produceTypeId === 'string') {
    const produceType = produceTypes.value.find(p => p._id === produceTypeId)
    return produceType ? produceType.name : 'Unknown Product'
  }
  return 'Unknown Product'
}

const resetForm = () => {
  const storedCommitmentData = getStoredCommitmentData()
  commitmentForm.value = {
    pantryId: props.pantry?.id || props.pantry?._id || '',
    commitmentType: storedCommitmentData.commitmentType,
    produceTypeId: '',
    categoryId: '',
    weeklyWeightLbs: 0,
    startDate: storedCommitmentData.startDate,
    endDate: storedCommitmentData.endDate,
    notes: ''
  }
  dateValidation.value = {
    startDate: '',
    endDate: ''
  }
}

const closeModal = () => {
  editingCommitment.value = null
  error.value = null
  successMessage.value = ''
  resetForm()
  emit('close')
}

// Initialize reference data when component mounts
onMounted(() => {
  if (props.show) {
    fetchReferenceData()
  }
})
</script>