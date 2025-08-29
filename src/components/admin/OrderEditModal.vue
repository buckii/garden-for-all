<template>
  <!-- Modal Overlay -->
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-6 border max-w-4xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Modal Header -->
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold text-gray-900">Edit Order</h3>
          <button @click="close" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Error/Success Messages -->
        <div v-if="error" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div v-if="success" class="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
          <p class="text-sm text-green-700">{{ success }}</p>
        </div>

        <form @submit.prevent="saveOrder" class="space-y-6">
          <!-- Order Details -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-4">Order Details</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Pantry -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Food Pantry</label>
                <select v-model="editForm.pantryId" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                  <option value="">Select a pantry...</option>
                  <option v-for="pantry in pantries" :key="pantry.id || pantry._id" :value="pantry.id || pantry._id">
                    {{ pantry.name }}
                  </option>
                </select>
              </div>

              <!-- Delivery Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Delivery/Pickup Date</label>
                <input type="date" v-model="editForm.deliveryDate" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              </div>

              <!-- Pickup Time -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                <input type="time" v-model="editForm.pickupTime"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              </div>

              <!-- Status -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select v-model="editForm.status" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <!-- Order Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                <select v-model="editForm.orderType" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>

              <!-- Packer Name -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Packer Name</label>
                <input type="text" v-model="editForm.packerName" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
              </div>
            </div>

            <!-- Notes -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea v-model="editForm.notes" rows="3"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500 resize-none"></textarea>
            </div>
          </div>

          <!-- Products -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
              <h4 class="font-medium text-gray-900">Products</h4>
              <button type="button" @click="addProduct"
                class="px-3 py-1 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 transition-colors text-sm">
                Add Product
              </button>
            </div>

            <div class="space-y-3">
              <div v-for="(product, index) in editForm.products" :key="index"
                class="grid grid-cols-12 gap-3 p-3 bg-white rounded-lg border">
                
                <!-- Product Selection -->
                <div class="col-span-12 md:col-span-5">
                  <select v-model="product.produceTypeId" required
                    class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-garden-green-500">
                    <option value="">Select product...</option>
                    <option v-for="produceType in produceTypes" :key="produceType.id || produceType._id" 
                      :value="produceType.id || produceType._id">
                      {{ produceType.name }}
                    </option>
                  </select>
                </div>

                <!-- Weight -->
                <div class="col-span-12 md:col-span-3">
                  <input type="number" v-model.number="product.weight" step="0.1" min="0" required placeholder="Weight (lbs)"
                    class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-garden-green-500">
                </div>

                <!-- Quantity -->
                <div class="col-span-12 md:col-span-2">
                  <input type="number" v-model.number="product.quantity" min="0" placeholder="Quantity"
                    class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-garden-green-500">
                </div>

                <!-- Remove Button -->
                <div class="col-span-12 md:col-span-2 flex items-center">
                  <button type="button" @click="removeProduct(index)"
                    class="w-full px-2 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                    Remove
                  </button>
                </div>
              </div>

              <div v-if="editForm.products.length === 0" class="text-center py-8 text-gray-500">
                <p>No products added</p>
                <button type="button" @click="addProduct"
                  class="mt-2 text-garden-green-600 hover:text-garden-green-700 text-sm">
                  Add your first product
                </button>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div v-if="editForm.products.length > 0" class="bg-blue-50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-3">Order Summary</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-lg font-bold text-garden-green-600">{{ totalWeight.toFixed(1) }}</div>
                <div class="text-sm text-gray-600">Total Weight (lbs)</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-garden-green-600">{{ totalProducts }}</div>
                <div class="text-sm text-gray-600">Product Types</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-garden-green-600">${{ estimatedValue.toFixed(2) }}</div>
                <div class="text-sm text-gray-600">Estimated Value</div>
              </div>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="flex justify-end space-x-4 pt-4 border-t">
            <button type="button" @click="close"
              class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" :disabled="loading || editForm.products.length === 0"
              class="px-6 py-2 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <span v-if="loading">Saving...</span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface OrderProduct {
  produceTypeId: string
  weight: number
  quantity?: number
}

