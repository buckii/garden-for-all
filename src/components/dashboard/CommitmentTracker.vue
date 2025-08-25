<template>
  <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Pantry Commitment Progress</h3>
      <div class="text-sm text-gray-500">
        Current Year Progress
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
    </div>

    <div v-else-if="pantryProgress.length === 0" class="text-center py-8">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>
      <p class="mt-4 text-sm text-gray-500">No pantry commitments configured</p>
    </div>

    <div v-else class="space-y-6">
      <div 
        v-for="progress in pantryProgress" 
        :key="progress.pantry.id"
        class="border rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <div 
              :class="[
                'w-3 h-3 rounded-full',
                getStatusColor(progress.percentage)
              ]"
            ></div>
            <h4 class="font-medium text-gray-900">{{ progress.pantry.name }}</h4>
            <span 
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getStatusBadgeClass(progress.percentage)
              ]"
            >
              {{ getStatusText(progress.percentage) }}
            </span>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium text-gray-900">
              {{ progress.delivered.toFixed(1) }} / {{ progress.committed.toFixed(1) }} lbs
            </div>
            <div class="text-xs text-gray-500">
              {{ progress.percentage.toFixed(1) }}% complete
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            :class="[
              'h-2 rounded-full transition-all duration-300',
              getProgressBarColor(progress.percentage)
            ]"
            :style="{ width: `${Math.min(100, progress.percentage)}%` }"
          ></div>
        </div>

        <!-- Details -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Delivered:</span>
            <div class="font-medium text-green-600">{{ progress.delivered.toFixed(1) }} lbs</div>
          </div>
          <div>
            <span class="text-gray-500">Remaining:</span>
            <div class="font-medium text-gray-900">{{ progress.remaining.toFixed(1) }} lbs</div>
          </div>
          <div v-if="progress.pantry.contact_info?.phone">
            <span class="text-gray-500">Contact:</span>
            <div class="font-medium text-gray-700">{{ progress.pantry.contact_info.phone }}</div>
          </div>
          <div class="text-right">
            <button
              @click="viewPantryDetails(progress.pantry)"
              class="text-garden-green-600 hover:text-garden-green-800 text-sm font-medium"
            >
              View Details →
            </button>
          </div>
        </div>

        <!-- Alert for Behind Schedule -->
        <div 
          v-if="progress.percentage < getExpectedProgress()"
          class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">Behind Schedule</h3>
              <div class="mt-1 text-sm text-yellow-700">
                Expected {{ getExpectedProgress().toFixed(1) }}% by now ({{ getCurrentDateProgress() }})
              </div>
            </div>
          </div>
        </div>

        <!-- Alert for Ahead of Schedule -->
        <div 
          v-else-if="progress.percentage > getExpectedProgress() + 10"
          class="mt-3 p-3 bg-green-50 border border-green-200 rounded-md"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Ahead of Schedule</h3>
              <div class="mt-1 text-sm text-green-700">
                {{ (progress.percentage - getExpectedProgress()).toFixed(1) }}% ahead of expected progress
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div v-if="pantryProgress.length > 0" class="mt-6 pt-6 border-t border-gray-200">
      <div class="grid grid-cols-3 gap-6 text-center">
        <div>
          <div class="text-2xl font-bold text-gray-900">{{ onTrackCount }}</div>
          <div class="text-sm text-gray-500">On Track</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-yellow-600">{{ behindCount }}</div>
          <div class="text-sm text-gray-500">Behind Schedule</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-green-600">{{ aheadCount }}</div>
          <div class="text-sm text-gray-500">Ahead of Schedule</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Database } from '@/lib/supabase'

type FoodPantry = Database['public']['Tables']['food_pantries']['Row']

interface PantryProgress {
  pantry: FoodPantry
  committed: number
  delivered: number
  remaining: number
  percentage: number
}

interface Props {
  pantryProgress: PantryProgress[]
  loading: boolean
}

interface Emits {
  (e: 'view-details', pantry: FoodPantry): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Calculate expected progress based on current date
const getExpectedProgress = () => {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1)
  
  const totalDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
  const passedDays = (now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
  
  return (passedDays / totalDays) * 100
}

const getCurrentDateProgress = () => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

const onTrackCount = computed(() => {
  const expected = getExpectedProgress()
  return props.pantryProgress.filter(p => 
    p.percentage >= expected - 10 && p.percentage <= expected + 10
  ).length
})

const behindCount = computed(() => {
  const expected = getExpectedProgress()
  return props.pantryProgress.filter(p => p.percentage < expected - 10).length
})

const aheadCount = computed(() => {
  const expected = getExpectedProgress()
  return props.pantryProgress.filter(p => p.percentage > expected + 10).length
})

const getStatusColor = (percentage: number) => {
  const expected = getExpectedProgress()
  if (percentage < expected - 10) return 'bg-red-500'
  if (percentage > expected + 10) return 'bg-green-500'
  return 'bg-yellow-500'
}

const getStatusBadgeClass = (percentage: number) => {
  const expected = getExpectedProgress()
  if (percentage < expected - 10) return 'bg-red-100 text-red-800'
  if (percentage > expected + 10) return 'bg-green-100 text-green-800'
  return 'bg-yellow-100 text-yellow-800'
}

const getStatusText = (percentage: number) => {
  const expected = getExpectedProgress()
  if (percentage < expected - 10) return 'Behind'
  if (percentage > expected + 10) return 'Ahead'
  return 'On Track'
}

const getProgressBarColor = (percentage: number) => {
  const expected = getExpectedProgress()
  if (percentage < expected - 10) return 'bg-red-500'
  if (percentage > expected + 10) return 'bg-green-500'
  return 'bg-yellow-500'
}

const viewPantryDetails = (pantry: FoodPantry) => {
  emit('view-details', pantry)
}
</script>