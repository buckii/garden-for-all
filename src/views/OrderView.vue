<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-4xl mx-auto px-4 py-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 font-poppins">Create New Order</h1>
        <p class="text-gray-600 mt-2">Pack and prepare an order for delivery to a food pantry</p>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <div v-if="success" class="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700">{{ success }}</p>
          </div>
        </div>
      </div>

      <form @submit.prevent="submitOrder" class="space-y-6">
        <!-- Order Details Card -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Harvest Location -->
            <div class="md:col-span-2">
              <label for="harvestLocation" class="block text-sm font-medium text-gray-700 mb-2">Harvest Location</label>
              <select id="harvestLocation" v-model="form.harvestLocationId" required
                @change="onHarvestLocationChange"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="">Select a harvest location...</option>
                <option v-for="location in harvestLocations" :key="location.id || location._id" :value="location.id || location._id">
                  {{ location.name }}
                </option>
              </select>
            </div>

            <!-- Pantry Selection -->
            <div>
              <label for="pantry" class="block text-sm font-medium text-gray-700 mb-2">Food Pantry</label>
              <select id="pantry" v-model="form.pantryId" required
                @change="onPantryChange"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="">Select a pantry...</option>
                <option v-for="pantry in pantries" :key="pantry.id || pantry._id" :value="pantry.id || pantry._id">
                  {{ pantry.name }}
                </option>
              </select>
            </div>

            <!-- Order Type -->
            <div>
              <label for="orderType" class="block text-sm font-medium text-gray-700 mb-2">Delivery/Pickup</label>
              <select id="orderType" v-model="form.orderType" required
                @change="onOrderTypeChange"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>

            <!-- Date -->
            <div>
              <label for="deliveryDate" class="block text-sm font-medium text-gray-700 mb-2">{{ dateLabel }}</label>
              <input type="date" id="deliveryDate" v-model="form.deliveryDate" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>

            <!-- Time -->
            <div>
              <label for="pickupTime" class="block text-sm font-medium text-gray-700 mb-2">{{ timeLabel }}</label>
              <input type="time" id="pickupTime" v-model="form.pickupTime"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>

            <!-- Packer Name -->
            <div>
              <label for="packerName" class="block text-sm font-medium text-gray-700 mb-2">Packer Name</label>
              <input type="text" id="packerName" v-model="form.packerName" required placeholder="Enter packer's name"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>
          </div>

          <!-- Notes -->
          <div class="mt-6">
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea id="notes" v-model="form.notes" rows="3" placeholder="Additional notes or special instructions..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500 resize-none"></textarea>
          </div>
        </div>

        <!-- Weekly Commitment Section -->
        <div v-if="form.pantryId && weeklyCommitments.length > 0" class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">This Week's Commitments for {{ selectedPantryName }}</h2>
          <div class="space-y-3">
            <div v-for="commitment in weeklyCommitments" :key="commitment._id" 
              class="flex items-center justify-between p-4 bg-garden-green-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">{{ commitment.produceTypeId?.name || 'Category: ' + commitment.categoryId?.name }}</h3>
                <p class="text-sm text-gray-600">{{ commitment.weeklyWeightLbs }} lbs committed</p>
              </div>
              <button type="button" @click="addCommitmentToOrder(commitment)"
                class="px-4 py-2 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 transition-colors">
                Add to Order
              </button>
            </div>
          </div>
        </div>

        <!-- Available Inventory Section -->
        <div v-if="form.harvestLocationId && availableInventory.length > 0" class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Available Inventory at {{ selectedHarvestLocationName }}</h2>
          <p class="text-gray-600 mb-4">Items harvested in the past 2 weeks but not yet added to an order</p>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div v-for="item in availableInventory" :key="item.produceType?.name" 
              class="p-3 border border-gray-200 rounded-lg hover:border-garden-green-300 transition-colors">
              <h3 class="font-medium text-gray-900">{{ item.produceType?.name }}</h3>
              <p class="text-sm text-gray-600">{{ item.totalWeight.toFixed(1) }} lbs available</p>
              <p class="text-xs text-gray-500">{{ item.entries.length }} harvest{{ item.entries.length !== 1 ? 's' : '' }}</p>
              <button type="button" @click="quickAddFromInventory(item)"
                class="mt-2 w-full px-3 py-1 text-sm bg-garden-green-600 text-white rounded hover:bg-garden-green-700 transition-colors">
                Quick Add
              </button>
            </div>
          </div>
        </div>

        <!-- Products Section -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Products</h2>
            <button type="button" @click="addProduct"
              class="px-4 py-2 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 transition-colors">
              Add Product
            </button>
          </div>

          <!-- Quick Add from This Week -->
          <div v-if="weeklyHarvests.length > 0" class="mb-6 p-4 bg-garden-green-50 rounded-lg">
            <h3 class="text-sm font-medium text-garden-green-800 mb-3">Quick Add from This Week's Harvest</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <button v-for="harvest in weeklyHarvests" :key="harvest.produceType?.name" type="button"
                @click="quickAddProduct(harvest)"
                class="px-3 py-2 text-sm bg-white border border-garden-green-200 rounded-md hover:bg-garden-green-100 text-garden-green-700 transition-colors">
                {{ harvest.produceType?.name }}
                <span class="block text-xs text-gray-500">{{ harvest.totalWeight.toFixed(1) }} lbs available</span>
              </button>
            </div>
          </div>

          <!-- Product List -->
          <div class="space-y-4">
            <div v-for="(product, index) in form.products" :key="index"
              class="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg">

              <!-- Product Selection -->
              <div class="col-span-12 md:col-span-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select v-model="product.produceTypeId" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                  <option value="">Select product...</option>
                  <option v-for="produceType in produceTypes" :key="produceType.id || produceType._id"
                    :value="produceType.id || produceType._id">
                    {{ produceType.name }}
                  </option>
                </select>
              </div>

              <!-- Weight -->
              <div class="col-span-12 md:col-span-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                <input type="number" v-model.number="product.weight" step="0.1" min="0" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              </div>

              <!-- Quantity (optional) -->
              <div class="col-span-12 md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" v-model.number="product.quantity" min="0"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              </div>

              <!-- Remove Button -->
              <div class="col-span-12 md:col-span-2 flex items-end">
                <button type="button" @click="removeProduct(index)"
                  class="w-full px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                  Remove
                </button>
              </div>
            </div>

            <div v-if="form.products.length === 0" class="text-center py-8 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p class="mt-2">No products added yet</p>
              <button type="button" @click="addProduct"
                class="mt-2 text-garden-green-600 hover:text-garden-green-700">Add your first product</button>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div v-if="form.products.length > 0" class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-garden-green-600">{{ totalWeight.toFixed(1) }}</div>
              <div class="text-sm text-gray-600">Total Weight (lbs)</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-garden-green-600">{{ totalProducts }}</div>
              <div class="text-sm text-gray-600">Product Types</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-garden-green-600">${{ estimatedValue.toFixed(2) }}</div>
              <div class="text-sm text-gray-600">Estimated Value</div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-4">
          <router-link to="/dashboard"
            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </router-link>
          <button type="submit" :disabled="loading || form.products.length === 0"
            class="px-6 py-3 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <span v-if="loading">Creating Order...</span>
            <span v-else>Create Order</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Form data
