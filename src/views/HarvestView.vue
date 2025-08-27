<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-4xl mx-auto px-4 py-4">
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
      <div class="space-y-6">
        <!-- Step Content -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <!-- Step 1: Select Produce -->
          <ProduceSelector
            v-if="currentStep === 'select'"
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
            :pantries="pantries"
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
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useHarvestStore } from '@/stores/harvest'
import { useAdminStore } from '@/stores/admin'
import { usePusher } from '@/composables/usePusher'
import AppHeader from '@/components/layout/AppHeader.vue'
import ProduceSelector from '@/components/harvest/ProduceSelector.vue'
import QuantityInput from '@/components/harvest/QuantityInput.vue'
import HarvestHistory from '@/components/harvest/HarvestHistory.vue'


type ProduceType = Database['public']['Tables']['produce_types']['Row']
type HarvestEntry = Database['public']['Tables']['harvest_entries']['Row']

const harvestStore = useHarvestStore()
const adminStore = useAdminStore()
const { subscribeToHarvestUpdates } = usePusher()

const currentStep = ref<'select' | 'quantity' | 'history'>('select')
const selectedProduce = ref<ProduceType | null>(null)
const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Access stores through computed properties to ensure reactivity
const todaysEntries = computed(() => harvestStore.todaysEntries)
const produceTypes = computed(() => harvestStore.produceTypes)
const recentEntries = computed(() => harvestStore.recentEntries)
const harvestLoading = computed(() => harvestStore.loading)

const categories = computed(() => adminStore.categories)
const pantries = computed(() => adminStore.foodPantries)
const adminLoading = computed(() => adminStore.loading)

// Add watchers for debugging
watch(() => produceTypes.value.length, (newLength, oldLength) => {
  console.log('🔄 produceTypes length changed:', oldLength, '->', newLength)
}, { immediate: true })

watch(() => categories.value.length, (newLength, oldLength) => {
  console.log('🔄 categories length changed:', oldLength, '->', newLength)
}, { immediate: true })

const loading = computed(() => harvestLoading.value || adminLoading.value)

// Recently used produce (from recent entries)
const recentlyUsedProduce = computed(() => {
  const recentProduceIds = new Set()
  const recentProduce: ProduceType[] = []
  const entries = harvestStore.recentEntries || []
  const produces = harvestStore.produceTypes || []
  
  for (const entry of entries.slice(0, 6)) {
    if (!recentProduceIds.has(entry.produce_type_id)) {
      const produce = produces.find(p => p.id === entry.produce_type_id)
      if (produce) {
        recentProduce.push(produce)
        recentProduceIds.add(entry.produce_type_id)
      }
    }
  }
  
  return recentProduce
})

onMounted(async () => {
  // Wait for the next tick to ensure all reactive connections are established
  await nextTick()
  
  await Promise.all([
    harvestStore.fetchProduceTypes(),
    adminStore.fetchCategories(),
    adminStore.fetchFoodPantries(),
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
</script>