<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {{ error }}
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
        {{ successMessage }}
      </div>

      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Plans</h1>
        <p class="text-gray-600 text-sm mt-1">Manage daily produce delivery plans for food pantries</p>
      </div>

      <!-- Filters and Actions -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div class="flex flex-col sm:flex-row gap-4">
            <!-- Pantry Filter -->
            <select v-model="selectedPantryId" @change="fetchCommitments"
              class="border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              <option value="">All Pantries</option>
              <option v-for="pantry in pantries" :key="pantry._id" :value="pantry._id">
                {{ pantry.name }}
              </option>
            </select>

            <!-- Date Range Filter -->
            <input v-model="filterStartDate" type="date" placeholder="Start date"
              class="border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            <input v-model="filterEndDate" type="date" placeholder="End date"
              class="border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            <button @click="fetchCommitments" 
              class="px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700">
              Filter
            </button>
          </div>

          <button @click="showCreateForm = !showCreateForm"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {{ showCreateForm ? 'Cancel' : 'New Plan' }}
          </button>
        </div>
      </div>

      <!-- Create Plan Form -->
      <div v-if="showCreateForm" class="bg-white border rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Plan</h3>

        <form @submit.prevent="createCommitment" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Pantry Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Food Pantry</label>
              <select v-model="commitmentForm.pantryId" required
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="">Select a pantry</option>
                <option v-for="pantry in pantries" :key="pantry._id" :value="pantry._id">
                  {{ pantry.name }}
                </option>
              </select>
            </div>

            <!-- Daily Weight -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Daily Weight (lbs per day)</label>
              <input v-model.number="commitmentForm.dailyWeightLbs" type="number" step="0.01" min="0" required
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Start Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Week Start Date</label>
              <input v-model="commitmentForm.startDate" type="date" required
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>

            <!-- End Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input v-model="commitmentForm.endDate" type="date" required
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>
          </div>

          <!-- Days of Week -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Delivery Days</label>
            <div class="flex flex-wrap gap-3">
              <label v-for="(day, index) in dayOptions" :key="index" class="flex items-center">
                <input type="checkbox" :value="index" v-model="commitmentForm.daysOfWeek"
                  class="rounded border-gray-300 text-garden-green-600 focus:ring-garden-green-500 mr-2">
                <span class="text-sm">{{ day }}</span>
              </label>
            </div>
            <p class="text-xs text-gray-500 mt-1">Select at least one day</p>
          </div>

          <!-- Frequency -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Every</span>
              <input v-model.number="commitmentForm.frequencyWeeks" type="number" min="1" required
                class="w-20 border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              <span class="text-sm text-gray-600">week(s)</span>
            </div>
          </div>

          <!-- Plan Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input v-model="commitmentForm.commitmentType" type="radio" value="total"
                  class="text-garden-green-600 focus:ring-garden-green-500">
                <span class="ml-2">Any Produce</span>
              </label>
              <label class="flex items-center">
                <input v-model="commitmentForm.commitmentType" type="radio" value="category"
                  class="text-garden-green-600 focus:ring-garden-green-500">
                <span class="ml-2">Specific Category</span>
              </label>
              <label class="flex items-center">
                <input v-model="commitmentForm.commitmentType" type="radio" value="produce_type"
                  class="text-garden-green-600 focus:ring-garden-green-500">
                <span class="ml-2">Specific Product</span>
              </label>
            </div>
          </div>

          <!-- Firm Commitment Checkbox -->
          <div class="flex items-center">
            <input type="checkbox" v-model="commitmentForm.isFirm" id="isFirm"
              class="rounded border-gray-300 text-garden-green-600 focus:ring-garden-green-500">
            <label for="isFirm" class="ml-2 text-sm font-medium text-gray-700">
              This is a firm/committed plan
            </label>
          </div>

          <!-- Category Selection -->
          <div v-if="commitmentForm.commitmentType === 'category'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
            <select v-model="commitmentForm.categoryId" required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              <option value="">Select a category</option>
              <option v-for="category in categories" :key="category._id" :value="category._id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- Product Selection -->
          <div v-if="commitmentForm.commitmentType === 'produce_type'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
            <select v-model="commitmentForm.produceTypeId" required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              <option value="">Select a product</option>
              <option v-for="product in produceTypes" :key="product._id" :value="product._id">
                {{ product.name }}
              </option>
            </select>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea v-model="commitmentForm.notes" rows="3"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500"></textarea>
          </div>

          <div class="flex justify-end space-x-4">
            <button type="button" @click="showCreateForm = false"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="!isFormValid || formSubmitting"
              class="px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700 disabled:opacity-50">
              {{ formSubmitting ? 'Creating...' : 'Create Plan' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-6">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
      </div>

      <!-- Plans List -->
      <div v-else-if="commitments.length > 0" class="bg-white border rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">
            Delivery Plans ({{ commitments.length }})
          </h3>
          <div v-if="selectedCommitments.length > 0" class="flex items-center space-x-3">
            <span class="text-sm text-gray-600">{{ selectedCommitments.length }} selected</span>
            <button @click="bulkDelete"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
              Delete Selected
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left">
                  <input type="checkbox" :checked="allSelected" @change="toggleSelectAll"
                    class="rounded border-gray-300 text-garden-green-600 focus:ring-garden-green-500">
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pantry</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product/Category</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Daily (lbs)</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Firm</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="commitment in commitments" :key="commitment._id" class="hover:bg-gray-50">
                <td class="px-4 py-2">
                  <input type="checkbox" :value="commitment._id" v-model="selectedCommitments"
                    class="rounded border-gray-300 text-garden-green-600 focus:ring-garden-green-500">
                </td>
                <td class="px-4 py-2 text-sm">{{ formatDate(commitment.weekStartDate) }}</td>
                <td class="px-4 py-2 text-sm">{{ commitment.pantryId?.name || 'Unknown' }}</td>
                <td class="px-4 py-2 text-sm">
                  <span v-if="commitment.daysOfWeek">{{ formatDaysOfWeek(commitment.daysOfWeek) }}</span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-4 py-2 text-sm">
                  Every {{ commitment.frequencyWeeks || 1 }} week{{ (commitment.frequencyWeeks || 1) > 1 ? 's' : '' }}
                </td>
                <td class="px-4 py-2 text-sm">
                  <span class="capitalize">{{ commitment.commitmentType.replace('_', ' ') }}</span>
                </td>
                <td class="px-4 py-2 text-sm">
                  <span v-if="commitment.commitmentType === 'total'" class="text-gray-500">Any produce</span>
                  <span v-else-if="commitment.commitmentType === 'category'">
                    {{ commitment.categoryId?.name || 'Unknown Category' }}
                  </span>
                  <span v-else-if="commitment.commitmentType === 'produce_type'">
                    {{ commitment.produceTypeId?.name || 'Unknown Product' }}
                  </span>
                </td>
                <td class="px-4 py-2 text-sm font-medium">{{ commitment.dailyWeightLbs || commitment.weeklyWeightLbs || 0 }}</td>
                <td class="px-4 py-2 text-sm">
                  <span v-if="commitment.isFirm" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Yes
                  </span>
                  <span v-else class="text-gray-400">No</span>
                </td>
                <td class="px-4 py-2 text-sm">
                  <div class="flex items-center space-x-2">
                    <button @click="editCommitment(commitment)"
                      class="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="duplicateCommitment(commitment)"
                      class="text-green-600 hover:text-green-900 p-1"
                      title="Duplicate">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button @click="deleteCommitment(commitment._id)"
                      class="text-red-600 hover:text-red-900 p-1"
                      title="Delete">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="!loading" class="bg-white border rounded-lg p-6 text-center">
        <p class="text-gray-500">
          {{ selectedPantryId ? 'No plans found for the selected pantry and date range.' : 'No plans found for the selected date range.' }}
        </p>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-4 mx-auto p-6 border max-w-2xl shadow-lg rounded-md bg-white my-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-900">Edit Plan</h3>
          <button @click="showEditModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="updateCommitment" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Week Start Date</label>
              <input v-model="editForm.weekStartDate" type="date" required
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input v-model="editForm.endDate" type="date" required
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Daily Weight (lbs per day)</label>
            <input v-model.number="editForm.dailyWeightLbs" type="number" step="0.01" min="0" required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
          </div>

          <!-- Days of Week -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Delivery Days</label>
            <div class="flex flex-wrap gap-3">
              <label v-for="(day, index) in dayOptions" :key="index" class="flex items-center">
                <input type="checkbox" :value="index" v-model="editForm.daysOfWeek"
                  class="rounded border-gray-300 text-garden-green-600 focus:ring-garden-green-500 mr-2">
                <span class="text-sm">{{ day }}</span>
              </label>
            </div>
          </div>

          <!-- Frequency -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Every</span>
              <input v-model.number="editForm.frequencyWeeks" type="number" min="1" required
                class="w-20 border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              <span class="text-sm text-gray-600">week(s)</span>
            </div>
          </div>

          <!-- Plan Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input v-model="editForm.commitmentType" type="radio" value="total"
                  class="text-garden-green-600 focus:ring-garden-green-500">
                <span class="ml-2">Any Produce</span>
              </label>
              <label class="flex items-center">
                <input v-model="editForm.commitmentType" type="radio" value="category"
                  class="text-garden-green-600 focus:ring-garden-green-500">
                <span class="ml-2">Specific Category</span>
              </label>
              <label class="flex items-center">
                <input v-model="editForm.commitmentType" type="radio" value="produce_type"
                  class="text-garden-green-600 focus:ring-garden-green-500">
                <span class="ml-2">Specific Product</span>
              </label>
            </div>
          </div>

          <!-- Category Selection -->
          <div v-if="editForm.commitmentType === 'category'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
            <select v-model="editForm.categoryId" required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              <option value="">Select a category</option>
              <option v-for="category in categories" :key="category._id" :value="category._id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- Product Selection -->
          <div v-if="editForm.commitmentType === 'produce_type'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
            <select v-model="editForm.produceTypeId" required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              <option value="">Select a product</option>
              <option v-for="product in produceTypes" :key="product._id" :value="product._id">
                {{ product.name }}
              </option>
            </select>
          </div>

          <!-- Firm Commitment Checkbox -->
          <div class="flex items-center">
            <input type="checkbox" v-model="editForm.isFirm" id="editIsFirm"
              class="rounded border-gray-300 text-garden-green-600 focus:ring-garden-green-500">
            <label for="editIsFirm" class="ml-2 text-sm font-medium text-gray-700">
              This is a firm/committed plan
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea v-model="editForm.notes" rows="3"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-garden-green-500 focus:border-garden-green-500"></textarea>
          </div>

          <div class="flex justify-end space-x-4">
            <button type="button" @click="showEditModal = false"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="formSubmitting"
              class="px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700 disabled:opacity-50">
              {{ formSubmitting ? 'Updating...' : 'Update Plan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'

interface Pantry {
  _id: string
  name: string
  county: string
}

interface Category {
  _id: string
  name: string
}

interface ProduceType {
  _id: string
  name: string
  categoryId: string
}

interface Commitment {
  _id: string
  pantryId: Pantry
  weekStartDate: string
  endDate?: string
  daysOfWeek?: number[]
  frequencyWeeks?: number
  commitmentType: 'total' | 'category' | 'produce_type'
  categoryId?: Category
  produceTypeId?: ProduceType
  dailyWeightLbs?: number
  weeklyWeightLbs: number
  isFirm?: boolean
  notes?: string
  isActive: boolean
}

const route = useRoute()
const router = useRouter()

// Data
const commitments = ref<Commitment[]>([])
const pantries = ref<Pantry[]>([])
const categories = ref<Category[]>([])
const produceTypes = ref<ProduceType[]>([])
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const formSubmitting = ref(false)

// Form states
const showCreateForm = ref(false)
const showEditModal = ref(false)

// Filters
const selectedPantryId = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')

// Bulk delete
const selectedCommitments = ref<string[]>([])

// Computed
const allSelected = computed(() => {
  return commitments.value.length > 0 && selectedCommitments.value.length === commitments.value.length
})

// Day options for checkboxes (0 = Sunday, 1 = Monday, etc.)
const dayOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Forms
const commitmentForm = ref({
  pantryId: '',
  commitmentType: 'total' as 'total' | 'category' | 'produce_type',
  categoryId: '',
  produceTypeId: '',
  startDate: '',
  endDate: '',
  daysOfWeek: [] as number[],
  frequencyWeeks: 1,
  dailyWeightLbs: 0,
  isFirm: false,
  notes: ''
})

const editForm = ref({
  _id: '',
  weekStartDate: '',
  endDate: '',
  daysOfWeek: [] as number[],
  frequencyWeeks: 1,
  dailyWeightLbs: 0,
  commitmentType: 'total',
  categoryId: '',
  produceTypeId: '',
  isFirm: false,
  notes: ''
})

// Validation
const startDateError = ref('')
const endDateError = ref('')

// Initialize filters from route params and localStorage
onMounted(async () => {
  await fetchInitialData()
  
  // Set filters from route params or localStorage
  if (route.query.pantryId) {
    selectedPantryId.value = route.query.pantryId as string
  }
  
  if (route.query.startDate && route.query.endDate) {
    filterStartDate.value = route.query.startDate as string
    filterEndDate.value = route.query.endDate as string
  } else {
    // Default to current calendar year
    const currentYear = new Date().getFullYear()
    filterStartDate.value = `${currentYear}-01-01`
    filterEndDate.value = `${currentYear}-12-31`
    
    // Save to localStorage
    localStorage.setItem('commitmentFilterDates', JSON.stringify({
      startDate: filterStartDate.value,
      endDate: filterEndDate.value
    }))
  }

  // Load saved commitment type
  const savedCommitmentType = localStorage.getItem('commitmentType')
  if (savedCommitmentType) {
    commitmentForm.value.commitmentType = savedCommitmentType as any
  }

  await fetchCommitments()
})

// Load saved dates from localStorage
const savedDates = localStorage.getItem('commitmentFilterDates')
if (savedDates) {
  const dates = JSON.parse(savedDates)
  if (!route.query.startDate && !route.query.endDate) {
    filterStartDate.value = dates.startDate || filterStartDate.value
    filterEndDate.value = dates.endDate || filterEndDate.value
  }
}

// Watch for changes to save dates and commitment type
watch([filterStartDate, filterEndDate], () => {
  localStorage.setItem('commitmentFilterDates', JSON.stringify({
    startDate: filterStartDate.value,
    endDate: filterEndDate.value
  }))
})

watch(() => commitmentForm.value.commitmentType, (newType) => {
  localStorage.setItem('commitmentType', newType)
})

// Computed properties
const isFormValid = computed(() => {
  return commitmentForm.value.pantryId &&
         commitmentForm.value.startDate &&
         commitmentForm.value.endDate &&
         commitmentForm.value.daysOfWeek.length > 0 &&
         commitmentForm.value.frequencyWeeks > 0 &&
         commitmentForm.value.dailyWeightLbs > 0 &&
         (commitmentForm.value.commitmentType === 'total' ||
          (commitmentForm.value.commitmentType === 'category' && commitmentForm.value.categoryId) ||
          (commitmentForm.value.commitmentType === 'produce_type' && commitmentForm.value.produceTypeId))
})

// Methods
const fetchInitialData = async () => {
  try {
    const [pantriesRes, categoriesRes, produceTypesRes] = await Promise.all([
      fetch('/api/admin-food-pantries'),
      fetch('/api/admin-categories'),
      fetch('/api/admin-produce-types')
    ])

    if (pantriesRes.ok) pantries.value = (await pantriesRes.json()).data
    if (categoriesRes.ok) categories.value = (await categoriesRes.json()).data
    if (produceTypesRes.ok) produceTypes.value = (await produceTypesRes.json()).data
  } catch (err) {
    error.value = 'Failed to load initial data'
  }
}

const fetchCommitments = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = new URLSearchParams()
    
    // Only add pantryId if a specific pantry is selected
    if (selectedPantryId.value) {
      params.append('pantryId', selectedPantryId.value)
    }
    
    // Always add date filters
    if (filterStartDate.value) {
      params.append('startDate', filterStartDate.value)
    }
    if (filterEndDate.value) {
      params.append('endDate', filterEndDate.value)
    }
    
    const response = await fetch(`/api/commitments?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      commitments.value = data.data || []
    } else {
      const errorData = await response.json()
      error.value = errorData.error || 'Failed to fetch commitments'
    }
  } catch (err) {
    error.value = 'Network error while fetching commitments'
  } finally {
    loading.value = false
  }
}

// Helper function to format days of week
const formatDaysOfWeek = (days: number[]) => {
  if (!days || days.length === 0) return '-'
  const sortedDays = [...days].sort((a, b) => a - b)
  return sortedDays.map(d => dayOptions[d].substring(0, 3)).join(', ')
}

const createCommitment = async () => {
  if (!isFormValid.value) return

  formSubmitting.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const response = await fetch('/api/commitments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(commitmentForm.value)
    })

    if (response.ok) {
      const data = await response.json()
      successMessage.value = data.message || 'Plan created successfully'

      // Reset form
      Object.assign(commitmentForm.value, {
        pantryId: selectedPantryId.value, // Keep pantry selected
        commitmentType: commitmentForm.value.commitmentType, // Keep type
        categoryId: '',
        produceTypeId: '',
        startDate: '',
        endDate: '',
        daysOfWeek: [],
        frequencyWeeks: 1,
        dailyWeightLbs: 0,
        isFirm: false,
        notes: ''
      })

      showCreateForm.value = false
      await fetchCommitments()
    } else {
      const errorData = await response.json()
      error.value = errorData.error || 'Failed to create plan'
    }
  } catch (err) {
    error.value = 'Network error while creating plan'
  } finally {
    formSubmitting.value = false
  }
}

const editCommitment = (commitment: Commitment) => {
  editForm.value = {
    _id: commitment._id,
    weekStartDate: commitment.weekStartDate.split('T')[0],
    endDate: commitment.endDate ? commitment.endDate.split('T')[0] : '',
    daysOfWeek: commitment.daysOfWeek || [],
    frequencyWeeks: commitment.frequencyWeeks || 1,
    dailyWeightLbs: commitment.dailyWeightLbs || commitment.weeklyWeightLbs || 0,
    commitmentType: commitment.commitmentType || 'total',
    categoryId: commitment.categoryId?._id || commitment.categoryId || '',
    produceTypeId: commitment.produceTypeId?._id || commitment.produceTypeId || '',
    isFirm: commitment.isFirm || false,
    notes: commitment.notes || ''
  }
  showEditModal.value = true
}

const updateCommitment = async () => {
  formSubmitting.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const response = await fetch(`/api/commitments?id=${editForm.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        weekStartDate: editForm.value.weekStartDate,
        endDate: editForm.value.endDate,
        daysOfWeek: editForm.value.daysOfWeek,
        frequencyWeeks: editForm.value.frequencyWeeks,
        dailyWeightLbs: editForm.value.dailyWeightLbs,
        commitmentType: editForm.value.commitmentType,
        categoryId: editForm.value.categoryId || undefined,
        produceTypeId: editForm.value.produceTypeId || undefined,
        isFirm: editForm.value.isFirm,
        notes: editForm.value.notes
      })
    })

    if (response.ok) {
      successMessage.value = 'Plan updated successfully'
      showEditModal.value = false
      await fetchCommitments()
    } else {
      const errorData = await response.json()
      error.value = errorData.error || 'Failed to update plan'
    }
  } catch (err) {
    error.value = 'Network error while updating plan'
  } finally {
    formSubmitting.value = false
  }
}

