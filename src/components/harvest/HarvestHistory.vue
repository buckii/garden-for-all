<template>
  <div class="space-y-6">
    <!-- Header with Summary -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900">Today's Harvest</h2>
        <div class="text-right">
          <p class="text-sm text-gray-500">Total Entries</p>
          <p class="text-2xl font-bold text-garden-green-600">{{ todaysEntries.length }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="text-center bg-garden-green-50 rounded-lg p-4">
          <p class="text-sm text-gray-600">Total Quantity</p>
          <p class="text-xl font-bold text-garden-green-600">{{ totalQuantity.toFixed(1) }}</p>
          <p class="text-xs text-gray-500">lbs</p>
        </div>
        <div class="text-center bg-garden-green-50 rounded-lg p-4">
          <p class="text-sm text-gray-600">Estimated Value</p>
          <p class="text-xl font-bold text-garden-green-600">${{ totalValue.toFixed(2) }}</p>
        </div>
      </div>
    </div>

    <!-- Entries List -->
    <div class="space-y-3">
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
      </div>

      <div v-else-if="todaysEntries.length === 0" class="text-center py-12 bg-white rounded-lg shadow-sm border">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-4 text-lg text-gray-500">No harvest entries today</p>
        <p class="text-sm text-gray-400">Start by adding your first harvest entry</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="entry in todaysEntries" :key="entry.id"
          class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <div class="w-10 h-10 bg-garden-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-garden-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ getProduceName(entry.produce_type_id) }}</h3>
                  <p class="text-sm text-gray-500">{{ getCategoryName(entry) }}</p>
                </div>
              </div>

              <div class="space-y-2 text-sm">
                <div class="flex flex-wrap gap-x-6 gap-y-2">
                  <div v-if="entry.unit !== 'pounds'" class="flex items-center">
                    <span class="text-gray-500">Quantity:</span>
                    <span class="font-medium ml-1 whitespace-nowrap">{{ entry.quantity }} {{ entry.unit }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-gray-500">Weight:</span>
                    <span class="font-medium ml-1 whitespace-nowrap">{{ getEntryWeight(entry).toFixed(2) }} lbs</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-gray-500">Value:</span>
                    <span class="font-medium text-garden-green-600 ml-1 whitespace-nowrap">${{
                      getEntryValue(entry).toFixed(2) }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-gray-500">Time:</span>
                    <span class="font-medium ml-1 whitespace-nowrap">{{ formatTime(entry.created_at) }}</span>
                  </div>
                </div>
                <div v-if="entry.harvester_name" class="flex items-center">
                  <span class="text-gray-500">Harvester:</span>
                  <span class="font-medium ml-1">{{ entry.harvester_name }}</span>
                </div>
              </div>

              <div v-if="entry.notes" class="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                <span class="text-gray-500">Notes:</span> {{ entry.notes }}
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-2 ml-4">
              <button @click="editEntry(entry)"
                class="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors min-h-[44px] min-w-[44px]"
                title="Edit">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button @click="deleteEntry(entry)"
                class="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px]"
                title="Delete">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 gap-4 pt-4">
      <button @click="$emit('add-another')"
        class="py-4 px-6 bg-garden-green-600 text-white rounded-lg text-lg font-medium hover:bg-garden-green-700 transition-colors min-h-[60px]">
        + Add Another
      </button>
      <button @click="refreshEntries"
        class="py-4 px-6 bg-white border-2 border-garden-green-600 text-garden-green-600 rounded-lg text-lg font-medium hover:bg-garden-green-50 transition-colors min-h-[60px]">
        🔄 Refresh
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'


type HarvestEntry = Database['public']['Tables']['harvest_entries']['Row']
type ProduceType = Database['public']['Tables']['produce_types']['Row']

interface Props {
  todaysEntries: HarvestEntry[]
  produceTypes: ProduceType[]
  loading: boolean
}

interface Emits {
  (e: 'edit', entry: HarvestEntry): void
  (e: 'delete', entry: HarvestEntry): void
  (e: 'add-another'): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const totalQuantity = computed(() => {
  return props.todaysEntries.reduce((total, entry) => {
    // Use actual weight if available, otherwise calculate from quantity
    if (entry.weight && entry.weight > 0) {
      return total + entry.weight
    }
    // Fallback to calculated weight
    const produceType = props.produceTypes.find(p => p.id === entry.produce_type_id || p._id === entry.produceTypeId)
    const conversionFactor = produceType?.conversion_factor || produceType?.conversionFactor || 1
    return total + (entry.quantity * conversionFactor)
  }, 0)
})

const totalValue = computed(() => {
  return props.todaysEntries.reduce((total, entry) => {
    return total + getEntryValue(entry)
  }, 0)
})

const getProduceName = (produceTypeId: string) => {
  const produceType = props.produceTypes.find(p => p.id === produceTypeId)
  return produceType?.name || 'Unknown'
}

const getCategoryName = (entry: HarvestEntry) => {
  // First try to get category from the populated produceType
  if (entry.produceType?.category?.name) {
    return entry.produceType.category.name
  }

  // Fallback to finding the produce type and getting its category
  const produceType = props.produceTypes.find(p => p.id === entry.produce_type_id || p._id === entry.produceTypeId)
  if (produceType?.category?.name) {
    return produceType.category.name
  }

  // Map category ID to name if category object is not populated
  if (produceType?.category_id || produceType?.categoryId) {
    const categoryId = produceType.category_id || produceType.categoryId
    // Common category mappings based on the seed data
    const categoryMap: Record<string, string> = {
      'fruit': 'Fruit',
      'greens': 'Greens',
      'herbs': 'Herbs',
      'vegetables': 'Vegetables'
    }
    return categoryMap[categoryId] || 'Produce'
  }

  return 'Produce'
}

const getEntryWeight = (entry: HarvestEntry) => {
  // Use actual weight if available, otherwise calculate from quantity
  if (entry.weight && entry.weight > 0) {
    return entry.weight
  }
  // Fallback to calculated weight
  const produceType = props.produceTypes.find(p => p.id === entry.produce_type_id || p._id === entry.produceTypeId)
  const conversionFactor = produceType?.conversion_factor || produceType?.conversionFactor || 1
  return entry.quantity * conversionFactor
}

const getEntryValue = (entry: HarvestEntry) => {
  const produceType = props.produceTypes.find(p => p.id === entry.produce_type_id || p._id === entry.produceTypeId)
  const pricePerLb = produceType?.price_per_lb || produceType?.pricePerLb || 0
  
  // Use actual weight for value calculation
  const weight = getEntryWeight(entry)
  return weight * pricePerLb
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const editEntry = (entry: HarvestEntry) => {
  emit('edit', entry)
}

const deleteEntry = (entry: HarvestEntry) => {
  if (confirm(`Are you sure you want to delete this ${getProduceName(entry.produce_type_id)} entry?`)) {
    emit('delete', entry)
  }
}

const refreshEntries = () => {
  emit('refresh')
}
</script>