const form = ref({
  harvestLocationId: '',
  pantryId: '',
  deliveryDate: '',
  pickupTime: '',
  packerName: '',
  orderType: 'delivery',
  notes: '',
  products: [] as Array<{
    produceTypeId: string
    weight: number
    quantity?: number
  }>
})

// Data
const pantries = ref<any[]>([])
const produceTypes = ref<any[]>([])
const harvestLocations = ref<any[]>([])
const weeklyHarvests = ref<any[]>([])
const weeklyCommitments = ref<any[]>([])
const availableInventory = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/.netlify/functions'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Computed properties
const dateLabel = computed(() => {
  return form.value.orderType === 'delivery' ? 'Delivery Date' : 'Pickup Date'
})

const timeLabel = computed(() => {
  return form.value.orderType === 'delivery' ? 'Delivery Time' : 'Pickup Time'
})

const selectedPantryName = computed(() => {
  const pantry = pantries.value.find(p => (p.id || p._id) === form.value.pantryId)
  return pantry?.name || ''
})

const selectedHarvestLocationName = computed(() => {
  const location = harvestLocations.value.find(l => (l.id || l._id) === form.value.harvestLocationId)
  return location?.name || ''
})

const totalWeight = computed(() => {
  return form.value.products.reduce((sum, product) => sum + (product.weight || 0), 0)
})