const duplicateCommitment = async (commitment: Commitment) => {
  if (!confirm('Create a duplicate of this plan?')) return

  formSubmitting.value = true
  error.value = ''
  successMessage.value = ''

  try {
    // Create duplicate with same data but new dates
    const duplicateData = {
      pantryId: commitment.pantryId?._id || commitment.pantryId,
      startDate: commitment.weekStartDate.split('T')[0],
      endDate: commitment.endDate ? commitment.endDate.split('T')[0] : commitment.weekStartDate.split('T')[0],
      daysOfWeek: commitment.daysOfWeek || [],
      frequencyWeeks: commitment.frequencyWeeks || 1,
      dailyWeightLbs: commitment.dailyWeightLbs || commitment.weeklyWeightLbs || 0,
      commitmentType: commitment.commitmentType || 'total',
      categoryId: commitment.categoryId?._id || commitment.categoryId,
      produceTypeId: commitment.produceTypeId?._id || commitment.produceTypeId,
      isFirm: commitment.isFirm || false,
      notes: commitment.notes || ''
    }

    const response = await fetch('/api/commitments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(duplicateData)
    })

    if (response.ok) {
      successMessage.value = 'Plan duplicated successfully'
      await fetchCommitments()
    } else {
      const errorData = await response.json()
      error.value = errorData.error || 'Failed to duplicate plan'
    }
  } catch (err) {
    error.value = 'Network error while duplicating plan'
  } finally {
    formSubmitting.value = false
  }
}

