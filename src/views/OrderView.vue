<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Page Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 font-poppins">Create New Order</h1>
          <p class="text-gray-600 mt-2">Select harvest entries to pack for delivery to a food pantry</p>
        </div>
        <router-link to="/harvest"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-garden-green-600 hover:bg-garden-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-green-500 transition-colors">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Harvest
        </router-link>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <div v-if="success" class="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
        <p class="text-sm text-green-700">{{ success }}</p>
      </div>

      <!-- Desktop Layout -->
      <div class="lg:flex lg:gap-8">
        <!-- Main Content -->
        <div class="lg:w-2/3">
          <form @submit.prevent="submitOrder" class="space-y-6">
            <!-- Order Details Card -->
            <div class="bg-white rounded-lg shadow-sm border p-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Pantry Selection -->
                <div>
                  <label for="pantry" class="block text-sm font-medium text-gray-700 mb-2">Food Pantry *</label>
                  <select id="pantry" v-model="form.pantryId" required
                    @change="onPantryChange"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                    <option value="">Select a pantry...</option>
                    <option v-for="pantry in pantries" :key="pantry._id" :value="pantry._id">
                      {{ pantry.name }}
                    </option>
                  </select>
                </div>

                <!-- Order Type -->
                <div>
                  <label for="orderType" class="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                  <select id="orderType" v-model="form.orderType" required
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>

                <!-- Delivery Date -->
                <div>
                  <label for="deliveryDate" class="block text-sm font-medium text-gray-700 mb-2">Delivery Date *</label>
                  <input type="date" id="deliveryDate" v-model="form.deliveryDate" required
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                </div>

                <!-- Pickup Time -->
                <div v-if="form.orderType === 'pickup'">
                  <label for="pickupTime" class="block text-sm font-medium text-gray-700 mb-2">Pickup Time</label>
                  <input type="time" id="pickupTime" v-model="form.pickupTime"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                </div>

                <!-- Packer Name -->
                <div :class="form.orderType === 'delivery' ? 'md:col-span-2' : ''">
                  <label for="packerName" class="block text-sm font-medium text-gray-700 mb-2">Packer Name</label>
                  <input type="text" id="packerName" v-model="form.packerName"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                </div>
              </div>

              <!-- Notes -->
              <div class="mt-4">
                <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea id="notes" v-model="form.notes" rows="3"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500"></textarea>
              </div>
            </div>

            <!-- Available Harvest Entries -->
            <div v-if="form.pantryId" class="bg-white rounded-lg shadow-sm border p-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                Available Harvest Entries for {{ selectedPantryName }}
              </h2>

              <div v-if="loadingEntries" class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
                <p class="mt-2 text-gray-600">Loading available harvest entries...</p>
              </div>

              <div v-else-if="availableEntries.length === 0" class="text-center py-8 text-gray-500">
                <p>No available harvest entries for this pantry</p>
              </div>

              <div v-else class="space-y-3">
                <div v-for="entry in availableEntries" :key="entry._id"
                  class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  :class="{ 'bg-green-50 border-green-500': isEntrySelected(entry._id) }"
                  @click="toggleEntry(entry._id)">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-3">
                        <input type="checkbox" :checked="isEntrySelected(entry._id)" @click.stop="toggleEntry(entry._id)"
                          class="rounded border-gray-300 text-garden-green-600 focus:ring-garden-green-500">
                        <div>
                          <h4 class="font-medium text-gray-900">{{ entry.produceType.name }}</h4>
                          <div class="text-sm text-gray-600 mt-1">
                            <span>{{ entry.weight.toFixed(1) }} lbs</span>
                            <span class="mx-2">•</span>
                            <span>{{ formatDate(entry.harvestDate) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-medium text-gray-900">
                        ${{ (entry.weight * entry.produceType.pricePerLb).toFixed(2) }}
                      </div>
                      <div class="text-xs text-gray-500">
                        ${{ entry.produceType.pricePerLb.toFixed(2) }}/lb
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="lg:w-1/3 mt-6 lg:mt-0">
          <div class="sticky top-6 space-y-6">
            <!-- Order Summary -->
            <div class="bg-white rounded-lg shadow-sm border p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div v-if="selectedEntries.length === 0" class="text-center py-8 text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p class="text-sm">No items selected</p>
                <p class="text-xs mt-1">Select harvest entries to add to this order</p>
              </div>

              <div v-else class="space-y-4">
                <!-- Selected Items -->
                <div class="border-b pb-4">
                  <h4 class="text-sm font-medium text-gray-700 mb-3">Selected Items</h4>
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    <div v-for="item in groupedSelectedItems" :key="item.produceTypeName" class="flex justify-between text-sm">
                      <span class="text-gray-700">{{ item.produceTypeName }}</span>
                      <span class="font-medium">{{ item.totalWeight.toFixed(1) }} lbs</span>
                    </div>
                  </div>
                </div>

                <!-- Summary Stats -->
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Total Weight:</span>
                    <span class="font-semibold text-gray-900">{{ totalWeight.toFixed(1) }} lbs</span>
                  </div>
                </div>

                <!-- Action Button -->
                <div class="pt-4 border-t">
                  <button type="button" @click="submitOrder" :disabled="loading || selectedEntries.length === 0"
                    class="w-full px-4 py-3 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                    <span v-if="loading">Creating Order...</span>
                    <span v-else>Create Order</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Plan Box -->
            <div v-if="form.pantryId && form.deliveryDate" class="bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Plan for {{ formatDate(form.deliveryDate) }}</h3>

            <div v-if="loadingPlans" class="text-center py-8">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-garden-green-600"></div>
              <p class="mt-2 text-sm text-gray-600">Loading plans...</p>
            </div>

            <div v-else-if="planFulfillment.length === 0" class="text-center py-8 text-gray-500">
              <p class="text-sm">No plans for this pantry on this date</p>
            </div>

            <div v-else class="space-y-3">
              <div v-for="plan in planFulfillment" :key="plan._id" class="border-b pb-3 last:border-b-0">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-sm text-gray-700">{{ getPlanDescription(plan) }}</span>
                </div>

                <!-- Progress Bar -->
                <div class="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="plan.fulfilled >= plan.dailyWeightLbs ? 'bg-green-600' : 'bg-blue-500'"
                    :style="{ width: `${Math.min((plan.fulfilled / plan.dailyWeightLbs) * 100, 100)}%` }"
                  ></div>
                </div>

                <!-- Progress Text -->
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600">
                    {{ plan.fulfilled.toFixed(1) }} / {{ plan.dailyWeightLbs }} lbs
                  </span>
                  <span
                    :class="plan.fulfilled >= plan.dailyWeightLbs ? 'text-green-600 font-medium' : 'text-gray-500'"
                  >
                    {{ ((plan.fulfilled / plan.dailyWeightLbs) * 100).toFixed(0) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showConfirmationModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeModal">
      <div class="relative top-20 mx-auto p-8 border max-w-md shadow-lg rounded-md bg-white" @click.stop>
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Order Created Successfully!</h3>
          <p class="text-sm text-gray-500 mb-6">
            Order for {{ selectedPantryName }} has been created with {{ selectedEntries.length }} harvest entries.
          </p>
          <div class="flex gap-3">
            <router-link to="/dashboard"
              class="flex-1 px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700 transition-colors text-center">
              Go to Dashboard
            </router-link>
            <button @click="createAnother"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              Create Another
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const route = useRoute()
const API_BASE = '/api'

// State
const loading = ref(false)
const loadingEntries = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const showConfirmationModal = ref(false)

// Form data
const form = ref({
  pantryId: '',
  deliveryDate: '',
  pickupTime: '',
  packerName: '',
  orderType: 'delivery' as 'delivery' | 'pickup',
  notes: ''
})

// Data
const pantries = ref<any[]>([])
const availableEntries = ref<any[]>([])
const selectedEntries = ref<string[]>([])
const createdOrder = ref<any>(null)
const plans = ref<any[]>([])
const loadingPlans = ref(false)

// Computed
const selectedPantryName = computed(() => {
  const pantry = pantries.value.find(p => p._id === form.value.pantryId)
  return pantry?.name || ''
})

const selectedEntriesFull = computed(() => {
  return availableEntries.value.filter(e => selectedEntries.value.includes(e._id))
})

const groupedSelectedItems = computed(() => {
  const grouped = new Map()

  selectedEntriesFull.value.forEach(entry => {
    const produceName = entry.produceType.name
    if (!grouped.has(produceName)) {
      grouped.set(produceName, {
        produceTypeName: produceName,
        totalWeight: 0
      })
    }
    grouped.get(produceName).totalWeight += entry.weight
  })

  return Array.from(grouped.values())
})

const totalWeight = computed(() => {
  return selectedEntriesFull.value.reduce((sum, entry) => sum + entry.weight, 0)
})

const totalValue = computed(() => {
  return selectedEntriesFull.value.reduce((sum, entry) => {
    return sum + (entry.weight * entry.produceType.pricePerLb)
  }, 0)
})

const uniqueProduceTypes = computed(() => {
  const types = new Set(selectedEntriesFull.value.map(e => e.produceType.name))
  return types.size
})

// Plan fulfillment calculation
const planFulfillment = computed(() => {
  if (plans.value.length === 0) return []

  // Create a mutable copy of plans with fulfillment tracking
  const fulfillmentData = plans.value.map(plan => ({
    ...plan,
    fulfilled: 0,
    remaining: plan.dailyWeightLbs || 0
  }))

  // Sort entries to ensure consistent allocation
  const entries = [...selectedEntriesFull.value]

  // Process each entry
  entries.forEach(entry => {
    let remainingWeight = entry.weight
    const produceTypeId = entry.produceType._id
    const categoryId = entry.produceType.categoryId

    // Priority 1: Specific produce type match
    const produceTypePlan = fulfillmentData.find(p =>
      p.commitmentType === 'produce_type' &&
      p.produceTypeId?._id === produceTypeId &&
      p.remaining > 0
    )

    if (produceTypePlan && remainingWeight > 0) {
      const allocated = Math.min(remainingWeight, produceTypePlan.remaining)
      produceTypePlan.fulfilled += allocated
      produceTypePlan.remaining -= allocated
      remainingWeight -= allocated
    }

    // Priority 2: Category match
    if (remainingWeight > 0 && categoryId) {
      const categoryPlan = fulfillmentData.find(p =>
        p.commitmentType === 'category' &&
        p.categoryId?._id === categoryId &&
        p.remaining > 0
      )

      if (categoryPlan) {
        const allocated = Math.min(remainingWeight, categoryPlan.remaining)
        categoryPlan.fulfilled += allocated
        categoryPlan.remaining -= allocated
        remainingWeight -= allocated
      }
    }

    // Priority 3: Any produce
    if (remainingWeight > 0) {
      const anyProducePlan = fulfillmentData.find(p =>
        p.commitmentType === 'total' &&
        p.remaining > 0
      )

      if (anyProducePlan) {
        const allocated = Math.min(remainingWeight, anyProducePlan.remaining)
        anyProducePlan.fulfilled += allocated
        anyProducePlan.remaining -= allocated
        remainingWeight -= allocated
      }
    }
  })

  return fulfillmentData
})

// Methods
const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const isEntrySelected = (entryId: string) => {
  return selectedEntries.value.includes(entryId)
}

const toggleEntry = (entryId: string) => {
  const index = selectedEntries.value.indexOf(entryId)
  if (index > -1) {
    selectedEntries.value.splice(index, 1)
  } else {
    selectedEntries.value.push(entryId)
  }
}

const onPantryChange = async () => {
  selectedEntries.value = []
  if (form.value.pantryId) {
    await Promise.all([
      fetchAvailableEntries(),
      fetchPlans()
    ])
  } else {
    availableEntries.value = []
    plans.value = []
  }
}

const fetchPantries = async () => {
  try {
    const response = await fetch(`${API_BASE}/admin-food-pantries`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    pantries.value = result.data || []
  } catch (err) {
    console.error('Failed to fetch pantries:', err)
  }
}

const fetchAvailableEntries = async () => {
  if (!form.value.pantryId) return

  loadingEntries.value = true
  try {
    const response = await fetch(`${API_BASE}/harvest-list?limit=1000`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    const allEntries = result.data?.entries || []

    // Show all entries that aren't assigned to an order (available inventory)
    availableEntries.value = allEntries.filter((entry: any) => {
      return !entry.orderId
    })
  } catch (err) {
    console.error('Failed to fetch harvest entries:', err)
    error.value = 'Failed to load available harvest entries'
  } finally {
    loadingEntries.value = false
  }
}

const fetchPlans = async () => {
  if (!form.value.pantryId || !form.value.deliveryDate) return

  loadingPlans.value = true
  try {
    const params = new URLSearchParams({
      pantryId: form.value.pantryId,
      startDate: form.value.deliveryDate,
      endDate: form.value.deliveryDate
    })

    const response = await fetch(`${API_BASE}/commitments?${params}`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    plans.value = result.data || []
  } catch (err) {
    console.error('Failed to fetch plans:', err)
  } finally {
    loadingPlans.value = false
  }
}

const submitOrder = async () => {
  if (selectedEntries.value.length === 0) {
    error.value = 'Please select at least one harvest entry'
    return
  }

  loading.value = true
  error.value = null
  success.value = null

  try {
    const orderData = {
      pantryId: form.value.pantryId,
      deliveryDate: form.value.deliveryDate,
      pickupTime: form.value.pickupTime,
      packerName: form.value.packerName,
      orderType: form.value.orderType,
      notes: form.value.notes,
      harvestEntryIds: selectedEntries.value,
      status: 'ready'
    }

    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create order')
    }

    const result = await response.json()
    createdOrder.value = result.data
    showConfirmationModal.value = true

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create order'
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  showConfirmationModal.value = false
  router.push('/dashboard')
}

const createAnother = () => {
  showConfirmationModal.value = false

  // Reset form but keep pantry selected
  const pantryId = form.value.pantryId
  form.value = {
    pantryId,
    deliveryDate: '',
    pickupTime: '',
    packerName: '',
    orderType: 'delivery',
    notes: ''
  }

  selectedEntries.value = []
  setDefaultDate()
  fetchAvailableEntries()
}

const setDefaultDate = () => {
  // Use local timezone to avoid UTC conversion issues
  form.value.deliveryDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

const getPlanDescription = (plan: any) => {
  const weight = plan.dailyWeightLbs || 0
  if (plan.commitmentType === 'total') {
    return `${weight}lb of Any Produce`
  } else if (plan.commitmentType === 'produce_type' && plan.produceTypeId?.name) {
    return `${weight}lb of ${plan.produceTypeId.name}`
  } else if (plan.commitmentType === 'category' && plan.categoryId?.name) {
    return `${weight}lb of Any ${plan.categoryId.name}`
  }
  return 'Unknown Type'
}

// Watch for delivery date changes to refetch plans
watch(() => form.value.deliveryDate, () => {
  if (form.value.pantryId && form.value.deliveryDate) {
    fetchPlans()
  }
})

onMounted(async () => {
  setDefaultDate()
  await fetchPantries()

  // Prepopulate pantry from query parameter if provided
  const pantryId = route.query.pantryId as string
  if (pantryId) {
    form.value.pantryId = pantryId
    await Promise.all([
      fetchAvailableEntries(),
      fetchPlans()
    ])
  }
})
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