const totalProducts = computed(() => {
  return form.value.products.length
})

const estimatedValue = computed(() => {
  return form.value.products.reduce((sum, product) => {
    const produceType = produceTypes.value.find(pt => (pt.id || pt._id) === product.produceTypeId)
    const pricePerLb = produceType?.pricePerLb || 0
    return sum + (product.weight * pricePerLb)
  }, 0)
})

// Methods
const addProduct = () => {
  form.value.products.push({
    produceTypeId: '',
    weight: 0,
    quantity: 0
  })
}

const removeProduct = (index: number) => {
  form.value.products.splice(index, 1)
}

const quickAddProduct = (harvest: any) => {
  const existingIndex = form.value.products.findIndex(p => p.produceTypeId === (harvest.produceType?.id || harvest.produceType?._id))

  if (existingIndex >= 0) {
    // Update existing product
    form.value.products[existingIndex].weight += 1
  } else {
    // Add new product
    form.value.products.push({
      produceTypeId: harvest.produceType?.id || harvest.produceType?._id,
      weight: 1,
      quantity: 1
    })
  }
}

const quickAddFromInventory = (item: any) => {
  const existingIndex = form.value.products.findIndex(p => p.produceTypeId === (item.produceType?.id || item.produceType?._id))

  if (existingIndex >= 0) {
    // Update existing product
    form.value.products[existingIndex].weight += 1
  } else {
    // Add new product
    form.value.products.push({
      produceTypeId: item.produceType?.id || item.produceType?._id,
      weight: 1,
      quantity: 1
    })
  }
}

const addCommitmentToOrder = (commitment: any) => {
  const produceTypeId = commitment.produceTypeId?._id || commitment.produceTypeId?.id
  if (!produceTypeId) return

  const existingIndex = form.value.products.findIndex(p => p.produceTypeId === produceTypeId)

  if (existingIndex >= 0) {
    // Update existing product with commitment weight
    form.value.products[existingIndex].weight = commitment.weeklyWeightLbs
  } else {
    // Add new product with commitment weight
    form.value.products.push({
      produceTypeId: produceTypeId,
      weight: commitment.weeklyWeightLbs,
      quantity: Math.ceil(commitment.weeklyWeightLbs) // Rough estimate
    })
  }
}

// Change handlers
const onHarvestLocationChange = () => {
  if (form.value.harvestLocationId) {
    fetchAvailableInventory()
  } else {
    availableInventory.value = []
  }
}

const onPantryChange = () => {
  if (form.value.pantryId) {
    fetchWeeklyCommitments()
  } else {
    weeklyCommitments.value = []
  }
}

