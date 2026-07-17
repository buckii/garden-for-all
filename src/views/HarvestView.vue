<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-4xl mx-auto px-4 py-4">
      <!-- Success Message -->
      <div v-if="successMessage" class="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700">{{ successMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd" />
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
        <div class="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
          <!-- Step 1: Select Produce -->
          <ProduceSelector v-if="currentStep === 'select'" :produce-types="produceTypes" :categories="categories"
            :loading="loading" :recently-used="recentlyUsedProduce" :harvest-entries="recentEntries" @select="handleProduceSelect" />

          <!-- Step 2: Enter Quantity -->
          <QuantityInput v-if="currentStep === 'quantity'" :selected-produce="selectedProduce" :pantries="pantries"
            :locations="harvestLocations" :submitting="submitting" @submit="handleHarvestSubmit" @back="currentStep = 'select'" />

          <!-- Step 3: Review & History -->
          <HarvestHistory v-if="currentStep === 'history'" :todays-entries="todaysEntries" :produce-types="produceTypes"
            :loading="loading" @edit="handleEditEntry" @delete="handleDeleteEntry" @add-another="handleAddAnother"
            @refresh="refreshData" />
        </div>
      </div>
    </div>

    <!-- Harvest Entry Edit Modal -->
    <HarvestEditModal
      ref="harvestEditModalRef"
      :show="showHarvestEditModal"
      :entry="selectedEntryForEdit"
      :pantries="pantries"
      :produce-types="produceTypes"
      @close="closeHarvestEditModal"
      @saved="handleHarvestEntrySaved"
    />
  </div>
</template>

<script setup lang="ts">
import HarvestHistory from '@/components/harvest/HarvestHistory.vue'
import HarvestEditModal from '@/components/harvest/HarvestEditModal.vue'
import ProduceSelector from '@/components/harvest/ProduceSelector.vue'
import QuantityInput from '@/components/harvest/QuantityInput.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { usePusher } from '@/composables/usePusher'
import { useAdminStore } from '@/stores/admin'
import { useHarvestStore } from '@/stores/harvest'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'


type ProduceType = Database['public']['Tables']['produce_types']['Row']
type HarvestEntry = Database['public']['Tables']['harvest_entries']['Row']

const router = useRouter()
const harvestStore = useHarvestStore()
const adminStore = useAdminStore()
const { subscribeToHarvestUpdates } = usePusher()

const currentStep = ref<'select' | 'quantity' | 'history'>('select')
const selectedProduce = ref<ProduceType | null>(null)
const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const showHarvestEditModal = ref(false)
const selectedEntryForEdit = ref<any>(null)
const harvestEditModalRef = ref<any>(null)

// Access stores through computed properties to ensure reactivity
const todaysEntries = computed(() => harvestStore.todaysEntries)
const produceTypes = computed(() => harvestStore.produceTypes)
const recentEntries = computed(() => harvestStore.recentEntries)
const harvestEntries = computed(() => harvestStore.harvestEntries)
const harvestLoading = computed(() => harvestStore.loading)

const categories = computed(() => adminStore.categories)
const pantries = computed(() => adminStore.foodPantries)
const harvestLocations = ref([])
const adminLoading = computed(() => adminStore.loading)

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Fetch harvest locations
const fetchHarvestLocations = async () => {
  try {
    const response = await fetch(`${API_BASE}/harvest-locations`)
    if (response.ok) {
      const result = await response.json()
      harvestLocations.value = result.data || []
    }
  } catch (error) {
    console.error('Failed to fetch harvest locations:', error)
  }
}

const loading = computed(() => harvestLoading.value || adminLoading.value)

// Recently used produce (from recent entries, within 2 months)
const recentlyUsedProduce = computed(() => {
  const recentProduceIds = new Set()
  const recentProduce: ProduceType[] = []
  const entries = harvestStore.recentEntries || []
  const produces = harvestStore.produceTypes || []
  
  // Filter entries to only include those from the last 2 months
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

  for (const entry of entries.slice(0, 6)) {
    const entryDate = new Date(entry.harvestDate || entry.harvest_date)
    
    // Only include entries from the last 2 months
    if (entryDate >= twoMonthsAgo && !recentProduceIds.has(entry.produce_type_id)) {
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
    fetchHarvestLocations(),
    harvestStore.fetchTodaysHarvest(),
    harvestStore.fetchRecentEntries(1000) // Fetch more entries for usage analysis
  ])
  

  // Subscribe to real-time updates
  subscribeToHarvestUpdates((data) => {
    harvestStore.fetchTodaysHarvest()
    harvestStore.fetchRecentEntries(1000)
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

    // Redirect to harvest history to show today's status
    router.push('/harvest-history')

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
  selectedEntryForEdit.value = entry
  showHarvestEditModal.value = true
}

const closeHarvestEditModal = () => {
  showHarvestEditModal.value = false
  selectedEntryForEdit.value = null
}

const handleHarvestEntrySaved = async (data: any) => {
  clearMessages()
  try {
    await harvestStore.updateHarvestEntry(data._id, {
      produceTypeId: data.produceTypeId,
      pantryId: data.pantryId,
      quantity: data.quantity,
      unit: data.unit,
      weight: data.weight,
      harvestDate: data.harvestDate,
      harvesterName: data.harvesterName,
      notes: data.notes
    })
    closeHarvestEditModal()
    await refreshData()
    successMessage.value = 'Entry updated successfully'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Failed to update entry:', error)
    harvestEditModalRef.value?.setError(
      error?.message || 'Failed to update harvest entry. Please try again.'
    )
  }
}

const handleDeleteEntry = async (entry: HarvestEntry) => {
  try {
    await harvestStore.deleteHarvestEntry(entry._id)
    await refreshData()
    successMessage.value = 'Entry deleted successfully'

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Failed to delete entry:', error)
    errorMessage.value = error?.message || 'Failed to delete entry. Please try again.'

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
    harvestStore.fetchRecentEntries(1000)
  ])
}

const clearMessages = () => {
  successMessage.value = ''
  errorMessage.value = ''
}
</script>