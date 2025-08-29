<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2 font-poppins">Today</h1>
        <p class="text-gray-600">Today's harvests and upcoming orders</p>
      </div>

      <!-- Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column: Today's Harvest -->
        <div>
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Today's Harvest</h2>
          </div>
          
          <HarvestHistory
            :todays-entries="todaysEntries"
            :produce-types="produceTypes"
            :loading="harvestLoading"
            @edit="handleEditEntry"
            @delete="handleDeleteEntry"
            @add-another="handleAddAnother"
            @refresh="refreshData"
          />
        </div>

        <!-- Right Column: Orders -->
        <div>
          <div class="mb-4 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Upcoming Orders</h2>
            <router-link to="/admin?tab=orders" 
              class="text-sm text-garden-green-600 hover:text-garden-green-700">
              View All Orders →
            </router-link>
          </div>

          <!-- Orders Loading State -->
          <div v-if="ordersLoading" class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex justify-center items-center py-8">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600 mx-auto mb-3"></div>
                <p class="text-gray-500 text-sm">Loading orders...</p>
              </div>
            </div>
          </div>

          <!-- Orders Error State -->
          <div v-else-if="ordersError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ ordersError }}
          </div>

          <!-- Orders List -->
          <div v-else class="space-y-4">
            <div v-if="upcomingOrders.length === 0" class="bg-white rounded-lg shadow-sm border p-6">
              <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p class="mt-4 text-gray-500">No upcoming orders</p>
                <router-link to="/order"
                  class="mt-2 inline-block text-garden-green-600 hover:text-garden-green-700">
                  Create New Order
                </router-link>
              </div>
            </div>

            <!-- Order Cards -->
            <div v-else v-for="order in upcomingOrders" :key="order._id"
              class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              
              <!-- Order Header -->
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h3 class="font-semibold text-gray-900">{{ order.pantryId?.name || 'Unknown Pantry' }}</h3>
                  <div class="flex items-center mt-1 space-x-3 text-sm text-gray-500">
                    <span>{{ formatDate(order.deliveryDate) }}</span>
                    <span v-if="order.pickupTime">• {{ formatPickupTime(order.pickupTime) }}</span>
                    <span class="capitalize">• {{ order.orderType }}</span>
                  </div>
                </div>
                <span :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  getStatusClass(order.status)
                ]">
                  {{ order.status }}
                </span>
              </div>

              <!-- Order Details -->
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Products:</span>
                  <span class="font-medium">{{ order.products?.length || 0 }} items</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Total Weight:</span>
                  <span class="font-medium">{{ order.totalWeight?.toFixed(1) || '0.0' }} lbs</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Packer:</span>
                  <span class="font-medium">{{ order.packerName }}</span>
                </div>
              </div>

              <!-- Order Products (Expandable) -->
              <div v-if="expandedOrder === order._id" class="mt-3 pt-3 border-t border-gray-200">
                <div class="space-y-1">
                  <div v-for="product in order.products" :key="product.produceTypeId"
                    class="flex justify-between text-sm">
                    <span class="text-gray-600">{{ getProduceName(product) }}</span>
                    <span class="font-medium">{{ product.weight?.toFixed(1) || '0.0' }} lbs</span>
                  </div>
                </div>
                <div v-if="order.notes" class="mt-2 text-sm text-gray-600">
                  <span class="font-medium">Notes:</span> {{ order.notes }}
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="mt-3 flex justify-between items-center">
                <button @click="toggleOrderExpansion(order._id)"
                  class="text-sm text-garden-green-600 hover:text-garden-green-700">
                  {{ expandedOrder === order._id ? 'Show Less' : 'Show Details' }}
                </button>
                <button @click="editOrder(order)"
                  class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                  Edit
                </button>
              </div>
            </div>
            <!-- New Order Button -->
            <div class="mt-6">
              <router-link to="/order"
                class="block w-full text-center py-4 px-6 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 transition-colors text-lg font-medium min-h-[60px] flex items-center justify-center space-x-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>New Order</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Edit Modal -->
    <OrderEditModal
      :show="showEditModal"
      :order="selectedOrderForEdit"
      :pantries="adminPantries"
      :produce-types="produceTypes"
      @close="closeEditModal"
      @saved="handleOrderSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useHarvestStore } from '@/stores/harvest'
