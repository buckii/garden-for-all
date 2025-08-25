<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Header -->
    <nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="flex items-center">
              <div class="w-8 h-8 bg-garden-green-600 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
                </svg>
              </div>
              <h1 class="ml-3 text-xl font-semibold text-gray-900">Garden For All</h1>
            </router-link>
          </div>
          
          <div class="flex items-center space-x-4">
            <router-link 
              to="/dashboard"
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </router-link>
            <router-link 
              to="/admin"
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Admin
            </router-link>
            
            <!-- User Info & Logout (only show if authenticated) -->
            <div v-if="isAuthenticated" class="flex items-center space-x-3 pl-4 border-l border-gray-300">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-garden-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-garden-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div class="text-sm">
                  <p class="text-gray-700 font-medium">{{ userDisplayName }}</p>
                  <p class="text-gray-500 text-xs" v-if="isAdmin">Admin</p>
                </div>
              </div>
              <button
                @click="handleSignOut"
                class="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 py-6">
      <!-- Success Message -->
      <div 
        v-if="successMessage" 
        class="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700">{{ successMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div 
        v-if="errorMessage" 
        class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="space-y-8">
        <!-- Step Indicator -->
        <div class="flex justify-center">
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <div 
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                  currentStep === 'select' 
                    ? 'bg-garden-green-600 text-white' 
                    : selectedProduce
                    ? 'bg-garden-green-100 text-garden-green-600'
                    : 'bg-gray-200 text-gray-500'
                ]"
              >
                1
              </div>
              <span class="ml-2 text-sm font-medium text-gray-700">Select Produce</span>
            </div>
            
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            
            <div class="flex items-center">
              <div 
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                  currentStep === 'quantity' 
                    ? 'bg-garden-green-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                ]"
              >
                2
              </div>
              <span class="ml-2 text-sm font-medium text-gray-700">Enter Quantity</span>
            </div>

            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            
            <div class="flex items-center">
              <div 
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                  currentStep === 'history' 
                    ? 'bg-garden-green-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                ]"
              >
                3
              </div>
              <span class="ml-2 text-sm font-medium text-gray-700">Review & Continue</span>
            </div>
          </div>
        </div>

        <!-- Step Content -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <!-- Loading State for Produce Data -->
          <div v-if="(currentStep === 'select') && (!produceTypes.length || !categories.length)" 
               class="flex justify-center items-center py-12">
            <div class="text-center">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-garden-green-600 mx-auto mb-4"></div>
              <p class="text-gray-500">Loading produce types...</p>
            </div>
          </div>
          
          <!-- Step 1: Select Produce -->
          <ProduceSelector
            v-else-if="currentStep === 'select'"
            :produce-types="produceTypes"
            :categories="categories"
            :loading="loading"
            :recently-used="recentlyUsedProduce"
            @select="handleProduceSelect"
          />

          <!-- Step 2: Enter Quantity -->
          <QuantityInput
            v-if="currentStep === 'quantity'"
            :selected-produce="selectedProduce"
            :submitting="submitting"
            @submit="handleHarvestSubmit"
            @back="currentStep = 'select'"
          />

          <!-- Step 3: Review & History -->
          <HarvestHistory
            v-if="currentStep === 'history'"
            :todays-entries="todaysEntries"
            :produce-types="produceTypes"
            :loading="loading"
            @edit="handleEditEntry"
            @delete="handleDeleteEntry"
            @add-another="handleAddAnother"
            @refresh="refreshData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHarvestStore } from '@/stores/harvest'
import { useAdminStore } from '@/stores/admin'
import { usePusher } from '@/composables/usePusher'
import { useAuth } from '@/composables/useAuth'
import ProduceSelector from '@/components/harvest/ProduceSelector.vue'
import QuantityInput from '@/components/harvest/QuantityInput.vue'
import HarvestHistory from '@/components/harvest/HarvestHistory.vue'


type ProduceType = Database['public']['Tables']['produce_types']['Row']
type HarvestEntry = Database['public']['Tables']['harvest_entries']['Row']

const router = useRouter()
const harvestStore = useHarvestStore()
const adminStore = useAdminStore()
const { subscribeToHarvestUpdates } = usePusher()
const { user, isAuthenticated, isAdmin, signOut } = useAuth()

const currentStep = ref<'select' | 'quantity' | 'history'>('select')
const selectedProduce = ref<ProduceType | null>(null)
const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Computed properties from stores
const { 
  todaysEntries, 
  produceTypes, 
  recentEntries,
  loading: harvestLoading 
} = harvestStore

const { 
  categories,
  loading: adminLoading 
} = adminStore

const loading = computed(() => harvestLoading || adminLoading)

// User display name
const userDisplayName = computed(() => {
  if (!user.value) return 'User'
  return user.value.email?.split('@')[0] || user.value.email || 'User'
})

// Recently used produce (from recent entries)
const recentlyUsedProduce = computed(() => {
  const recentProduceIds = new Set()
  const recentProduce: ProduceType[] = []
  
  for (const entry of recentEntries.slice(0, 6)) {
    if (!recentProduceIds.has(entry.produce_type_id)) {
      const produce = produceTypes.find(p => p.id === entry.produce_type_id)
      if (produce) {
        recentProduce.push(produce)
        recentProduceIds.add(entry.produce_type_id)
      }
    }
  }
  
  return recentProduce
})

onMounted(async () => {
  await Promise.all([
    harvestStore.fetchProduceTypes(),
    adminStore.fetchCategories(),
    harvestStore.fetchTodaysHarvest(),
    harvestStore.fetchRecentEntries()
  ])

  // Subscribe to real-time updates
  subscribeToHarvestUpdates((data) => {
    harvestStore.fetchTodaysHarvest()
    harvestStore.fetchRecentEntries()
  })
})

const handleProduceSelect = (produce: ProduceType) => {
  selectedProduce.value = produce
  currentStep.value = 'quantity'
  clearMessages()
}

const handleHarvestSubmit = async (data: any) => {
  submitting.value = true
  clearMessages()
  
  try {
    await harvestStore.createHarvestEntry(data)
    
    // Show success message
    const produceName = selectedProduce.value?.name || 'item'
    successMessage.value = `Successfully recorded ${data.quantity} ${data.unit} of ${produceName}!`
    
    // Move to history step
    currentStep.value = 'history'
    
    // Auto-clear success message
    setTimeout(() => {
      successMessage.value = ''
    }, 5000)
    
  } catch (error) {
    console.error('Failed to create harvest entry:', error)
    errorMessage.value = 'Failed to save harvest entry. Please try again.'
    
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  } finally {
    submitting.value = false
  }
}

const handleEditEntry = (entry: HarvestEntry) => {
  // TODO: Implement edit functionality
  console.log('Edit entry:', entry)
}

const handleDeleteEntry = async (entry: HarvestEntry) => {
  try {
    await harvestStore.deleteHarvestEntry(entry.id)
    successMessage.value = 'Entry deleted successfully'
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Failed to delete entry:', error)
    errorMessage.value = 'Failed to delete entry. Please try again.'
    
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  }
}

const handleAddAnother = () => {
  selectedProduce.value = null
  currentStep.value = 'select'
  clearMessages()
}

const refreshData = async () => {
  await Promise.all([
    harvestStore.fetchTodaysHarvest(),
    harvestStore.fetchRecentEntries()
  ])
}

const clearMessages = () => {
  successMessage.value = ''
  errorMessage.value = ''
}

const handleSignOut = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Sign out failed:', error)
  }
}
</script>