<template>
  <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Annual Commitment Progress - All Pantries</h3>
      <div class="text-sm text-gray-500">
        Year to Date vs Expected Progress
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
    </div>

    <div v-else-if="annualData.length === 0" class="text-center py-8">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <p class="mt-4 text-sm text-gray-500">No annual commitments found</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Annual Progress Summary -->
      <div class="grid grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{{ yearProgress.toFixed(1) }}%</div>
          <div class="text-sm text-gray-500">Year Progress</div>
          <div class="text-xs text-gray-400 mt-1">{{ dayOfYear }} of {{ totalDaysInYear }} days</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-garden-green-600">{{ formatWeight(totalActualWeight) }} lbs</div>
          <div class="text-sm text-gray-500">Actual YTD</div>
          <div class="text-xs text-gray-400 mt-1">{{ (totalActualWeight / totalAnnualTarget * 100).toFixed(1) }}% of annual target</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold" :class="totalProgressClass">{{ formatWeight(totalExpectedWeight) }} lbs</div>
          <div class="text-sm text-gray-500">Expected YTD</div>
          <div class="text-xs text-gray-400 mt-1">{{ (totalExpectedWeight / totalAnnualTarget * 100).toFixed(1) }}% of annual target</div>
        </div>
      </div>

      <!-- Horizontal Bar Chart -->
      <div class="bg-white border rounded-lg p-4">
        <h4 class="font-medium text-gray-900 mb-4">Annual Progress by Produce Type</h4>
        <div class="space-y-3">
          <div v-for="item in annualData" :key="item.produceType" class="md:flex md:items-center">
            <!-- Mobile: Vertical Stack -->
            <div class="md:hidden space-y-2">
              <!-- Label and target weight -->
              <div class="flex justify-between items-center">
                <div class="text-sm text-gray-700 font-medium">
                  {{ item.produceType }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ formatWeight(item.annualTarget) }}lb
                </div>
              </div>
              
              <!-- Progress bar -->
              <div class="bg-gray-200 rounded-full h-6 relative">
                <!-- Expected progress bar (background) -->
                <div 
                  class="h-6 rounded-full bg-gray-300 absolute inset-0"
                  :style="{ width: `${Math.min((item.expectedWeight / item.annualTarget) * 100, 100)}%` }"
                ></div>
                
                <!-- Actual progress bar (foreground) -->
                <div 
                  :class="[
                    'h-6 rounded-full transition-all duration-500 ease-out relative z-10',
                    getProgressBarColor(item.actualWeight, item.expectedWeight)
                  ]"
                  :style="{ width: `${Math.min((item.actualWeight / item.annualTarget) * 100, 100)}%` }"
                >
                  <!-- Progress text inside bar -->
                  <span 
                    v-if="(item.actualWeight / item.annualTarget) * 100 > 25"
                    class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white"
                  >
                    {{ ((item.actualWeight / item.expectedWeight) * 100).toFixed(0) }}%
                  </span>
                </div>
                
                <!-- Progress text outside bar -->
                <span 
                  v-if="(item.actualWeight / item.annualTarget) * 100 <= 25"
                  class="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600"
                >
                  {{ ((item.actualWeight / item.expectedWeight) * 100).toFixed(0) }}%
                </span>
              </div>
            </div>

            <!-- Desktop: Horizontal Layout -->
            <div class="hidden md:flex md:items-center md:w-full">
              <!-- Produce type label -->
              <div class="w-32 text-sm text-gray-700 font-medium text-right pr-3">
                {{ item.produceType }}
              </div>
              
              <!-- Progress bar container -->
              <div class="flex-1 flex items-center">
                <div class="flex-1 bg-gray-200 rounded-full h-6 relative mr-3">
                  <!-- Expected progress bar (background) -->
                  <div 
                    class="h-6 rounded-full bg-gray-300 absolute inset-0"
                    :style="{ width: `${Math.min((item.expectedWeight / item.annualTarget) * 100, 100)}%` }"
                  ></div>
                  
                  <!-- Actual progress bar (foreground) -->
                  <div 
                    :class="[
                      'h-6 rounded-full transition-all duration-500 ease-out relative z-10',
                      getProgressBarColor(item.actualWeight, item.expectedWeight)
                    ]"
                    :style="{ width: `${Math.min((item.actualWeight / item.annualTarget) * 100, 100)}%` }"
                  >
                    <!-- Progress text inside bar if there's space -->
                    <span 
                      v-if="(item.actualWeight / item.annualTarget) * 100 > 25"
                      class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white"
                    >
                      {{ ((item.actualWeight / item.expectedWeight) * 100).toFixed(0) }}%
                    </span>
                  </div>
                  
                  <!-- Progress text outside bar if not enough space -->
                  <span 
                    v-if="(item.actualWeight / item.annualTarget) * 100 <= 25"
                    class="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600"
                  >
                    {{ ((item.actualWeight / item.expectedWeight) * 100).toFixed(0) }}%
                  </span>
                </div>
                
                <!-- Target weight on the right -->
                <div class="w-20 text-sm text-gray-600 text-right">
                  {{ formatWeight(item.annualTarget) }}lb
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Total Weight Bar -->
        <div class="border-t pt-3 mt-3">
          <div class="flex items-center">
            <!-- Total label -->
            <div class="w-32 text-sm text-gray-900 font-bold text-right pr-3">
              Total
            </div>
            
            <!-- Progress bar container -->
            <div class="flex-1 flex items-center">
              <div class="flex-1 bg-gray-200 rounded-full h-6 relative mr-3">
                <!-- Expected progress bar (background) -->
                <div 
                  class="h-6 rounded-full bg-gray-300 absolute inset-0"
                  :style="{ width: `${Math.min((totalExpectedWeight / totalAnnualTarget) * 100, 100)}%` }"
                ></div>
                
                <!-- Actual progress bar (foreground) -->
                <div 
                  :class="[
                    'h-6 rounded-full transition-all duration-500 ease-out relative z-10',
                    getProgressBarColor(totalActualWeight, totalExpectedWeight)
                  ]"
                  :style="{ width: `${Math.min((totalActualWeight / totalAnnualTarget) * 100, 100)}%` }"
                >
                  <!-- Progress text inside bar if there's space -->
                  <span 
                    v-if="(totalActualWeight / totalAnnualTarget) * 100 > 25"
                    class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white"
                  >
                    {{ ((totalActualWeight / totalExpectedWeight) * 100).toFixed(0) }}%
                  </span>
                </div>
                
                <!-- Progress text outside bar if not enough space -->
                <span 
                  v-if="(totalActualWeight / totalAnnualTarget) * 100 <= 25"
                  class="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600"
                >
                  {{ ((totalActualWeight / totalExpectedWeight) * 100).toFixed(0) }}%
                </span>
              </div>
              
              <!-- Target weight on the right -->
              <div class="w-20 text-sm text-gray-900 font-bold text-right">
                {{ formatWeight(totalAnnualTarget) }}lb
              </div>
            </div>
          </div>
        </div>
        
        <!-- X-axis labels -->
        <div class="flex mt-2 ml-32 mr-20">
          <div class="flex-1 flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="flex justify-center mt-4 space-x-6 text-xs text-gray-500">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-gray-300 rounded mr-2"></div>
            <span>Expected Progress</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>On Track</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span>Behind</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Significantly Behind</span>
          </div>
        </div>
      </div>

      <!-- Detailed Breakdown -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="item in annualData" :key="item.produceType" 
          class="border rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">{{ item.produceType }}</h4>
            <span :class="[
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              getStatusBadge(item.actualWeight, item.expectedWeight)
            ]">
              {{ getStatusText(item.actualWeight, item.expectedWeight) }}
            </span>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Annual Target:</span>
              <span class="font-medium">{{ formatWeight(item.annualTarget) }} lbs</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Expected YTD:</span>
              <span class="font-medium">{{ formatWeight(item.expectedWeight, 1) }} lbs</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Actual YTD:</span>
              <span class="font-medium text-garden-green-600">{{ formatWeight(item.actualWeight, 1) }} lbs</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Progress vs Expected:</span>
              <span :class="[
                'font-medium',
                item.actualWeight >= item.expectedWeight ? 'text-green-600' : 'text-red-600'
              ]">
                {{ ((item.actualWeight / item.expectedWeight) * 100).toFixed(0) }}%
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Annual Progress:</span>
              <span class="font-medium">{{ ((item.actualWeight / item.annualTarget) * 100).toFixed(1) }}%</span>
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

