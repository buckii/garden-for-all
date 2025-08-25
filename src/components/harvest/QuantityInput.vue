<template>
  <div v-if="selectedProduce" class="space-y-6">
    <!-- Selected Produce Info -->
    <div class="bg-garden-green-50 border-2 border-garden-green-200 rounded-lg p-6 text-center">
      <div class="w-16 h-16 mx-auto mb-4 bg-garden-green-600 rounded-full flex items-center justify-center">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900">{{ selectedProduce.name }}</h2>
      <p class="text-lg text-gray-600">{{ selectedProduce.unit_type }}</p>
      <p class="text-sm text-garden-green-600">${{ selectedProduce.conversion_factor }}/{{ getUnitAbbr(selectedProduce.unit_type) }}</p>
    </div>

    <!-- Quantity Input -->
    <div class="space-y-4">
      <label class="block text-xl font-medium text-gray-700">
        Quantity ({{ selectedProduce.unit_type }})
      </label>
      
      <!-- Quick Amount Buttons -->
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="amount in quickAmounts"
          :key="amount"
          @click="quantity = amount"
          :class="[
            'py-4 px-6 rounded-lg text-lg font-medium border-2 transition-colors min-h-[60px]',
            quantity === amount
              ? 'bg-garden-green-600 text-white border-garden-green-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-garden-green-300'
          ]"
        >
          {{ amount }}
        </button>
      </div>
      
      <!-- Custom Amount Input -->
      <div class="relative">
        <input
          v-model.number="quantity"
          type="number"
          step="0.1"
          min="0"
          placeholder="Enter amount"
          class="block w-full px-6 py-4 text-xl font-medium border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-center text-gray-900"
        />
        <div class="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
          <span class="text-gray-500 text-lg">{{ selectedProduce.unit_type }}</span>
        </div>
      </div>

      <!-- Virtual Keypad for Touch -->
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
          :key="num"
          @click="appendNumber(num.toString())"
          class="py-4 px-6 bg-white border-2 border-gray-200 rounded-lg text-xl font-medium hover:border-garden-green-300 hover:bg-garden-green-50 transition-colors min-h-[60px] text-gray-900"
        >
          {{ num }}
        </button>
        
        <button
          @click="appendNumber('.')"
          class="py-4 px-6 bg-white border-2 border-gray-200 rounded-lg text-xl font-medium hover:border-garden-green-300 hover:bg-garden-green-50 transition-colors min-h-[60px] text-gray-900"
        >
          .
        </button>
        
        <button
          @click="appendNumber('0')"
          class="py-4 px-6 bg-white border-2 border-gray-200 rounded-lg text-xl font-medium hover:border-garden-green-300 hover:bg-garden-green-50 transition-colors min-h-[60px] text-gray-900"
        >
          0
        </button>
        
        <button
          @click="clearInput"
          class="py-4 px-6 bg-red-100 border-2 border-red-200 rounded-lg text-xl font-medium hover:border-red-300 hover:bg-red-200 transition-colors min-h-[60px] text-red-700"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Quantity Summary -->
    <div v-if="quantity > 0" class="bg-gray-50 rounded-lg p-4 text-center">
      <p class="text-lg text-gray-600">Total Harvest</p>
      <p class="text-2xl font-bold text-garden-green-600">{{ quantity }} {{ selectedProduce.unit_type }}</p>
      <p class="text-sm text-gray-500 mt-1">Est. value: ${{ estimatedValue.toFixed(2) }}</p>
    </div>

    <!-- Harvester Name (Optional) -->
    <div class="space-y-2">
      <label class="block text-lg font-medium text-gray-700">
        Harvester Name (Optional)
      </label>
      <input
        v-model="harvesterName"
        type="text"
        placeholder="Who harvested this?"
        class="block w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
      />
    </div>

    <!-- Notes (Optional) -->
    <div class="space-y-2">
      <label class="block text-lg font-medium text-gray-700">
        Notes (Optional)
      </label>
      <textarea
        v-model="notes"
        rows="3"
        placeholder="Any additional notes..."
        class="block w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
      ></textarea>
    </div>

    <!-- Action Buttons -->
    <div class="grid grid-cols-2 gap-4 pt-6">
      <button
        @click="$emit('back')"
        class="py-4 px-6 bg-gray-100 border-2 border-gray-200 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-200 transition-colors min-h-[60px]"
      >
        ← Back
      </button>
      
      <button
        @click="handleSubmit"
        :disabled="!quantity || quantity <= 0 || submitting"
        class="py-4 px-6 bg-garden-green-600 text-white rounded-lg text-lg font-medium hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[60px] flex items-center justify-center"
      >
        <svg v-if="submitting" class="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ submitting ? 'Saving...' : 'Save Harvest' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Database } from '@/lib/supabase'

type ProduceType = Database['public']['Tables']['produce_types']['Row']

interface Props {
  selectedProduce: ProduceType | null
  submitting: boolean
}

interface Emits {
  (e: 'submit', data: {
    produce_type_id: string
    quantity: number
    unit: string
    harvester_name: string
    notes: string
  }): void
  (e: 'back'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const quantity = ref<number>(0)
const harvesterName = ref(localStorage.getItem('harvesterName') || '')
const notes = ref('')

const quickAmounts = computed(() => {
  if (!props.selectedProduce) return []
  
  // Different quick amounts based on unit type
  switch (props.selectedProduce.unit_type) {
    case 'pounds':
      return [1, 2, 5, 10, 15, 20]
    case 'pints':
      return [1, 2, 4, 6, 8, 12]
    case 'bunches':
      return [1, 2, 3, 5, 10, 15]
    default:
      return [1, 2, 5, 10, 15, 20]
  }
})

const estimatedValue = computed(() => {
  if (!props.selectedProduce || !quantity.value) return 0
  return quantity.value * props.selectedProduce.conversion_factor
})

const getUnitAbbr = (unitType: string) => {
  switch (unitType) {
    case 'pounds': return 'lb'
    case 'pints': return 'pt'
    case 'bunches': return 'bunch'
    default: return unitType
  }
}

const appendNumber = (digit: string) => {
  if (digit === '.' && quantity.value.toString().includes('.')) return
  
  const currentStr = quantity.value.toString()
  const newStr = currentStr === '0' ? digit : currentStr + digit
  const newValue = parseFloat(newStr)
  
  if (!isNaN(newValue)) {
    quantity.value = newValue
  }
}

const clearInput = () => {
  quantity.value = 0
}

const handleSubmit = () => {
  if (!props.selectedProduce || !quantity.value || quantity.value <= 0) return
  
  emit('submit', {
    produce_type_id: props.selectedProduce.id,
    quantity: quantity.value,
    unit: props.selectedProduce.unit_type,
    harvester_name: harvesterName.value.trim(),
    notes: notes.value.trim()
  })
}

// Save harvester name to localStorage when it changes
watch(harvesterName, (newName) => {
  if (newName.trim()) {
    localStorage.setItem('harvesterName', newName.trim())
  } else {
    localStorage.removeItem('harvesterName')
  }
})

// Reset form when produce changes (but keep harvester name)
watch(() => props.selectedProduce, () => {
  quantity.value = 0
  notes.value = ''
}, { immediate: true })
</script>