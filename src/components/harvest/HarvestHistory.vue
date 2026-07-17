<template>
  <div class="space-y-4">
    <!-- Compact Summary -->
    <div class="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <div class="text-center bg-garden-green-50 rounded-lg py-3 px-1">
          <p class="text-xs text-gray-500">Entries</p>
          <p class="text-lg sm:text-xl font-bold text-garden-green-600">{{ todaysEntries.length }}</p>
        </div>
        <div class="text-center bg-garden-green-50 rounded-lg py-3 px-1">
          <p class="text-xs text-gray-500">Quantity</p>
          <p class="text-lg sm:text-xl font-bold text-garden-green-600">
            {{ totalQuantity.toLocaleString('en-US', { maximumFractionDigits: 0 }) }}<span class="text-xs font-normal text-gray-500"> lbs</span>
          </p>
        </div>
        <div class="text-center bg-garden-green-50 rounded-lg py-3 px-1">
          <p class="text-xs text-gray-500">Value</p>
          <p class="text-lg sm:text-xl font-bold text-garden-green-600">${{ totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) }}</p>
        </div>
      </div>
    </div>

    <!-- Add Harvest Button (top) -->
    <button v-if="showTopAddButton" @click="$emit('add-another')"
      class="w-full py-4 px-6 bg-garden-green-600 text-white rounded-lg text-lg font-medium hover:bg-garden-green-700 transition-colors min-h-[60px] flex items-center justify-center space-x-2">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <span>Add Harvest</span>
    </button>

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
        <button @click="$emit('refresh')" class="mt-3 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          Refresh to check for new entries
        </button>
      </div>

      <div v-else class="space-y-3">
        <div v-for="entry in sortedEntries" :key="entryKey(entry)"
          class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden">

          <!-- Collapsed summary row: produce, pantry, weight are the priority.
               The whole row is the toggle so it's an easy touch target. -->
          <button type="button" @click="toggleEntry(entry)"
            class="w-full flex items-center gap-2.5 p-3.5 text-left">
            <div class="w-9 h-9 bg-garden-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-garden-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-base sm:text-lg font-bold text-gray-900">
                {{ getProduceName(entry.produce_type_id) }}
              </h3>
              <div class="flex items-baseline justify-between gap-2">
                <p class="text-sm sm:text-base text-gray-600 truncate">
                  <span v-if="entry.pantry?.name">{{ entry.pantry.name }}</span>
                  <span v-else class="text-gray-400 italic">Unallocated</span>
                </p>
                <span class="text-lg font-bold text-garden-green-600 whitespace-nowrap flex-shrink-0">
                  {{ getEntryWeight(entry).toLocaleString('en-US', { maximumFractionDigits: 1 }) }}<span class="text-sm font-medium text-gray-500"> lbs</span>
                </span>
              </div>
            </div>
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform"
              :class="{ 'rotate-180': isExpanded(entry) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Expanded detail: discreet secondary info with small labels above values -->
          <div v-if="isExpanded(entry)" class="px-4 pb-4">
            <div class="pt-3 border-t border-gray-100 grid grid-cols-3 gap-3">
              <div>
                <p class="text-xs text-gray-400">Value</p>
                <p class="text-sm font-medium text-garden-green-600">${{ getEntryValue(entry).toFixed(2) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">Time</p>
                <p class="text-sm font-medium text-gray-700">{{ formatTime(entry.created_at) }}</p>
              </div>
              <div v-if="entry.unit !== 'pounds'">
                <p class="text-xs text-gray-400">Quantity</p>
                <p class="text-sm font-medium text-gray-700 whitespace-nowrap">{{ entry.quantity }} {{ entry.unit }}</p>
              </div>
              <div v-if="entry.harvester_name">
                <p class="text-xs text-gray-400">Harvester</p>
                <p class="text-sm font-medium text-gray-700 truncate">{{ entry.harvester_name }}</p>
              </div>
            </div>

            <div v-if="entry.notes" class="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
              <span class="text-gray-500">Notes:</span> {{ entry.notes }}
            </div>

            <div class="mt-3 flex gap-2">
              <button @click.stop="editEntry(entry)"
                class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button @click.stop="deleteEntry(entry)"
                class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="pt-4">
      <button @click="$emit('add-another')"
        class="w-full py-4 px-6 bg-garden-green-600 text-white rounded-lg text-lg font-medium hover:bg-garden-green-700 transition-colors min-h-[60px] flex items-center justify-center space-x-2">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add to Harvest</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'


type HarvestEntry = Database['public']['Tables']['harvest_entries']['Row']
type ProduceType = Database['public']['Tables']['produce_types']['Row']

interface Props {
  todaysEntries: HarvestEntry[]
  produceTypes: ProduceType[]
  loading: boolean
  showTopAddButton?: boolean
}

interface Emits {
  (e: 'edit', entry: HarvestEntry): void
  (e: 'delete', entry: HarvestEntry): void
  (e: 'add-another'): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Entries render collapsed by default; tapping a card toggles its detail.
// Reassign a new Set each change so the ref stays reactive.
const expandedEntries = ref<Set<string>>(new Set())

const entryKey = (entry: HarvestEntry) => String(entry.id ?? entry._id ?? '')

const isExpanded = (entry: HarvestEntry) => expandedEntries.value.has(entryKey(entry))

const toggleEntry = (entry: HarvestEntry) => {
  const key = entryKey(entry)
  const next = new Set(expandedEntries.value)
  next.has(key) ? next.delete(key) : next.add(key)
  expandedEntries.value = next
}

// Newest harvest first. Fall back to 0 for entries missing a timestamp so they
// sort to the bottom rather than throwing off the order.
const sortedEntries = computed(() => {
  return [...props.todaysEntries].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
    return bTime - aTime
  })
})

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