interface AnnualCommitmentItem {
  produceType: string
  annualTarget: number
  actualWeight: number
  expectedWeight: number
}

interface Props {
  loading: boolean
}

const props = defineProps<Props>()

const annualData = ref<AnnualCommitmentItem[]>([])
const internalLoading = ref(false)

// Number formatting helper for weights
const formatWeight = (weight: number, decimals: number = 0) => {
  return weight.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// Calculate current day of year and total days
const now = new Date()
const startOfYear = new Date(now.getFullYear(), 0, 1)
const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1

// Calculate total days in current year (handle leap years)
const totalDaysInYear = now.getFullYear() % 4 === 0 && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0) ? 366 : 365

const yearProgress = computed(() => (dayOfYear / totalDaysInYear) * 100)

// Calculate totals
const totalAnnualTarget = computed(() => 
  annualData.value.reduce((total, item) => total + item.annualTarget, 0)
)

const totalActualWeight = computed(() => 
  annualData.value.reduce((total, item) => total + item.actualWeight, 0)
)

const totalExpectedWeight = computed(() => 
  annualData.value.reduce((total, item) => total + item.expectedWeight, 0)
)

const totalProgressClass = computed(() => {
  const ratio = totalActualWeight.value / totalExpectedWeight.value
  if (ratio >= 1) return 'text-green-600'
  if (ratio >= 0.75) return 'text-yellow-600'
  return 'text-red-600'
})

