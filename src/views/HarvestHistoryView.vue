<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2 font-poppins">Today</h1>
        <p class="text-gray-600">Today's harvests and upcoming orders</p>
      </div>

      <!-- Three Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Today's Harvest -->
        <div>
          <div class="mb-4 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Today's Harvest</h2>
            <router-link to="/harvest"
              class="px-3 py-1.5 bg-garden-green-600 text-white text-sm rounded-lg hover:bg-garden-green-700 transition-colors">
              + Add Harvest
            </router-link>
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

          <!-- View All Harvest Entries Link -->
          <div class="mt-4 text-center">
            <router-link to="/harvest-history"
              class="text-garden-green-600 hover:text-garden-green-700 text-sm font-medium">
              View All Harvest Entries →
            </router-link>
          </div>
        </div>

        <!-- Middle Column: Available Inventory -->
        <div>
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Available Inventory</h2>
            <p class="text-sm text-gray-500">Harvested but not allocated to orders</p>
          </div>
          
          <!-- Inventory Loading State -->
          <div v-if="inventoryLoading" class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex justify-center items-center py-8">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600 mx-auto mb-3"></div>
                <p class="text-gray-500 text-sm">Loading inventory...</p>
              </div>
            </div>
          </div>

          <!-- Inventory Error State -->
          <div v-else-if="inventoryError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ inventoryError }}
          </div>

          <!-- Inventory List -->
          <div v-else class="space-y-3">
            <div v-if="unallocatedInventory.length === 0" class="bg-white rounded-lg shadow-sm border p-6">
              <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M9 4V3a1 1 0 00-1-1H4a1 1 0 00-1 1v1" />
                </svg>
                <p class="mt-4 text-gray-500">All harvests are allocated</p>
                <p class="text-xs text-gray-400 mt-1">Great job! Everything is organized.</p>
              </div>
            </div>

            <!-- Inventory Items -->
            <div v-else v-for="item in unallocatedInventory" :key="`${item.produceType}-${item.harvestDate}`"
              class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              
              <!-- Item Header -->
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="font-semibold text-gray-900">{{ item.produceType }}</h3>
                  <div class="text-sm text-gray-500">
                    Harvested {{ formatInventoryDate(item.harvestDate) }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-garden-green-600">{{ item.totalWeight.toFixed(1) }} lbs</div>
                  <div v-if="item.totalValue > 0" class="text-xs text-gray-500">${{ item.totalValue.toFixed(2) }}</div>
                </div>
              </div>

              <!-- Item Details -->
              <div v-if="item.pantries.length > 1" class="mt-3 pt-3 border-t border-gray-200">
                <div class="text-xs text-gray-500 mb-2">Distribution:</div>
                <div class="space-y-1">
                  <div v-for="pantry in item.pantries" :key="pantry.name"
                    class="flex justify-between text-sm">
                    <span class="text-gray-600">{{ pantry.name }}</span>
                    <span class="font-medium">{{ pantry.weight.toFixed(1) }} lbs</span>
                  </div>
                </div>
              </div>
              <div v-else-if="item.pantries.length === 1" class="mt-1">
                <div class="text-xs text-gray-500">
                  For {{ item.pantries[0].name }}
                </div>
              </div>

              <!-- Age indicator -->
              <div v-if="item.daysOld > 0" class="mt-2">
                <div :class="[
                  'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                  item.daysOld <= 1 ? 'bg-green-100 text-green-800' :
                  item.daysOld <= 3 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                ]">
                  {{ item.daysOld === 0 ? 'Today' : 
                     item.daysOld === 1 ? '1 day old' : 
                     `${item.daysOld} days old` }}
                </div>
              </div>
            </div>

            <!-- Create Order Button -->
            <div v-if="unallocatedInventory.length > 0" class="mt-6">
              <router-link to="/order"
                class="block w-full text-center py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                📦 Create Order from Inventory
              </router-link>
            </div>
          </div>
        </div>

        <!-- Right Column: Today's Plans & Orders -->
        <div>
          <div class="mb-4 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Today's Plans & Orders</h2>
            <router-link to="/order"
              class="px-3 py-1.5 bg-garden-green-600 text-white text-sm rounded-lg hover:bg-garden-green-700 transition-colors">
              + New Order
            </router-link>
          </div>

          <!-- Loading State -->
          <div v-if="ordersLoading" class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex justify-center items-center py-8">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600 mx-auto mb-3"></div>
                <p class="text-gray-500 text-sm">Loading...</p>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="ordersError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ ordersError }}
          </div>

          <!-- Content -->
          <div v-else class="space-y-6">
            <!-- Today's Plans Section -->
            <div v-if="todaysPlans.length > 0">
              <h3 class="text-sm font-semibold text-gray-700 mb-3">📅 Today's Plans</h3>
              <div class="space-y-3">
                <div v-for="pantryGroup in groupedPlansByPantry" :key="pantryGroup.pantryId"
                  class="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                      <h4 class="font-semibold text-gray-900 mb-2">{{ pantryGroup.pantryName }}</h4>
                      <ul class="space-y-1">
                        <li v-for="plan in pantryGroup.plans" :key="plan._id" class="text-sm text-gray-600">
                          • {{ getCommitmentDescription(plan) }}
                        </li>
                      </ul>
                    </div>
                    <div class="text-right ml-4">
                      <div class="text-lg font-bold text-blue-600">{{ pantryGroup.totalWeight }} lbs</div>
                      <div class="text-xs text-gray-500">{{ formatDaysOfWeek(pantryGroup.plans[0].daysOfWeek) }}</div>
                    </div>
                  </div>
                  <button
                    @click="$router.push({ path: '/order', query: { pantryId: pantryGroup.pantryId } })"
                    class="w-full mt-2 px-4 py-2 bg-garden-green-600 text-white text-sm rounded-lg hover:bg-garden-green-700 transition-colors">
                    Create Order from Plan
                  </button>
                </div>
              </div>
            </div>

            <!-- Incomplete Orders Section -->
            <div v-if="incompleteOrders.length > 0">
              <h3 class="text-sm font-semibold text-gray-700 mb-3">🚧 In Progress</h3>
              <div class="space-y-3">
                <div v-for="order in incompleteOrders" :key="order._id"
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
              </div>
            </div>

            <!-- Complete Orders Section -->
            <div v-if="completeOrders.length > 0">
              <h3 class="text-sm font-semibold text-gray-700 mb-3">✅ Complete</h3>
              <div class="space-y-3">
                <div v-for="order in completeOrders" :key="order._id"
                  class="bg-white rounded-lg shadow-sm border p-4 relative opacity-75 hover:opacity-90 transition-opacity">
                  <!-- Gray Overlay Effect -->
                  <div class="absolute inset-0 bg-gray-100 opacity-40 rounded-lg pointer-events-none"></div>

                  <!-- Order Content (relative to appear above overlay) -->
                  <div class="relative">
                    <!-- Order Header -->
                    <div class="flex justify-between items-start mb-3">
                      <div>
                        <h4 class="font-semibold text-gray-900">{{ order.pantryId?.name || 'Unknown Pantry' }}</h4>
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
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="todaysPlans.length === 0 && todaysOrders.length === 0" class="bg-white rounded-lg shadow-sm border p-6">
              <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p class="mt-4 text-gray-500">No plans or orders for today</p>
                <router-link to="/order"
                  class="mt-2 inline-block text-garden-green-600 hover:text-garden-green-700">
                  Create New Order
                </router-link>
              </div>
            </div>

            <!-- View All Orders Link -->
            <div class="mt-6 text-center">
              <router-link to="/admin?tab=orders"
                class="text-garden-green-600 hover:text-garden-green-700 text-sm font-medium">
                View All Orders →
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