const deleteCommitment = async (id: string) => {
  if (!confirm('Are you sure you want to delete this plan?')) return

  try {
    const response = await fetch(`/api/commitments?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })

    if (response.ok) {
      successMessage.value = 'Plan deleted successfully'
      await fetchCommitments()
    } else {
      const errorData = await response.json()
      error.value = errorData.error || 'Failed to delete plan'
    }
  } catch (err) {
    error.value = 'Network error while deleting plan'
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedCommitments.value = []
  } else {
    selectedCommitments.value = commitments.value.map(c => c._id)
  }
}

const bulkDelete = async () => {
  const count = selectedCommitments.value.length
  if (!confirm(`Are you sure you want to delete ${count} plan${count > 1 ? 's' : ''}?`)) return

  try {
    // Delete all selected plans in parallel
    const deletePromises = selectedCommitments.value.map(id =>
      fetch(`/api/commitments?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
    )

    const results = await Promise.all(deletePromises)
    const failedCount = results.filter(r => !r.ok).length

    if (failedCount === 0) {
      successMessage.value = `Successfully deleted ${count} plan${count > 1 ? 's' : ''}`
    } else if (failedCount === count) {
      error.value = 'Failed to delete all plans'
    } else {
      successMessage.value = `Deleted ${count - failedCount} plans. ${failedCount} failed.`
    }

    selectedCommitments.value = []
    await fetchCommitments()
  } catch (err) {
    error.value = 'Network error while deleting plans'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Clear messages after 5 seconds
watch([successMessage, error], () => {
  if (successMessage.value || error.value) {
    setTimeout(() => {
      successMessage.value = ''
      error.value = ''
    }, 5000)
  }
})
</script>