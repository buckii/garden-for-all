<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold text-gray-900">Order Management</h2>
      <router-link to="/order"
        class="px-4 py-2 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 transition-colors">
        + New Order
      </router-link>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select v-model="filters.status" @change="fetchOrders"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in-progress">In Progress</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Pantry</label>
          <select v-model="filters.pantryId" @change="fetchOrders"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            <option value="">All Pantries</option>
            <option v-for="pantry in pantries" :key="pantry.id || pantry._id" :value="pantry.id || pantry._id">
              {{ pantry.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" v-model="filters.startDate" @change="fetchOrders"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" v-model="filters.endDate" @change="fetchOrders"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-garden-green-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {{ error }}
    </div>

    <!-- Orders List -->
    <div v-else class="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div v-if="orders.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p class="mt-4 text-gray-500">No orders found</p>
        <router-link to="/order"
          class="mt-2 inline-block text-garden-green-600 hover:text-garden-green-700">
          Create your first order
        </router-link>
      </div>

      <div v-else>
        <!-- Table Header -->
        <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div class="grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div class="col-span-3">Pantry</div>
            <div class="col-span-2">Delivery Date</div>
            <div class="col-span-2">Status</div>
            <div class="col-span-2">Total Weight</div>
            <div class="col-span-2">Packer</div>
            <div class="col-span-1">Actions</div>
          </div>
        </div>

        <!-- Table Body -->
        <div class="divide-y divide-gray-200">
          <div v-for="order in orders" :key="order._id"
            class="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div class="grid grid-cols-12 gap-4 items-center">
              <!-- Pantry -->
              <div class="col-span-3">
                <div class="font-medium text-gray-900">{{ order.pantryId?.name || 'Unknown Pantry' }}</div>
                <div class="text-sm text-gray-500">{{ order.products?.length || 0 }} products</div>
              </div>

              <!-- Delivery Date -->
              <div class="col-span-2">
                <div class="text-sm text-gray-900">{{ formatDate(order.deliveryDate) }}</div>
                <div class="text-xs text-gray-500">
                  <span v-if="order.pickupTime">{{ formatPickupTime(order.pickupTime) }} • </span>
                  <span class="capitalize">{{ order.orderType }}</span>
                </div>
              </div>

              <!-- Status -->
              <div class="col-span-2">
                <select v-model="order.status" @change="updateOrderStatus(order)"
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-garden-green-500',
                    getStatusClass(order.status)
                  ]">
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <!-- Total Weight -->
              <div class="col-span-2">
                <div class="text-sm font-medium text-gray-900">{{ order.totalWeight?.toFixed(1) || '0.0' }} lbs</div>
                <div class="text-xs text-gray-500">${{ order.totalValue?.toFixed(2) || '0.00' }}</div>
              </div>

              <!-- Packer -->
              <div class="col-span-2">
                <div class="text-sm text-gray-900">{{ order.packerName }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(order.createdAt) }}</div>
              </div>

              <!-- Actions -->
              <div class="col-span-1">
                <div class="flex space-x-1">
                  <button @click="editOrder(order)"
                    class="text-blue-400 hover:text-blue-600 p-1"
                    title="Edit Order">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button @click="viewOrder(order)"
                    class="text-gray-400 hover:text-gray-600 p-1"
                    title="View Details">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                  <button @click="deleteOrder(order)"
                    class="text-red-400 hover:text-red-600 p-1"
                    title="Delete Order">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Expandable Details -->
            <div v-if="selectedOrder?._id === order._id" class="mt-4 pt-4 border-t border-gray-200">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Order Info -->
                <div>
                  <h4 class="font-medium text-gray-900 mb-3">Order Information</h4>
                  <dl class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <dt class="text-gray-500">Order ID:</dt>
                      <dd class="text-gray-900 font-mono">{{ order._id }}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-gray-500">Created by:</dt>
                      <dd class="text-gray-900">{{ order.createdBy?.email || 'Unknown' }}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-gray-500">Created:</dt>
                      <dd class="text-gray-900">{{ formatDateTime(order.createdAt) }}</dd>
                    </div>
                    <div v-if="order.notes" class="pt-2">
                      <dt class="text-gray-500 mb-1">Notes:</dt>
                      <dd class="text-gray-900">{{ order.notes }}</dd>
                    </div>
                  </dl>
                </div>

                <!-- Products -->
                <div>
                  <h4 class="font-medium text-gray-900 mb-3">Products ({{ order.products?.length || 0 }})</h4>
                  <div class="space-y-2">
                    <div v-for="product in order.products" :key="product.produceTypeId"
                      class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <div>
                        <div class="font-medium text-gray-900">{{ getProduceName(product) }}</div>
                        <div v-if="product.quantity > 0" class="text-xs text-gray-500">Qty: {{ product.quantity }}</div>
                      </div>
                      <div class="text-right">
                        <div class="font-medium text-gray-900">{{ product.weight?.toFixed(1) || '0.0' }} lbs</div>
                        <div class="text-xs text-gray-500">${{ product.value?.toFixed(2) || '0.00' }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-700">
            Showing {{ (pagination.current - 1) * pagination.limit + 1 }} to 
            {{ Math.min(pagination.current * pagination.limit, pagination.total) }} of 
            {{ pagination.total }} results
          </div>
          <div class="flex space-x-2">
            <button @click="changePage(pagination.current - 1)" :disabled="!pagination.hasPrev"
              class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
              Previous
            </button>
            <button @click="changePage(pagination.current + 1)" :disabled="!pagination.hasNext"
              class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Edit Modal -->
    <OrderEditModal
      :show="showEditModal"
      :order="selectedOrderForEdit"
      :pantries="pantries"
      :produce-types="produceTypes"
      @close="closeEditModal"
      @saved="handleOrderSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import OrderEditModal from './OrderEditModal.vue'

// State
const orders = ref<any[]>([])
const pantries = ref<any[]>([])
const produceTypes = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedOrder = ref<any>(null)
const showEditModal = ref(false)
const selectedOrderForEdit = ref<any>(null)

const filters = ref({
  status: '',
  pantryId: '',
  startDate: '',
  endDate: ''
})

const pagination = ref({
  current: 1,
  pages: 1,
  total: 0,
  limit: 20,
  hasNext: false,
  hasPrev: false
})

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/.netlify/functions'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Methods
const fetchOrders = async (page = 1) => {
  loading.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pagination.value.limit.toString(),
      sortBy: 'deliveryDate',
      sortOrder: 'desc'
    })
    
    if (filters.value.status) params.append('status', filters.value.status)
    if (filters.value.pantryId) params.append('pantryId', filters.value.pantryId)
    if (filters.value.startDate) params.append('startDate', filters.value.startDate)
    if (filters.value.endDate) params.append('endDate', filters.value.endDate)
    
    const response = await fetch(`${API_BASE}/orders?${params}`, {
      headers: getAuthHeader()
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch orders')
    }
    
    orders.value = result.data.orders || []
    pagination.value = result.data.pagination || pagination.value
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch orders'
    orders.value = []
  } finally {
    loading.value = false
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

const updateOrderStatus = async (order: any) => {
  try {
    const response = await fetch(`${API_BASE}/orders?id=${order._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status: order.status })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update order')
    }
    
    // Refresh orders to get latest data
    await fetchOrders(pagination.value.current)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update order'
  }
}

const editOrder = (order: any) => {
  selectedOrderForEdit.value = order
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedOrderForEdit.value = null
}

const handleOrderSaved = () => {
  fetchOrders(pagination.value.current)
}

const viewOrder = (order: any) => {
  selectedOrder.value = selectedOrder.value?._id === order._id ? null : order
}

const deleteOrder = async (order: any) => {
  if (!confirm(`Are you sure you want to delete the order for ${order.pantryId?.name}?`)) {
    return
  }
  
  try {
    const response = await fetch(`${API_BASE}/orders?id=${order._id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete order')
    }
    
    // Refresh orders
    await fetchOrders(pagination.value.current)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete order'
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.value.pages) {
    fetchOrders(page)
  }
}

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatPickupTime = (timeString: string) => {
  if (!timeString) return ''
  
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  
  return `${hour12}:${minutes} ${ampm}`
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'ready':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getProduceName = (product: any) => {
  // First try to use the populated produceType
  if (product.produceType?.name) {
    return product.produceType.name
  }
  
  // Fallback to lookup by ID
  const produceTypeId = product.produceTypeId || product.produce_type_id
  const produceType = produceTypes.value.find(pt => (pt.id || pt._id) === produceTypeId)
  return produceType?.name || 'Unknown Product'
}

onMounted(async () => {
  await Promise.all([
    fetchOrders(),
    fetchPantries(),
    fetchProduceTypes()
  ])
})
</script>