import { useAdminStore } from '@/stores/admin'
import { usePusher } from '@/composables/usePusher'
import AppHeader from '@/components/layout/AppHeader.vue'
import HarvestHistory from '@/components/harvest/HarvestHistory.vue'
import OrderEditModal from '@/components/admin/OrderEditModal.vue'

type HarvestEntry = Database['public']['Tables']['harvest_entries']['Row']

const router = useRouter()
const harvestStore = useHarvestStore()
const adminStore = useAdminStore()
const { subscribeToHarvestUpdates } = usePusher()

// Access stores through computed properties to ensure reactivity
const todaysEntries = computed(() => harvestStore.todaysEntries)
const produceTypes = computed(() => harvestStore.produceTypes)
const harvestLoading = computed(() => harvestStore.loading)
const adminLoading = computed(() => adminStore.loading)
const adminPantries = computed(() => adminStore.foodPantries)

// Orders state
const upcomingOrders = ref<any[]>([])
const ordersLoading = ref(false)
const ordersError = ref<string | null>(null)
const expandedOrder = ref<string | null>(null)
const showEditModal = ref(false)
const selectedOrderForEdit = ref<any>(null)

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/.netlify/functions'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Fetch upcoming orders (today and future)
const fetchUpcomingOrders = async () => {
  ordersLoading.value = true
  ordersError.value = null
  
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const params = new URLSearchParams({
      startDate: today.toISOString().split('T')[0],
      sortBy: 'deliveryDate',
      sortOrder: 'asc',
      limit: '50'
    })
    
    const response = await fetch(`${API_BASE}/orders?${params}`, {
      headers: getAuthHeader()
    })
    
    if (!response.ok) {
      // If not authenticated, just show no orders
      if (response.status === 401) {
        upcomingOrders.value = []
        return
      }
      throw new Error('Failed to fetch orders')
    }
    
    const result = await response.json()
    upcomingOrders.value = result.data?.orders || []
    
  } catch (err) {
    ordersError.value = err instanceof Error ? err.message : 'Failed to fetch orders'
    upcomingOrders.value = []
  } finally {
    ordersLoading.value = false
  }
}

const toggleOrderExpansion = (orderId: string) => {
  expandedOrder.value = expandedOrder.value === orderId ? null : orderId
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const orderDate = new Date(dateString)
  orderDate.setHours(0, 0, 0, 0)
  
  if (orderDate.getTime() === today.getTime()) {
    return 'Today'
  }
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (orderDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow'
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
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

const getStatusClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'packed':
      return 'bg-blue-100 text-blue-800'
    case 'delivered':
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
  // Wait for the next tick to ensure all reactive connections are established
  await nextTick()
  
  await Promise.all([
    harvestStore.fetchProduceTypes(),
    adminStore.fetchCategories(),
    adminStore.fetchFoodPantries(),
    harvestStore.fetchTodaysHarvest(),
    harvestStore.fetchRecentEntries(),
    fetchUpcomingOrders()
  ])

  // Subscribe to real-time updates
  subscribeToHarvestUpdates((data) => {
    harvestStore.fetchTodaysHarvest()
    harvestStore.fetchRecentEntries()
    fetchUpcomingOrders()
  })
})

const handleEditEntry = (entry: HarvestEntry) => {
  // TODO: Implement edit functionality
  console.log('Edit entry:', entry)
}

const handleDeleteEntry = async (entry: HarvestEntry) => {
  try {
    await harvestStore.deleteHarvestEntry(entry.id)
  } catch (error) {
    console.error('Failed to delete entry:', error)
  }
}

const handleAddAnother = () => {
  router.push('/harvest')
}

const refreshData = async () => {
  await Promise.all([
    harvestStore.fetchTodaysHarvest(),
    harvestStore.fetchRecentEntries(),
    fetchUpcomingOrders()
  ])
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
  fetchUpcomingOrders()
}

</script>