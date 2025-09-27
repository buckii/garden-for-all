<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-lg font-medium text-gray-900">Pantry Commitments Progress</h3>
        <p class="text-sm text-gray-600">Weekly commitment targets vs actual deliveries ({{ currentYear }})</p>
      </div>
      <div class="flex items-center space-x-2">
        <select v-model="selectedYear" @change="fetchCommitmentData"
          class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-garden-green-500 focus:border-garden-green-500">
          <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-garden-green-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- No Data -->
    <div v-else-if="commitments.length === 0" class="text-center py-8">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4"/>
      </svg>
      <p class="mt-2 text-sm text-gray-500">No commitments set for {{ selectedYear }}</p>
    </div>

    <!-- Progress Cards -->
    <div v-else class="space-y-4">
      <!-- Summary Card -->
      <div class="bg-gradient-to-r from-garden-green-50 to-garden-green-100 rounded-lg p-4 border border-garden-green-200">
        <div class="flex justify-between items-center">
          <div>
            <h4 class="text-lg font-semibold text-garden-green-900">Overall Progress</h4>
            <p class="text-sm text-garden-green-700">{{ weeksElapsed }} weeks into {{ selectedYear }}</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-garden-green-900">{{ overallProgress.toFixed(0) }}%</div>
            <div class="text-sm text-garden-green-700">
              {{ totalActual.toFixed(1) }} / {{ totalTarget.toFixed(1) }} lbs
            </div>
          </div>
        </div>
        
        <!-- Overall Progress Bar -->
        <div class="mt-3 w-full bg-garden-green-200 rounded-full h-3">
          <div class="bg-garden-green-600 h-3 rounded-full transition-all duration-500"
               :style="{ width: Math.min(overallProgress, 100) + '%' }"></div>
        </div>
      </div>

      <!-- Individual Pantry Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="commitment in commitments" :key="commitment._id" class="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
          <!-- Pantry Header -->
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-gray-900">{{ commitment.pantryId?.name || 'Unknown Pantry' }}</h4>
              <p class="text-xs text-gray-500">{{ commitment.weeklyCommitment?.total || 0 }} lbs/week target</p>
            </div>
            <div class="text-right">
              <div :class="getProgressColorClass(commitment.progress?.totalProgress || 0)" class="text-lg font-bold">
                {{ (commitment.progress?.totalProgress || 0).toFixed(0) }}%
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div :class="getProgressBarClass(commitment.progress?.totalProgress || 0)"
                 class="h-2 rounded-full transition-all duration-500"
                 :style="{ width: Math.min(commitment.progress?.totalProgress || 0, 100) + '%' }"></div>
          </div>

          <!-- Category Breakdown -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div v-for="(category, key) in getCategories(commitment)" :key="key" class="flex justify-between">
              <span class="text-gray-600 capitalize">{{ key }}:</span>
              <span class="font-medium" :class="getCategoryColor(category.progress)">
                {{ category.actual.toFixed(1) }}/{{ category.target.toFixed(1) }}
              </span>
            </div>
          </div>

          <!-- Status Badge -->
          <div class="mt-3 flex justify-end">
            <span :class="getStatusBadge(commitment.progress?.totalProgress || 0)" 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
              {{ getStatusText(commitment.progress?.totalProgress || 0) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Weekly Breakdown Chart -->
      <div v-if="commitments.length > 0" class="bg-gray-50 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Weekly Progress Trends</h4>
        <div class="text-xs text-gray-500">
          <p>Target vs Actual deliveries by week (simplified view)</p>
          <div class="mt-2 grid grid-cols-7 gap-1">
            <div v-for="week in Math.min(weeksElapsed, 52)" :key="week" 
                 class="h-2 rounded-sm" 
                 :class="getWeekProgressColor(week)"
                 :title="`Week ${week}: ${getWeekProgress(week)}% of target`">
            </div>
          </div>
          <div class="flex justify-between mt-1 text-xs">
            <span>Week 1</span>
            <span>Week {{ Math.min(weeksElapsed, 52) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// State
const loading = ref(false)
const error = ref<string | null>(null)
const commitments = ref<any[]>([])
const selectedYear = ref(new Date().getFullYear())
const currentYear = new Date().getFullYear()

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const availableYears = computed(() => {
  return [currentYear - 1, currentYear, currentYear + 1]
})

const weeksElapsed = computed(() => {
  const startOfYear = new Date(selectedYear.value, 0, 1)
  const now = new Date()
  const endOfYear = new Date(selectedYear.value, 11, 31)
  const currentDate = now > endOfYear ? endOfYear : now
  
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return Math.ceil((currentDate - startOfYear) / msPerWeek)
})

const totalTarget = computed(() => {
  return commitments.value.reduce((sum, c) => {
    const weeklyTotal = c.weeklyCommitment?.total || 0
    return sum + (weeklyTotal * weeksElapsed.value)
  }, 0)
})

const totalActual = computed(() => {
  return commitments.value.reduce((sum, c) => {
    return sum + (c.progress?.actualDeliveries?.total || 0)
  }, 0)
})

const overallProgress = computed(() => {
  return totalTarget.value > 0 ? (totalActual.value / totalTarget.value) * 100 : 0
})

const fetchCommitmentData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`${API_BASE}/pantry-commitments?year=${selectedYear.value}&includeProgress=true`, {
      headers: getAuthHeader()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch commitment data')
    }
    
    const result = await response.json()
    commitments.value = result.data || []
    
    // Calculate progress for each commitment
    commitments.value.forEach(commitment => {
      if (commitment.progress) {
        const categories = ['vegetables', 'fruits', 'herbs', 'flowers', 'total']
        let totalProgress = 0
        let categoryCount = 0
        
        categories.forEach(category => {
          const weekly = commitment.weeklyCommitment?.[category] || 0
          const target = weekly * weeksElapsed.value
          const actual = commitment.progress.actualDeliveries?.[category] || 0
          const progress = target > 0 ? (actual / target) * 100 : 0
          
          if (category === 'total') {
            commitment.progress.totalProgress = progress
          } else if (weekly > 0) {
            totalProgress += progress
            categoryCount++
          }
        })
        
        // Use total progress if available, otherwise average of categories
        if (!commitment.progress.totalProgress && categoryCount > 0) {
          commitment.progress.totalProgress = totalProgress / categoryCount
        }
      }
    })
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch commitment data'
  } finally {
    loading.value = false
  }
}

const getCategories = (commitment: any) => {
  if (!commitment.progress) return {}
  
  const categories = ['vegetables', 'fruits', 'herbs', 'flowers']
  const result: any = {}
  
  categories.forEach(category => {
    const weekly = commitment.weeklyCommitment?.[category] || 0
    const target = weekly * weeksElapsed.value
    const actual = commitment.progress.actualDeliveries?.[category] || 0
    const progress = target > 0 ? (actual / target) * 100 : 0
    
    if (weekly > 0) {  // Only show categories with targets
      result[category] = { target, actual, progress }
    }
  })
  
  return result
}

const getProgressColorClass = (progress: number) => {
  if (progress >= 100) return 'text-green-600'
  if (progress >= 75) return 'text-green-500'
  if (progress >= 50) return 'text-yellow-500'
  if (progress >= 25) return 'text-orange-500'
  return 'text-red-500'
}

const getProgressBarClass = (progress: number) => {
  if (progress >= 100) return 'bg-green-500'
  if (progress >= 75) return 'bg-green-400'
  if (progress >= 50) return 'bg-yellow-500'
  if (progress >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

const getCategoryColor = (progress: number) => {
  if (progress >= 100) return 'text-green-600'
  if (progress >= 75) return 'text-green-500'
  if (progress >= 50) return 'text-yellow-600'
  return 'text-red-500'
}

const getStatusBadge = (progress: number) => {
  if (progress >= 100) return 'bg-green-100 text-green-800'
  if (progress >= 75) return 'bg-green-100 text-green-700'
  if (progress >= 50) return 'bg-yellow-100 text-yellow-800'
  if (progress >= 25) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

const getStatusText = (progress: number) => {
  if (progress >= 100) return 'On Target+'
  if (progress >= 75) return 'On Track'
  if (progress >= 50) return 'Behind'
  if (progress >= 25) return 'Lagging'
  return 'Critical'
}

const getWeekProgressColor = (week: number) => {
  // Simplified week progress - in real implementation, you'd calculate actual week-by-week progress
  const avgProgress = overallProgress.value
  if (avgProgress >= 90) return 'bg-green-500'
  if (avgProgress >= 75) return 'bg-green-400'
  if (avgProgress >= 50) return 'bg-yellow-500'
  if (avgProgress >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

const getWeekProgress = (week: number) => {
  // Simplified - return overall progress for now
  return overallProgress.value.toFixed(0)
}

onMounted(() => {
  fetchCommitmentData()
})
</script>