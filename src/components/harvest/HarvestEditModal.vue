<template>
  <!-- Modal Overlay -->
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-6 border max-w-2xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Modal Header -->
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold text-gray-900">Edit Harvest Entry</h3>
          <button @click="close" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Error/Success Messages -->
        <div v-if="error" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div v-if="success" class="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
          <p class="text-sm text-green-700">{{ success }}</p>
        </div>

        <form @submit.prevent="saveEntry" class="space-y-6">
          <div class="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Produce Type -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Produce</label>
              <select v-model="editForm.produceTypeId" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="">Select produce...</option>
                <option v-for="produceType in produceTypes" :key="produceType.id || produceType._id"
                  :value="produceType.id || produceType._id">
                  {{ produceType.name }}
                </option>
              </select>
            </div>

            <!-- Quantity (hidden when unit is pounds since weight covers it) -->
            <div v-if="editForm.unit !== 'pounds'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Quantity ({{ editForm.unit }})</label>
              <input type="number" v-model.number="editForm.quantity" step="0.01" min="0"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>

            <!-- Weight -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
              <input type="number" v-model.number="editForm.weight" step="0.01" min="0" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>

            <!-- Harvest Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
              <input type="date" v-model="editForm.harvestDate" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>

            <!-- Pantry -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Food Pantry <span class="text-gray-400 text-xs">(optional)</span></label>
              <select v-model="editForm.pantryId"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                <option value="">Save in Inventory (no pantry)</option>
                <option v-for="pantry in pantries" :key="pantry.id || pantry._id" :value="pantry.id || pantry._id">
                  {{ pantry.name }}
                </option>
              </select>
            </div>

            <!-- Harvester Name -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Entered By Name <span class="text-gray-400 text-xs">(optional)</span></label>
              <input type="text" v-model="editForm.harvesterName" placeholder="Who harvested this?"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
            </div>

            <!-- Notes -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes <span class="text-gray-400 text-xs">(optional)</span></label>
              <textarea v-model="editForm.notes" rows="3"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500 resize-none"></textarea>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="flex justify-end space-x-4 pt-4 border-t">
            <button type="button" @click="close"
              class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" :disabled="loading"
              class="px-6 py-2 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <span v-if="loading">Saving...</span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface EditHarvest {
  _id: string
  produceTypeId: string
  pantryId: string
  quantity: number
  unit: string
  weight: number
  harvestDate: string
  harvesterName: string
  notes: string
}

const props = defineProps<{
  show: boolean
  entry: any | null
  pantries: any[]
  produceTypes: any[]
}>()

const emit = defineEmits<{
  close: []
  saved: [data: EditHarvest]
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const editForm = ref<EditHarvest>({
  _id: '',
  produceTypeId: '',
  pantryId: '',
  quantity: 0,
  unit: 'pounds',
  weight: 0,
  harvestDate: '',
  harvesterName: '',
  notes: ''
})

// Populate form when the entry to edit changes
watch(() => props.entry, (entry) => {
  if (entry) {
    editForm.value = {
      _id: entry._id || entry.id,
      produceTypeId: entry.produceTypeId || entry.produce_type_id || '',
      pantryId: entry.pantryId || entry.pantry_id || '',
      quantity: entry.quantity || 0,
      unit: entry.unit || 'pounds',
      weight: entry.weight || 0,
      harvestDate: entry.harvestDate
        ? String(entry.harvestDate).split('T')[0]
        : (entry.harvest_date ? String(entry.harvest_date).split('T')[0] : ''),
      harvesterName: entry.harvesterName || entry.harvester_name || '',
      notes: entry.notes || ''
    }
    error.value = null
    success.value = null
  }
}, { immediate: true })

const saveEntry = async () => {
  loading.value = true
  error.value = null
  success.value = null

  try {
    emit('saved', { ...editForm.value })
  } finally {
    loading.value = false
  }
}

// Allow the parent to surface an error and reset the loading state
const setError = (message: string) => {
  error.value = message
  loading.value = false
}

const close = () => {
  error.value = null
  success.value = null
  emit('close')
}

defineExpose({ setError })
</script>
