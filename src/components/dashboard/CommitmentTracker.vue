<template>
  <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Weekly Commitment Progress - Broad Street Food Pantry</h3>
      <div class="text-sm text-gray-500">
        Last Week vs This Week
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
    </div>

    <div v-else-if="commitmentData.length === 0" class="text-center py-8">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <p class="mt-4 text-sm text-gray-500">No commitments found for Broad Street Food Pantry</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Horizontal Bar Chart -->
      <div class="bg-white border rounded-lg p-4">
        <h4 class="font-medium text-gray-900 mb-4">This Week Progress Overview</h4>
        <div class="space-y-3">
          <div v-for="item in commitmentData" :key="item.produceType" class="flex items-center">
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
      <div v-for="item in commitmentData" :key="item.produceType" 
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

    <!-- Weekly Summary -->
    <div v-if="commitmentData.length > 0" class="mt-6 pt-6 border-t border-gray-200">
      <div class="grid grid-cols-2 gap-6">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{{ totalLastWeek.toFixed(1) }} lbs</div>
          <div class="text-sm text-gray-500">Last Week Total</div>
          <div class="text-xs text-gray-400 mt-1">{{ lastWeekPercentage }}% of {{ totalWeeklyTarget }}lb target</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-garden-green-600">{{ totalThisWeek.toFixed(1) }} lbs</div>
          <div class="text-sm text-gray-500">This Week Total</div>
          <div class="text-xs text-gray-400 mt-1">{{ thisWeekPercentage }}% of {{ totalWeeklyTarget }}lb target</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

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

const commitmentData = ref<CommitmentItem[]>([])
const totalDeliveryData = ref<any>({})
const internalLoading = ref(false)

// Get Monday of current week
const getCurrentMonday = () => {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
  const monday = new Date(today)
  
  // Calculate days to subtract to get to Monday of current week
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  monday.setDate(today.getDate() - daysFromMonday)
  
  return monday
}

// Get Monday of last week
const getLastMonday = () => {
  const currentMonday = getCurrentMonday()
  const lastMonday = new Date(currentMonday)
  lastMonday.setDate(currentMonday.getDate() - 7)
  return lastMonday
}

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