// Plans and Orders state
const todaysPlans = ref<any[]>([])
const todaysOrders = ref<any[]>([])
const ordersLoading = ref(false)
const ordersError = ref<string | null>(null)
const expandedOrder = ref<string | null>(null)
const showEditModal = ref(false)
const selectedOrderForEdit = ref<any>(null)

// Inventory state
const unallocatedInventory = ref<any[]>([])
const inventoryLoading = ref(false)
const inventoryError = ref<string | null>(null)

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Computed properties to separate orders
const incompleteOrders = computed(() => {
  return todaysOrders.value.filter(order =>
    ['pending', 'packed', 'draft', 'in-progress'].includes(order.status?.toLowerCase())
  )
})

const completeOrders = computed(() => {
  return todaysOrders.value.filter(order =>
    ['delivered', 'completed', 'cancelled'].includes(order.status?.toLowerCase())
  )
})

// Group plans by pantry
const groupedPlansByPantry = computed(() => {
  const groups = new Map()

  todaysPlans.value.forEach(plan => {
    const pantryId = plan.pantryId?._id || plan.pantryId
    const pantryName = plan.pantryId?.name || 'Unknown Pantry'

    if (!groups.has(pantryId)) {
      groups.set(pantryId, {
        pantryId,
        pantryName,
        totalWeight: 0,
        plans: []
      })
    }

    const group = groups.get(pantryId)
    group.totalWeight += plan.dailyWeightLbs || 0
    group.plans.push(plan)
  })

  return Array.from(groups.values())
})