const onOrderTypeChange = () => {
  // Labels will update automatically via computed properties
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

const fetchProduceTypes = async () => {
  try {
    const response = await fetch(`${API_BASE}/produce-types-list`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    produceTypes.value = result.data || []
  } catch (err) {
    console.error('Failed to fetch produce types:', err)
  }
}

const fetchHarvestLocations = async () => {
  try {
    const response = await fetch(`${API_BASE}/harvest-locations`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    harvestLocations.value = result.data || []
  } catch (err) {
    console.error('Failed to fetch harvest locations:', err)
  }
}

const fetchWeeklyCommitments = async () => {
  if (!form.value.pantryId) {
    weeklyCommitments.value = []
    return
  }

  try {
    // Get current Monday
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const mondayStr = monday.toISOString().split('T')[0]

    const response = await fetch(`${API_BASE}/commitments?pantryId=${form.value.pantryId}&startDate=${mondayStr}&endDate=${mondayStr}`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    weeklyCommitments.value = result.data || []
  } catch (err) {
    console.error('Failed to fetch weekly commitments:', err)
    weeklyCommitments.value = []
  }
}

const fetchAvailableInventory = async () => {
  if (!form.value.harvestLocationId) {
    availableInventory.value = []
    return
  }

  try {
    // Get date range for past 2 weeks
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const today = new Date()

    const startDate = twoWeeksAgo.toISOString().split('T')[0]
    const endDate = today.toISOString().split('T')[0]

    // Fetch harvest entries from this location in the past 2 weeks
    const harvestResponse = await fetch(`${API_BASE}/harvest-list?locationId=${form.value.harvestLocationId}&startDate=${startDate}&endDate=${endDate}&limit=1000`, {
      headers: getAuthHeader()
    })
    const harvestResult = await harvestResponse.json()
    const harvestEntries = harvestResult.data?.entries || harvestResult.data || []

    // Fetch existing orders to exclude already ordered items
    const ordersResponse = await fetch(`${API_BASE}/orders?startDate=${startDate}&endDate=${endDate}`, {
      headers: getAuthHeader()
    })
    const ordersResult = await ordersResponse.json()
    const orders = ordersResult.data || []

    // Get all product entries that are already in orders
    const orderedProductIds = new Set()
    orders.forEach((order: any) => {
      if (order.products) {
        order.products.forEach((product: any) => {
          // Track produce type IDs that have been ordered
          orderedProductIds.add(product.produceTypeId)
        })
      }
    })

    // Group harvest entries by produce type, excluding those already ordered
    const grouped = new Map()
    harvestEntries.forEach((entry: any) => {
      const produceTypeId = entry.produceTypeId || entry.produce_type_id
      
      // Skip if this produce type has been ordered recently
      if (orderedProductIds.has(produceTypeId)) return
      
      const weight = entry.weight || (entry.quantity * (entry.produceType?.conversionFactor || 1))

      if (!grouped.has(produceTypeId)) {
        grouped.set(produceTypeId, {
          produceType: entry.produceType,
          totalWeight: 0,
          entries: []
        })
      }

      const group = grouped.get(produceTypeId)
      group.totalWeight += weight
      group.entries.push(entry)
    })

    availableInventory.value = Array.from(grouped.values())
      .filter(item => item.totalWeight > 0)
      .sort((a, b) => b.totalWeight - a.totalWeight)

  } catch (err) {
    console.error('Failed to fetch available inventory:', err)
    availableInventory.value = []
  }
}

const fetchWeeklyHarvests = async () => {
  try {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const response = await fetch(`${API_BASE}/harvest-list?limit=1000`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    const entries = result.data?.entries || result.data || []

    // Filter to this week and group by produce type
    const thisWeekEntries = entries.filter((entry: any) => {
      const harvestDate = new Date(entry.harvestDate || entry.harvest_date)
      return harvestDate >= oneWeekAgo
    })

    const grouped = new Map()
    thisWeekEntries.forEach((entry: any) => {
      const produceTypeId = entry.produceTypeId || entry.produce_type_id
      const weight = entry.weight || (entry.quantity * (entry.produceType?.conversionFactor || 1))

      if (!grouped.has(produceTypeId)) {
        grouped.set(produceTypeId, {
          produceType: entry.produceType,
          totalWeight: 0,
          entries: []
        })
      }

      const group = grouped.get(produceTypeId)
      group.totalWeight += weight
      group.entries.push(entry)
    })

    weeklyHarvests.value = Array.from(grouped.values())
      .filter(harvest => harvest.totalWeight > 0)
      .sort((a, b) => b.totalWeight - a.totalWeight)
  } catch (err) {
    console.error('Failed to fetch weekly harvests:', err)
  }
}

const submitOrder = async () => {
  loading.value = true
  error.value = null
  success.value = null

  try {
    const orderData = {
      harvestLocationId: form.value.harvestLocationId,
      pantryId: form.value.pantryId,
      deliveryDate: form.value.deliveryDate,
      pickupTime: form.value.pickupTime,
      packerName: form.value.packerName,
      orderType: form.value.orderType,
      notes: form.value.notes,
      products: form.value.products.filter(p => p.produceTypeId && p.weight > 0),
      status: 'draft',
      createdAt: new Date().toISOString()
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
      throw new Error('Failed to create order')
    }

    success.value = 'Order created successfully!'

    // Reset form
    form.value = {
      harvestLocationId: '',
      pantryId: '',
      deliveryDate: '',
      pickupTime: '',
      packerName: '',
      orderType: 'delivery',
      notes: '',
      products: []
    }

    // Clear dependent data
    weeklyCommitments.value = []
    availableInventory.value = []

    // Redirect after a moment
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create order'
  } finally {
    loading.value = false
  }
}

// Set default delivery date to tomorrow
const setDefaultDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  form.value.deliveryDate = tomorrow.toISOString().split('T')[0]
}

onMounted(async () => {
  setDefaultDate()
  await Promise.all([
    fetchPantries(),
    fetchProduceTypes(),
    fetchHarvestLocations(),
    fetchWeeklyHarvests()
  ])
})
</script>