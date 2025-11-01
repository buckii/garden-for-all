<template>
  <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Weekly Commitment Progress</h3>
      <div class="text-sm text-gray-500">
        Last Week vs This Week
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
    </div>

    <div v-else-if="pantryCommitmentData.length === 0" class="text-center py-8">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <p class="mt-4 text-sm text-gray-500">No weekly commitments found</p>
    </div>

    <div v-else class="space-y-8">
      <!-- Loop through each pantry -->
      <div v-for="pantryData in pantryCommitmentData" :key="pantryData.pantryId" class="border-b pb-6 last:border-b-0">
        <!-- Pantry Header -->
        <h4 class="text-md font-semibold text-gray-800 mb-4">{{ pantryData.pantryName }}</h4>

        <!-- Horizontal Bar Chart -->
        <div class="bg-white border rounded-lg p-4">
          <h5 class="font-medium text-gray-900 mb-4 text-sm">This Week Progress Overview</h5>
        <div class="space-y-3">
          <div v-for="item in pantryData.commitments" :key="item.produceType" class="flex items-center">
            <!-- Produce type label -->
            <div class="w-24 text-sm text-gray-700 font-medium text-right pr-3">
              {{ item.produceType }}
            </div>
            
            <!-- Progress bar container -->
            <div class="flex-1 flex items-center">
              <div class="flex-1 bg-gray-200 rounded-full h-6 relative mr-3">
                <!-- Progress bar fill -->
                <div 
                  :class="[
                    'h-6 rounded-full transition-all duration-500 ease-out relative',
                    getProgressBarColor(item.thisWeek.delivered, item.weeklyWeight)
                  ]"
                  :style="{ width: `${Math.min((item.thisWeek.delivered / item.weeklyWeight) * 100, 100)}%` }"
                >
                  <!-- Progress text inside bar if there's space -->
                  <span 
                    v-if="(item.thisWeek.delivered / item.weeklyWeight) * 100 > 20"
                    class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white"
                  >
                    {{ ((item.thisWeek.delivered / item.weeklyWeight) * 100).toFixed(0) }}%
                  </span>
                </div>
                
                <!-- Progress text outside bar if not enough space -->
                <span 
                  v-if="(item.thisWeek.delivered / item.weeklyWeight) * 100 <= 20"
                  class="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600"
                >
                  {{ ((item.thisWeek.delivered / item.weeklyWeight) * 100).toFixed(0) }}%
                </span>
              </div>
              
              <!-- Target weight on the right -->
              <div class="w-16 text-sm text-gray-600 text-right">
                {{ item.weeklyWeight }}lb
              </div>
            </div>
          </div>
        </div>
        
        <!-- Total Weight Bar -->
        <div v-if="totalDeliveryData.thisWeek" class="border-t pt-3 mt-3">
          <div class="flex items-center">
            <!-- Total label -->
            <div class="w-24 text-sm text-gray-900 font-bold text-right pr-3">
              Total
            </div>
            
            <!-- Progress bar container -->
            <div class="flex-1 flex items-center">
              <div class="flex-1 bg-gray-200 rounded-full h-6 relative mr-3">
                <!-- Progress bar fill -->
                <div 
                  :class="[
                    'h-6 rounded-full transition-all duration-500 ease-out relative',
                    getProgressBarColor(totalDeliveryData.thisWeek.total, totalWeeklyTarget)
                  ]"
                  :style="{ width: `${Math.min((totalDeliveryData.thisWeek.total / totalWeeklyTarget) * 100, 100)}%` }"
                >
                  <!-- Progress text inside bar if there's space -->
                  <span 
                    v-if="(totalDeliveryData.thisWeek.total / totalWeeklyTarget) * 100 > 20"
                    class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white"
                  >
                    {{ ((totalDeliveryData.thisWeek.total / totalWeeklyTarget) * 100).toFixed(0) }}%
                  </span>
                </div>
                
                <!-- Progress text outside bar if not enough space -->
                <span 
                  v-if="(totalDeliveryData.thisWeek.total / totalWeeklyTarget) * 100 <= 20"
                  class="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600"
                >
                  {{ ((totalDeliveryData.thisWeek.total / totalWeeklyTarget) * 100).toFixed(0) }}%
                </span>
              </div>
              
              <!-- Target weight on the right -->
              <div class="w-16 text-sm text-gray-900 font-bold text-right">
                {{ totalWeeklyTarget }}lb
              </div>
            </div>
          </div>
        </div>
        
        <!-- X-axis labels -->
        <div class="flex mt-2 ml-24 mr-16">
          <div class="flex-1 flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        
        <!-- Non-committed produce note -->
        <div v-if="totalDeliveryData.thisWeek && Object.keys(totalDeliveryData.thisWeek.nonCommittedTypes).length > 0" class="mt-3 text-xs text-gray-500">
          <strong>Additional deliveries (not committed):</strong>
          <span v-for="(weight, produceName, index) in totalDeliveryData.thisWeek.nonCommittedTypes" :key="produceName">
            {{ produceName }} ({{ weight.toFixed(1) }}lb)<span v-if="index < Object.keys(totalDeliveryData.thisWeek.nonCommittedTypes).length - 1">, </span>
          </span>
          - Total: {{ totalDeliveryData.thisWeek.nonCommitted.toFixed(1) }}lb
        </div>
      </div>

      <!-- Produce Type Breakdown -->
      <div v-for="item in pantryData.commitments" :key="item.produceType"
        class="border rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-medium text-gray-900">{{ item.produceType }}</h4>
          <div class="text-sm text-gray-500">{{ item.weeklyWeight }} lbs/week</div>
        </div>
        
        <!-- Last Week vs This Week Comparison -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Last Week -->
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Last Week</div>
              <div class="text-sm text-gray-500 mb-2">{{ formatWeekRange(item.lastWeek.weekStart) }}</div>
              <div class="text-lg font-semibold text-gray-900">
                {{ item.lastWeek.delivered.toFixed(1) }} lbs
              </div>
              <div class="text-xs text-gray-500">
                {{ ((item.lastWeek.delivered / item.weeklyWeight) * 100).toFixed(0) }}% of {{ item.weeklyWeight }}lb target
              </div>
              <!-- Status indicator -->
              <div class="mt-2">
                <span :class="[
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  getWeekStatusBadge(item.lastWeek.delivered, item.weeklyWeight)
                ]">
                  {{ getWeekStatusText(item.lastWeek.delivered, item.weeklyWeight) }}
                </span>
              </div>
            </div>
          </div>

          <!-- This Week -->
          <div class="bg-garden-green-50 rounded-lg p-3">
            <div class="text-center">
              <div class="text-sm text-garden-green-700 mb-1">This Week</div>
              <div class="text-sm text-gray-500 mb-2">{{ formatWeekRange(item.thisWeek.weekStart) }}</div>
              <div class="text-lg font-semibold text-garden-green-800">
                {{ item.thisWeek.delivered.toFixed(1) }} lbs
              </div>
              <div class="text-xs text-gray-500">
                {{ ((item.thisWeek.delivered / item.weeklyWeight) * 100).toFixed(0) }}% of {{ item.weeklyWeight }}lb target
              </div>
              <!-- Status indicator -->
              <div class="mt-2">
                <span :class="[
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  getWeekStatusBadge(item.thisWeek.delivered, item.weeklyWeight)
                ]">
                  {{ getWeekStatusText(item.thisWeek.delivered, item.weeklyWeight) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

interface WeekData {
  weekStart: string
  delivered: number
}

interface CommitmentItem {
  produceType: string
  weeklyWeight: number
  lastWeek: WeekData
  thisWeek: WeekData
}

interface Props {
  loading: boolean
}

const props = defineProps<Props>()
const dashboardStore = useDashboardStore()

const commitmentData = ref<CommitmentItem[]>([])
const pantryCommitmentData = ref<any[]>([])
const totalDeliveryData = ref<any>({})
const internalLoading = ref(false)


// Format week range (Monday to Sunday)
const formatWeekRange = (weekStartStr: string) => {
  // Parse the date string as local date to avoid timezone issues
  const [year, month, day] = weekStartStr.split('-').map(Number)
  const weekStart = new Date(year, month - 1, day) // month is 0-indexed
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // Monday + 6 days = Sunday
  
  return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

// Get status badge class based on delivery vs target
const getWeekStatusBadge = (delivered: number, target: number) => {
  const percentage = (delivered / target) * 100
  if (percentage >= 100) return 'bg-green-100 text-green-800'
  if (percentage >= 75) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

// Get status text based on delivery vs target
const getWeekStatusText = (delivered: number, target: number) => {
  const percentage = (delivered / target) * 100
  if (percentage >= 100) return 'Complete'
  if (percentage >= 75) return 'On Track'
  return 'Behind'
}

// Get progress bar color based on completion percentage
const getProgressBarColor = (delivered: number, target: number) => {
  const percentage = (delivered / target) * 100
  if (percentage >= 75) return 'bg-green-500'      // Green for 75%+ completion
  if (percentage >= 50) return 'bg-yellow-500'     // Yellow for 50-74% completion
  return 'bg-red-500'                              // Red for under 50% completion
}

// Process commitment data from dashboard store
const processCommitmentData = () => {
  if (!dashboardStore.commitmentData) {
    commitmentData.value = []
    pantryCommitmentData.value = []
    return
  }

  const data = dashboardStore.commitmentData
  const pantries = data.pantries || []
  const thisWeekCommitments = data.thisWeek.commitments
  const lastWeekCommitments = data.lastWeek.commitments
  const thisWeekEntries = data.thisWeek.harvest
  const lastWeekEntries = data.lastWeek.harvest

  // Group commitments by pantry
  const pantryGroups = new Map()

  // Process this week's commitments
  thisWeekCommitments.forEach((commitment: any) => {
    if (commitment.commitmentType === 'produce_type' && commitment.produceTypeId?.name) {
      // Handle both populated and non-populated pantryId
      const pantryId = commitment.pantryId?._id || commitment.pantryId?.id || commitment.pantryId
      const pantryIdStr = typeof pantryId === 'string' ? pantryId : pantryId?.toString()

      if (!pantryGroups.has(pantryIdStr)) {
        // Try to find pantry by matching various ID formats
        const pantry = pantries.find((p: any) => {
          const pId = p._id || p.id
          const pIdStr = typeof pId === 'string' ? pId : pId?.toString()
          return pIdStr === pantryIdStr
        })

        // If pantryId is populated (object), use its name directly
        const pantryName = commitment.pantryId?.name || pantry?.name || 'Unknown'

        pantryGroups.set(pantryIdStr, {
          pantryId: pantryIdStr,
          pantryName,
          commitments: {}
        })
      }
      const group = pantryGroups.get(pantryIdStr)
      const produceTypeName = commitment.produceTypeId.name
      if (!group.commitments[produceTypeName]) {
        group.commitments[produceTypeName] = { thisWeek: null, lastWeek: null }
      }
      group.commitments[produceTypeName].thisWeek = commitment
    }
  })

  // Process last week's commitments
  lastWeekCommitments.forEach((commitment: any) => {
    if (commitment.commitmentType === 'produce_type' && commitment.produceTypeId?.name) {
      // Handle both populated and non-populated pantryId
      const pantryId = commitment.pantryId?._id || commitment.pantryId?.id || commitment.pantryId
      const pantryIdStr = typeof pantryId === 'string' ? pantryId : pantryId?.toString()

      if (!pantryGroups.has(pantryIdStr)) {
        // Try to find pantry by matching various ID formats
        const pantry = pantries.find((p: any) => {
          const pId = p._id || p.id
          const pIdStr = typeof pId === 'string' ? pId : pId?.toString()
          return pIdStr === pantryIdStr
        })

        // If pantryId is populated (object), use its name directly
        const pantryName = commitment.pantryId?.name || pantry?.name || 'Unknown'

        pantryGroups.set(pantryIdStr, {
          pantryId: pantryIdStr,
          pantryName,
          commitments: {}
        })
      }
      const group = pantryGroups.get(pantryIdStr)
      const produceTypeName = commitment.produceTypeId.name
      if (!group.commitments[produceTypeName]) {
        group.commitments[produceTypeName] = { thisWeek: null, lastWeek: null }
      }
      group.commitments[produceTypeName].lastWeek = commitment
    }
  })

  // Calculate deliveries by produce type and pantry for each week
  const calculateDeliveries = (entries: any[], produceTypeName: string, pantryId: string) => {
    return entries
      .filter((entry: any) => {
        const entryPantryId = entry.pantryId?._id || entry.pantryId?.id || entry.pantryId
        const entryPantryIdStr = typeof entryPantryId === 'string' ? entryPantryId : entryPantryId?.toString()
        return entry.produceType?.name === produceTypeName && entryPantryIdStr === pantryId
      })
      .reduce((total: number, entry: any) => {
        const weight = entry.weight || (entry.quantity * (entry.produceType?.conversionFactor || 1))
        return total + weight
      }, 0)
  }

  // Build pantry commitment data
  const pantryResults: any[] = []

  pantryGroups.forEach((pantryGroup, pantryId) => {
    const commitments: CommitmentItem[] = Object.entries(pantryGroup.commitments).map(([produceTypeName, data]: [string, any]) => {
      const thisWeekCommitment = data.thisWeek
      const lastWeekCommitment = data.lastWeek

      const weeklyWeight = thisWeekCommitment?.weeklyWeightLbs || lastWeekCommitment?.weeklyWeightLbs || 0

      return {
        produceType: produceTypeName,
        weeklyWeight,
        thisWeek: {
          weekStart: dashboardStore.commitmentData.thisWeek.weekStart,
          delivered: calculateDeliveries(thisWeekEntries, produceTypeName, pantryId)
        },
        lastWeek: {
          weekStart: dashboardStore.commitmentData.lastWeek.weekStart,
          delivered: calculateDeliveries(lastWeekEntries, produceTypeName, pantryId)
        }
      }
    }).filter(item => item.weeklyWeight > 0)

    if (commitments.length > 0) {
      pantryResults.push({
        pantryId: pantryGroup.pantryId,
        pantryName: pantryGroup.pantryName,
        commitments
      })
    }
  })

  pantryCommitmentData.value = pantryResults

  // Keep the old flat commitmentData for backward compatibility (combine all pantries)
  commitmentData.value = pantryResults.flatMap(p => p.commitments)
  
  // Calculate totals for ALL deliveries (including non-committed items)
  const allThisWeekDeliveries = thisWeekEntries.reduce((total: number, entry: any) => {
    const weight = entry.weight || (entry.quantity * (entry.produceType?.conversionFactor || 1))
    return total + weight
  }, 0)
  
  const allLastWeekDeliveries = lastWeekEntries.reduce((total: number, entry: any) => {
    const weight = entry.weight || (entry.quantity * (entry.produceType?.conversionFactor || 1))
    return total + weight
  }, 0)
  
  // Calculate non-committed deliveries
  const committedThisWeek = commitmentData.value.reduce((total, item) => total + item.thisWeek.delivered, 0)
  const committedLastWeek = commitmentData.value.reduce((total, item) => total + item.lastWeek.delivered, 0)
  
  const nonCommittedThisWeek = allThisWeekDeliveries - committedThisWeek
  const nonCommittedLastWeek = allLastWeekDeliveries - committedLastWeek
  
  // Get non-committed produce types for notes
  const committedProduceTypes = new Set(commitmentData.value.map(item => item.produceType))
  
  const nonCommittedThisWeekTypes = thisWeekEntries
    .filter((entry: any) => !committedProduceTypes.has(entry.produceType?.name))
    .reduce((acc: any, entry: any) => {
      const name = entry.produceType?.name || 'Unknown'
      const weight = entry.weight || (entry.quantity * (entry.produceType?.conversionFactor || 1))
      acc[name] = (acc[name] || 0) + weight
      return acc
    }, {})
  
  const nonCommittedLastWeekTypes = lastWeekEntries
    .filter((entry: any) => !committedProduceTypes.has(entry.produceType?.name))
    .reduce((acc: any, entry: any) => {
      const name = entry.produceType?.name || 'Unknown'
      const weight = entry.weight || (entry.produceType?.conversionFactor || 1)
      acc[name] = (acc[name] || 0) + weight
      return acc
    }, {})
  
  // Store total delivery data
  totalDeliveryData.value = {
    thisWeek: {
      total: allThisWeekDeliveries,
      committed: committedThisWeek,
      nonCommitted: nonCommittedThisWeek,
      nonCommittedTypes: nonCommittedThisWeekTypes
    },
    lastWeek: {
      total: allLastWeekDeliveries,
      committed: committedLastWeek,
      nonCommitted: nonCommittedLastWeek,
      nonCommittedTypes: nonCommittedLastWeekTypes
    }
  }
}

// Computed totals
const totalThisWeek = computed(() => {
  return commitmentData.value.reduce((total, item) => total + item.thisWeek.delivered, 0)
})

const totalLastWeek = computed(() => {
  return commitmentData.value.reduce((total, item) => total + item.lastWeek.delivered, 0)
})

const totalWeeklyTarget = computed(() => {
  return commitmentData.value.reduce((total, item) => total + item.weeklyWeight, 0)
})

const thisWeekPercentage = computed(() => {
  return totalWeeklyTarget.value > 0 ? (totalThisWeek.value / totalWeeklyTarget.value * 100).toFixed(0) : '0'
})

const lastWeekPercentage = computed(() => {
  return totalWeeklyTarget.value > 0 ? (totalLastWeek.value / totalWeeklyTarget.value * 100).toFixed(0) : '0'
})

// Watch for commitment data changes
watch(() => dashboardStore.commitmentData, (newData) => {
  if (newData) {
    processCommitmentData()
  }
}, { immediate: true })

// Process data on mount if already available
onMounted(() => {
  if (dashboardStore.commitmentData) {
    processCommitmentData()
  }
})
</script>