interface EditOrder {
  _id: string
  pantryId: string
  deliveryDate: string
  pickupTime: string
  packerName: string
  orderType: 'delivery' | 'pickup'
  status: string
  notes: string
  products: OrderProduct[]
}

const props = defineProps<{
  show: boolean
  order: any | null
  pantries: any[]
  produceTypes: any[]
}>()

const emit = defineEmits<{
  close: []
  saved: [order: any]
}>()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const editForm = ref<EditOrder>({
  _id: '',
  pantryId: '',
  deliveryDate: '',
  pickupTime: '',
  packerName: '',
  orderType: 'delivery',
  status: 'draft',
  notes: '',
  products: []
})

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/.netlify/functions'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Computed properties
const totalWeight = computed(() => {
  return editForm.value.products.reduce((sum, product) => sum + (product.weight || 0), 0)
})

const totalProducts = computed(() => {
  return editForm.value.products.length
})

const estimatedValue = computed(() => {
  return editForm.value.products.reduce((sum, product) => {
    const produceType = props.produceTypes.find(pt => (pt.id || pt._id) === product.produceTypeId)
    const pricePerLb = produceType?.pricePerLb || 0
    return sum + (product.weight * pricePerLb)
  }, 0)
})

// Watch for order changes
watch(() => props.order, (newOrder) => {
  if (newOrder) {
    // Populate form with order data
    editForm.value = {
      _id: newOrder._id,
      pantryId: newOrder.pantryId?._id || newOrder.pantryId,
      deliveryDate: newOrder.deliveryDate ? new Date(newOrder.deliveryDate).toISOString().split('T')[0] : '',
      pickupTime: newOrder.pickupTime || '',
      packerName: newOrder.packerName || '',
      orderType: newOrder.orderType || 'delivery',
      status: newOrder.status || 'draft',
      notes: newOrder.notes || '',
      products: (newOrder.products || []).map((p: any) => ({
        produceTypeId: p.produceTypeId,
        weight: p.weight || 0,
        quantity: p.quantity || 0
      }))
    }
    error.value = null
    success.value = null
  }
}, { immediate: true })

// Methods
const addProduct = () => {
  editForm.value.products.push({
    produceTypeId: '',
    weight: 0,
    quantity: 0
  })
}

const removeProduct = (index: number) => {
  editForm.value.products.splice(index, 1)
}

const saveOrder = async () => {
  loading.value = true
  error.value = null
  success.value = null
  
  try {
    // Calculate totals
    const totalWeight = editForm.value.products.reduce((sum, p) => sum + (p.weight || 0), 0)
    const totalValue = editForm.value.products.reduce((sum, product) => {
      const produceType = props.produceTypes.find(pt => (pt.id || pt._id) === product.produceTypeId)
      const pricePerLb = produceType?.pricePerLb || 0
      return sum + (product.weight * pricePerLb)
    }, 0)

    const updateData = {
      pantryId: editForm.value.pantryId,
      deliveryDate: editForm.value.deliveryDate,
      pickupTime: editForm.value.pickupTime,
      packerName: editForm.value.packerName,
      orderType: editForm.value.orderType,
      status: editForm.value.status,
      notes: editForm.value.notes,
      products: editForm.value.products.filter(p => p.produceTypeId && p.weight > 0),
      totalWeight,
      totalValue
    }
    
    const response = await fetch(`${API_BASE}/orders?id=${editForm.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updateData)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update order')
    }
    
    success.value = 'Order updated successfully!'
    
    // Emit success event
    emit('saved', result.data)
    
    // Close modal after a moment
    setTimeout(() => {
      close()
    }, 1500)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update order'
  } finally {
    loading.value = false
  }
}

const close = () => {
  error.value = null
  success.value = null
  emit('close')
}
</script>