// Fetch today's plans (commitments)
const fetchTodaysPlans = async () => {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    const params = new URLSearchParams({
      startDate: today,
      endDate: today
    })

    const response = await fetch(`${API_BASE}/commitments?${params}`, {
      headers: getAuthHeader()
    })

    if (!response.ok) {
      if (response.status === 401) {
        todaysPlans.value = []
        return
      }
      throw new Error('Failed to fetch plans')
    }

    const result = await response.json()
    todaysPlans.value = result.data || []

  } catch (err) {
    console.error('Error fetching plans:', err)
    todaysPlans.value = []
  }
}

// Fetch today's orders only
const fetchTodaysOrders = async () => {
  ordersLoading.value = true
  ordersError.value = null

  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    const params = new URLSearchParams({
      startDate: today,
      endDate: today,
      sortBy: 'status',
      sortOrder: 'asc',
      limit: '50'
    })

    const response = await fetch(`${API_BASE}/orders?${params}`, {
      headers: getAuthHeader()
    })

    if (!response.ok) {
      if (response.status === 401) {
        todaysOrders.value = []
        return
      }
      throw new Error('Failed to fetch orders')
    }

    const result = await response.json()
    todaysOrders.value = result.data?.orders || []

  } catch (err) {
    ordersError.value = err instanceof Error ? err.message : 'Failed to fetch orders'
    todaysOrders.value = []
  } finally {
    ordersLoading.value = false
  }
}

// Fetch unallocated inventory using the dedicated endpoint
const fetchUnallocatedInventory = async () => {
  inventoryLoading.value = true
  inventoryError.value = null
  
  try {
    const params = new URLSearchParams({
      days: '14' // Get inventory for last 14 days
    })
    
    const response = await fetch(`${API_BASE}/available-inventory?${params}`, {
      headers: getAuthHeader()
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, show empty inventory
        unallocatedInventory.value = []
        return
      }
      throw new Error('Failed to fetch available inventory')
    }
    
    const result = await response.json()
    unallocatedInventory.value = result.data?.items || []
    
  } catch (err) {
    inventoryError.value = err instanceof Error ? err.message : 'Failed to fetch inventory'
    unallocatedInventory.value = []
  } finally {
    inventoryLoading.value = false
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

const formatInventoryDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const itemDate = new Date(dateString)
  itemDate.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - itemDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays <= 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const getCommitmentDescription = (plan: any) => {
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

const formatDaysOfWeek = (days: number[]) => {
  if (!days || days.length === 0) return ''
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days.map(d => dayNames[d]).join(', ')
}

onMounted(async () => {
  // Wait for the next tick to ensure all reactive connections are established
  await nextTick()

  await Promise.all([
    harvestStore.fetchProduceTypes(),
    adminStore.fetchCategories(),
    adminStore.fetchFoodPantries(),
    harvestStore.fetchTodaysHarvest(), // Fetch only today's harvest entries
    fetchTodaysPlans(),
    fetchTodaysOrders(),
    fetchUnallocatedInventory()
  ])

  // Subscribe to real-time updates
  subscribeToHarvestUpdates((data) => {
    harvestStore.fetchTodaysHarvest()
    fetchTodaysPlans()
    fetchTodaysOrders()
    fetchUnallocatedInventory()
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
    fetchTodaysPlans(),
    fetchTodaysOrders(),
    fetchUnallocatedInventory()
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
  fetchTodaysOrders()
}

</script>