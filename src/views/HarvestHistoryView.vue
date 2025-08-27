<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Today's Harvest</h1>
        <p class="text-gray-600">View and manage all harvest entries</p>
      </div>

      <!-- Harvest History Component -->
      <HarvestHistory
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useHarvestStore } from '@/stores/harvest'
import { useAdminStore } from '@/stores/admin'
import { usePusher } from '@/composables/usePusher'
import AppHeader from '@/components/layout/AppHeader.vue'
import HarvestHistory from '@/components/harvest/HarvestHistory.vue'

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

const loading = computed(() => harvestLoading.value || adminLoading.value)


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
    harvestStore.fetchRecentEntries()
  ])
}

</script>