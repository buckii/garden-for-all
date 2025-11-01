<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 font-poppins">Commitment Calendar</h1>
        <p class="text-gray-600 mt-2">View weekly commitments across the month</p>
      </div>

      <!-- Calendar Component -->
      <CommitmentCalendar />

      <!-- Pantry Progress Section -->
      <div class="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Pantry Progress</h2>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ error }}
        </div>

        <!-- Progress List -->
        <div v-else-if="pantryProgress.length > 0" class="space-y-6">
          <div v-for="pantry in pantryProgress" :key="pantry.pantryId" class="border-b pb-6 last:border-b-0">
            <!-- Pantry Header -->
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-800">{{ pantry.pantryName }}</h3>
              <div class="text-sm text-gray-500">
                {{ pantry.hasPlans ? `${pantry.totalPlanned.toFixed(1)} lbs planned` : 'No plans' }}
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-3">
              <!-- Total Progress -->
              <div class="flex items-center">
                <div class="w-24 text-sm text-gray-700 font-medium text-right pr-3">
                  Total
                </div>
                <div class="flex-1 flex items-center">
                  <div class="flex-1 bg-gray-200 rounded-full h-6 relative mr-3">
                    <div
                      :class="[
                        'h-6 rounded-full transition-all duration-500 ease-out relative',
                        getProgressBarColor(pantry.totalDelivered, pantry.totalPlanned)
                      ]"
                      :style="{ width: `${getProgressPercentage(pantry.totalDelivered, pantry.totalPlanned)}%` }">
                      <span
                        v-if="getProgressPercentage(pantry.totalDelivered, pantry.totalPlanned) > 20"
                        class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {{ getProgressPercentage(pantry.totalDelivered, pantry.totalPlanned).toFixed(0) }}%
                      </span>
                    </div>
                    <span
                      v-if="getProgressPercentage(pantry.totalDelivered, pantry.totalPlanned) <= 20"
                      class="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600">
                      {{ getProgressPercentage(pantry.totalDelivered, pantry.totalPlanned).toFixed(0) }}%
                    </span>
                  </div>
                  <div class="w-24 text-sm text-gray-600 text-right">
                    {{ pantry.totalDelivered.toFixed(1) }} / {{ pantry.totalPlanned.toFixed(1) }} lbs
                  </div>
                </div>
              </div>

              <!-- Plan Breakdown -->
              <div v-if="pantry.plans.length > 0" class="ml-24 space-y-2">
                <div v-for="plan in pantry.plans" :key="plan.commitmentId" class="text-sm text-gray-600">
                  <span class="font-medium">{{ plan.description }}</span>:
                  {{ plan.delivered.toFixed(1) }} / {{ plan.planned.toFixed(1) }} lbs
                  <span :class="getPlanStatusClass(plan.delivered, plan.planned)" class="ml-2">
                    ({{ getProgressPercentage(plan.delivered, plan.planned).toFixed(0) }}%)
                  </span>
                </div>
              </div>

              <!-- Orders without plans -->
              <div v-if="!pantry.hasPlans && pantry.totalDelivered > 0" class="ml-24 text-sm text-gray-600">
                {{ pantry.totalDelivered.toFixed(1) }} lbs delivered (no active plans)
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="mt-4 text-gray-500">No pantry data found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import CommitmentCalendar from '@/components/dashboard/CommitmentCalendar.vue'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const loading = ref(true)
const error = ref<string | null>(null)
const pantryProgress = ref<any[]>([])

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const fetchPantryProgress = async () => {
  loading.value = true
  error.value = null

  try {
    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const startDate = startOfMonth.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const endDate = endOfMonth.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    // Fetch commitments and orders for the month
    const [commitmentsResponse, ordersResponse, pantriesResponse] = await Promise.all([
      fetch(`${API_BASE}/commitments?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeader()
      }),
      fetch(`${API_BASE}/orders?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeader()
      }),
      fetch(`${API_BASE}/pantries`, {
        headers: getAuthHeader()
      })
    ])

    if (!commitmentsResponse.ok || !ordersResponse.ok || !pantriesResponse.ok) {
      throw new Error('Failed to fetch data')
    }

    const commitmentsData = await commitmentsResponse.json()
    const ordersData = await ordersResponse.json()
    const pantriesData = await pantriesResponse.json()

    const commitments = commitmentsData.data || []
    const orders = ordersData.data?.orders || []
    const pantries = pantriesData.data || []

    // Build pantry progress map
    const progressMap = new Map()

    // Initialize with all pantries that have commitments or orders
    const pantryIds = new Set([
      ...commitments.map((c: any) => c.pantryId?._id || c.pantryId),
      ...orders.map((o: any) => o.pantryId?._id || o.pantryId)
    ])

    pantryIds.forEach(pantryId => {
      if (!pantryId) return

      const pantry = pantries.find((p: any) => p._id === pantryId)
      const pantryCommitments = commitments.filter((c: any) =>
        (c.pantryId?._id || c.pantryId) === pantryId
      )
      const pantryOrders = orders.filter((o: any) =>
        (o.pantryId?._id || o.pantryId) === pantryId &&
        ['delivered', 'completed'].includes(o.status?.toLowerCase())
      )

      // Calculate total planned weight from commitments
      let totalPlanned = 0
      const plans: any[] = []

      pantryCommitments.forEach((commitment: any) => {
        const daysOfWeek = commitment.daysOfWeek || []
        const dailyWeight = commitment.dailyWeightLbs || 0

        // Calculate number of delivery days in the month
        const deliveryDays = countDeliveryDays(startOfMonth, endOfMonth,
          new Date(commitment.weekStartDate),
          new Date(commitment.endDate),
          daysOfWeek)

        const plannedWeight = dailyWeight * deliveryDays
        totalPlanned += plannedWeight

        plans.push({
          commitmentId: commitment._id,
          description: getCommitmentDescription(commitment),
          planned: plannedWeight,
          delivered: 0 // Will calculate from orders
        })
      })

      // Calculate total delivered weight from orders
      const totalDelivered = pantryOrders.reduce((sum: number, order: any) =>
        sum + (order.totalWeight || 0), 0
      )

      // Match delivered weight to plans (simplified - just distribute evenly for now)
      plans.forEach(plan => {
        plan.delivered = plans.length > 0 ? totalDelivered / plans.length : 0
      })

      progressMap.set(pantryId, {
        pantryId,
        pantryName: pantry?.name || 'Unknown Pantry',
        hasPlans: pantryCommitments.length > 0,
        totalPlanned,
        totalDelivered,
        plans
      })
    })

    pantryProgress.value = Array.from(progressMap.values())
      .sort((a, b) => b.totalPlanned - a.totalPlanned)

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load pantry progress'
  } finally {
    loading.value = false
  }
}