// Fetch commitment data
const fetchCommitmentData = async () => {
  internalLoading.value = true
  
  try {
    const authToken = localStorage.getItem('auth_token')
    if (!authToken) {
      throw new Error('No auth token found')
    }

    // Get Broad Street Food Pantry ID first
    const pantriesResponse = await fetch('/api/food-pantries', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const pantriesResult = await pantriesResponse.json()
    const broadStreetPantry = pantriesResult.data?.find((p: any) => 
      p.name.toLowerCase().includes('broad street')
    )
    
    if (!broadStreetPantry) {
      console.warn('Broad Street Food Pantry not found')
      commitmentData.value = []
      return
    }

    // Get current and last Monday dates
    const thisMonday = getCurrentMonday()
    const lastMonday = getLastMonday()
    
    const thisMondayStr = thisMonday.toISOString().split('T')[0]
    const lastMondayStr = lastMonday.toISOString().split('T')[0]
    
    console.log('📅 Date ranges:', {
      thisMonday: thisMondayStr,
      lastMonday: lastMondayStr,
      today: new Date().toISOString().split('T')[0],
      thisMondayObj: thisMonday,
      lastMondayObj: lastMonday,
      thisMondayFormatted: formatWeekRange(thisMondayStr),
      lastMondayFormatted: formatWeekRange(lastMondayStr)
    })

    // Fetch commitments for both weeks
    const [thisWeekResponse, lastWeekResponse] = await Promise.all([
      fetch(`/api/commitments?pantryId=${broadStreetPantry._id}&startDate=${thisMondayStr}&endDate=${thisMondayStr}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }),
      fetch(`/api/commitments?pantryId=${broadStreetPantry._id}&startDate=${lastMondayStr}&endDate=${lastMondayStr}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
    ])

    const thisWeekResult = await thisWeekResponse.json()
    const lastWeekResult = await lastWeekResponse.json()
    
    const thisWeekCommitments = thisWeekResult.data || []
    const lastWeekCommitments = lastWeekResult.data || []

    // Fetch harvest entries for both weeks to calculate deliveries
    const [thisWeekHarvest, lastWeekHarvest] = await Promise.all([
      fetch(`/api/harvest-list?pantryId=${broadStreetPantry._id}&startDate=${thisMondayStr}&endDate=${new Date(thisMonday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }),
      fetch(`/api/harvest-list?pantryId=${broadStreetPantry._id}&startDate=${lastMondayStr}&endDate=${new Date(lastMonday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
    ])

    const thisWeekHarvestResult = await thisWeekHarvest.json()
    const lastWeekHarvestResult = await lastWeekHarvest.json()
    
    const thisWeekEntries = thisWeekHarvestResult.data?.entries || thisWeekHarvestResult.data || []
    const lastWeekEntries = lastWeekHarvestResult.data?.entries || lastWeekHarvestResult.data || []
    
    console.log('📊 Harvest data:', {
      thisWeekEntries: thisWeekEntries.length,
      lastWeekEntries: lastWeekEntries.length,
      thisWeekSample: thisWeekEntries.slice(0, 2),
      lastWeekSample: lastWeekEntries.slice(0, 2)
    })

    // Group commitments by produce type
    const produceTypeGroups: { [key: string]: any[] } = {}
    
    // Process this week's commitments
    thisWeekCommitments.forEach((commitment: any) => {
      if (commitment.commitmentType === 'produce_type' && commitment.produceTypeId?.name) {
        const produceTypeName = commitment.produceTypeId.name
        if (!produceTypeGroups[produceTypeName]) {
          produceTypeGroups[produceTypeName] = []
        }
        produceTypeGroups[produceTypeName].push({
          ...commitment,
          week: 'this'
        })
      }
    })

    // Process last week's commitments
    lastWeekCommitments.forEach((commitment: any) => {
      if (commitment.commitmentType === 'produce_type' && commitment.produceTypeId?.name) {
        const produceTypeName = commitment.produceTypeId.name
        if (!produceTypeGroups[produceTypeName]) {
          produceTypeGroups[produceTypeName] = []
        }
        produceTypeGroups[produceTypeName].push({
          ...commitment,
          week: 'last'
        })
      }
    })

    // Calculate deliveries by produce type for each week
    const calculateDeliveries = (entries: any[], produceTypeName: string) => {
      return entries
        .filter((entry: any) => entry.produceType?.name === produceTypeName)
        .reduce((total: number, entry: any) => {
          const weight = entry.weight || (entry.quantity * (entry.produceType?.conversionFactor || 1))
          return total + weight
        }, 0)
    }

    // Build final data structure
    const result: CommitmentItem[] = Object.entries(produceTypeGroups).map(([produceTypeName, commitments]) => {
      const thisWeekCommitment = commitments.find(c => c.week === 'this')
      const lastWeekCommitment = commitments.find(c => c.week === 'last')
      
      const weeklyWeight = thisWeekCommitment?.weeklyWeightLbs || lastWeekCommitment?.weeklyWeightLbs || 0
      
      return {
        produceType: produceTypeName,
        weeklyWeight,
        thisWeek: {
          weekStart: thisMondayStr,
          delivered: calculateDeliveries(thisWeekEntries, produceTypeName)
        },
        lastWeek: {
          weekStart: lastMondayStr,
          delivered: calculateDeliveries(lastWeekEntries, produceTypeName)
        }
      }
    })

    commitmentData.value = result.filter(item => item.weeklyWeight > 0)
    
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
    
  } catch (error) {
    console.error('Error fetching commitment data:', error)
    commitmentData.value = []
  } finally {
    internalLoading.value = false
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

// Fetch data on mount
onMounted(() => {
  fetchCommitmentData()
})
</script>