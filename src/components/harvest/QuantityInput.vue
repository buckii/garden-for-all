<template>
  <div v-if="selectedProduce" class="space-y-3">
    <!-- Selected Produce Info -->
    <div class="bg-garden-green-50 border-2 border-garden-green-200 rounded-lg p-3 text-center">
      <h2 class="text-lg font-bold text-gray-900">{{ selectedProduce.name }}</h2>
      <div class="flex justify-center items-center space-x-3 text-sm">
        <span class="text-gray-600">{{ selectedProduce.unitType || selectedProduce.unit_type }}</span>
        <span class="text-garden-green-600">${{ (selectedProduce.pricePerLb || selectedProduce.price_per_lb || 0).toFixed(2) }}/{{ getUnitAbbr(selectedProduce.unitType || selectedProduce.unit_type) }}</span>
      </div>
    </div>

    <!-- Quantity Input -->
    <div class="space-y-2">
      <label class="block text-base font-medium text-gray-700">
        Quantity ({{ selectedProduce.unitType || selectedProduce.unit_type }})
      </label>
      
      <!-- Amount Input -->
      <div class="relative">
        <input
          v-model="displayValue"
          type="text"
          readonly
          placeholder="Enter amount"
          class="block w-full px-4 py-2 text-lg font-medium border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-center text-gray-900"
        />
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center">
          <button
            v-if="displayValue !== '0'"
            @click="clearInput"
            class="p-1 text-red-500 hover:text-red-700 rounded"
            title="Clear"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <span class="text-gray-500 text-base pointer-events-none">{{ selectedProduce.unitType || selectedProduce.unit_type }}</span>
        </div>
      </div>

      <!-- Virtual Keypad for Touch -->
      <div class="grid grid-cols-3 gap-2 mt-2">
        <button
          v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
          :key="num"
          @click="appendNumber(num.toString())"
          class="py-3 px-4 bg-white border-2 border-gray-200 rounded-lg text-lg font-medium hover:border-garden-green-300 hover:bg-garden-green-50 transition-colors text-gray-900"
        >
          {{ num }}
        </button>
        
        <button
          @click="appendNumber('.')"
          class="py-3 px-4 bg-white border-2 border-gray-200 rounded-lg text-lg font-medium hover:border-garden-green-300 hover:bg-garden-green-50 transition-colors text-gray-900"
        >
          .
        </button>
        
        <button
          @click="appendNumber('0')"
          class="py-3 px-4 bg-white border-2 border-gray-200 rounded-lg text-lg font-medium hover:border-garden-green-300 hover:bg-garden-green-50 transition-colors text-gray-900"
        >
          0
        </button>
        
        <button
          @click="backspace"
          class="py-3 px-4 bg-orange-100 border-2 border-orange-200 rounded-lg text-lg font-medium hover:border-orange-300 hover:bg-orange-200 transition-colors text-orange-700"
        >
          <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Quantity Summary -->
    <div v-if="quantity > 0" class="bg-gray-50 rounded-lg p-2 text-center">
      <p class="text-lg font-bold text-garden-green-600">{{ quantity }} {{ selectedProduce.unitType || selectedProduce.unit_type }}</p>
      <p class="text-sm text-gray-500">Est. value: ${{ estimatedValue.toFixed(2) }}</p>
    </div>

    <!-- Harvester Name (Optional) -->
    <div class="space-y-1">
      <label class="block text-sm font-medium text-gray-700">
        Harvester Name (Optional)
      </label>
      <input
        v-model="harvesterName"
        type="text"
        placeholder="Who harvested this?"
        class="block w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
      />
    </div>

    <!-- Notes (Optional) -->
    <div class="space-y-1">
      <button
        v-if="!showNotesField"
        @click="showNotesField = true"
        class="text-garden-green-600 hover:text-garden-green-700 text-sm font-medium underline"
      >
        Add notes
      </button>
      <div v-if="showNotesField">
        <input
          v-model="notes"
          type="text"
          placeholder="Add any additional notes..."
          class="block w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
        />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="grid grid-cols-2 gap-3 pt-2">
      <button
        @click="$emit('back')"
        class="py-2 px-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
      >
        ← Back
      </button>
      
      <button
        @click="handleSubmit"
        :disabled="!quantity || quantity <= 0 || submitting"
        class="py-2 px-3 bg-garden-green-600 text-white rounded-lg text-sm font-medium hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
const displayValue = ref('0')
const harvesterName = ref(localStorage.getItem('harvesterName') || '')
const notes = ref('')
const showNotesField = ref(false)


const estimatedValue = computed(() => {
  if (!props.selectedProduce || !quantity.value) return 0
  const price = props.selectedProduce.pricePerLb || props.selectedProduce.price_per_lb || 0
  return quantity.value * price
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
  if (digit === '.' && displayValue.value.includes('.')) return
  
  let newDisplayValue
  
  if (displayValue.value === '0' && digit !== '.') {
    // Replace leading zero with new digit (except for decimal point)
    newDisplayValue = digit
  } else {
    // Append to existing display value
    newDisplayValue = displayValue.value + digit
  }
  
  displayValue.value = newDisplayValue
  
  // Update the numeric quantity
  const newValue = parseFloat(newDisplayValue)
  if (!isNaN(newValue)) {
    quantity.value = newValue
  }
}

const backspace = () => {
  if (displayValue.value.length <= 1 || displayValue.value === '0') {
    // Reset to 0 if only one character or already 0
    displayValue.value = '0'
    quantity.value = 0
  } else {
    // Remove last character
    displayValue.value = displayValue.value.slice(0, -1)
    
    // Update quantity
    const newValue = parseFloat(displayValue.value)
    if (!isNaN(newValue)) {
      quantity.value = newValue
    } else {
      quantity.value = 0
    }
  }
}

const clearInput = () => {
  quantity.value = 0
  displayValue.value = '0'
}

const handleSubmit = () => {
  if (!props.selectedProduce || !quantity.value || quantity.value <= 0) return
  
  emit('submit', {
    produce_type_id: props.selectedProduce.id || props.selectedProduce._id,
    quantity: quantity.value,
    unit: props.selectedProduce.unitType || props.selectedProduce.unit_type,
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
  displayValue.value = '0'
  notes.value = ''
  showNotesField.value = false
}, { immediate: true })
</script>