const countDeliveryDays = (
  monthStart: Date,
  monthEnd: Date,
  commitmentStart: Date,
  commitmentEnd: Date,
  daysOfWeek: number[]
): number => {
  let count = 0
  const start = commitmentStart > monthStart ? commitmentStart : monthStart
  const end = commitmentEnd < monthEnd ? commitmentEnd : monthEnd

  const currentDate = new Date(start)
  while (currentDate <= end) {
    if (daysOfWeek.includes(currentDate.getDay())) {
      count++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return count
}

const getCommitmentDescription = (commitment: any) => {
  if (commitment.commitmentType === 'total') {
    return `${commitment.dailyWeightLbs}lb of Any Produce`
  } else if (commitment.commitmentType === 'produce_type' && commitment.produceTypeId?.name) {
    return commitment.produceTypeId.name
  } else if (commitment.commitmentType === 'category' && commitment.categoryId?.name) {
    return `${commitment.categoryId.name} (category)`
  }
  return 'Unknown Type'
}

const getProgressPercentage = (delivered: number, planned: number) => {
  if (planned === 0) return 0
  return Math.min((delivered / planned) * 100, 100)
}

const getProgressBarColor = (delivered: number, planned: number) => {
  const percentage = getProgressPercentage(delivered, planned)
  if (percentage >= 90) return 'bg-green-500'
  if (percentage >= 70) return 'bg-blue-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-orange-500'
}

const getPlanStatusClass = (delivered: number, planned: number) => {
  const percentage = getProgressPercentage(delivered, planned)
  if (percentage >= 90) return 'text-green-600 font-medium'
  if (percentage >= 70) return 'text-blue-600'
  if (percentage >= 50) return 'text-yellow-600'
  return 'text-orange-600'
}

onMounted(() => {
  fetchPantryProgress()
})
</script>