// Get progress bar color based on actual vs expected
const getProgressBarColor = (actual: number, expected: number) => {
  const ratio = actual / expected
  if (ratio >= 1) return 'bg-green-500'      // On track or ahead
  if (ratio >= 0.75) return 'bg-yellow-500'  // Slightly behind
  return 'bg-red-500'                        // Significantly behind
}

// Get status badge class based on actual vs expected
const getStatusBadge = (actual: number, expected: number) => {
  const ratio = actual / expected
  if (ratio >= 1) return 'bg-green-100 text-green-800'
  if (ratio >= 0.75) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

// Get status text based on actual vs expected
const getStatusText = (actual: number, expected: number) => {
  const ratio = actual / expected
  if (ratio >= 1) return 'On Track'
  if (ratio >= 0.75) return 'Behind'
  return 'Significantly Behind'
}

// Fetch annual commitment data
const fetchAnnualData = async () => {
  internalLoading.value = true
  
  try {
    const authToken = localStorage.getItem('auth_token')
    if (!authToken) {
      throw new Error('No auth token found')
    }

    // Get start and end of current year
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
    const yearEnd = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
    const todayStr = now.toISOString().split('T')[0]

    // Fetch all commitments for the current year
    const commitmentsResponse = await fetch(`/api/commitments?startDate=${yearStart}&endDate=${yearEnd}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const commitmentsResult = await commitmentsResponse.json()
    const commitments = commitmentsResult.data || []

    // Fetch all harvest entries for year to date
    const harvestResponse = await fetch(`/api/harvest-list?startDate=${yearStart}&endDate=${todayStr}&limit=10000`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const harvestResult = await harvestResponse.json()
    const harvestEntries = harvestResult.data?.entries || harvestResult.data || []

    // Group commitments by produce type and calculate annual targets
    const produceTypeCommitments: { [key: string]: number } = {}
    
    commitments.forEach((commitment: any) => {
      if (commitment.commitmentType === 'produce_type' && commitment.produceTypeId?.name) {
        const produceTypeName = commitment.produceTypeId.name
        const weeklyWeight = commitment.weeklyWeightLbs || 0
        
        if (!produceTypeCommitments[produceTypeName]) {
          produceTypeCommitments[produceTypeName] = 0
        }
        produceTypeCommitments[produceTypeName] += weeklyWeight
      }
    })

    // Calculate actual deliveries by produce type
    const actualDeliveries: { [key: string]: number } = {}
    
    harvestEntries.forEach((entry: any) => {
      if (entry.produceType?.name) {
        const produceTypeName = entry.produceType.name
        const weight = entry.weight || (entry.quantity * (entry.produceType.conversionFactor || 1))
        
        if (!actualDeliveries[produceTypeName]) {
          actualDeliveries[produceTypeName] = 0
        }
        actualDeliveries[produceTypeName] += weight
      }
    })

    // Build annual data structure
    const result: AnnualCommitmentItem[] = Object.entries(produceTypeCommitments).map(([produceType, totalWeeklyCommitment]) => {
      // Estimate annual target (52 weeks * average weekly commitment)
      const annualTarget = totalWeeklyCommitment * 52 / commitments.filter(c => 
        c.commitmentType === 'produce_type' && 
        c.produceTypeId?.name === produceType
      ).length // Divide by number of weeks with commitments to get average

      // Calculate expected weight based on year progress
      const expectedWeight = annualTarget * (yearProgress.value / 100)
      
      // Get actual delivered weight
      const actualWeight = actualDeliveries[produceType] || 0

      return {
        produceType,
        annualTarget,
        actualWeight,
        expectedWeight
      }
    })

    // Sort by annual target descending
    annualData.value = result
      .filter(item => item.annualTarget > 0)
      .sort((a, b) => b.annualTarget - a.annualTarget)
    
  } catch (error) {
    console.error('Error fetching annual commitment data:', error)
    annualData.value = []
  } finally {
    internalLoading.value = false
  }
}

const dashboardStore = useDashboardStore()

// Refetch whenever the dashboard store refreshes (initial load, Pusher events,
// manual refresh). On mount, only fetch if the store already has data —
// otherwise the imminent lastUpdated change would trigger a duplicate fetch.
watch(() => dashboardStore.lastUpdated, () => {
  fetchAnnualData()
})

onMounted(() => {
  if (dashboardStore.lastUpdated) {
    fetchAnnualData()
  }
})
</script>