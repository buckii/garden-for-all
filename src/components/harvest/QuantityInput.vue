<template>
  <div v-if="selectedProduce" class="space-y-3">
    <!-- Selected Produce Info with Back Button -->
    <div class="bg-garden-green-50 border-2 border-garden-green-200 rounded-lg p-3">
      <div class="flex items-start">
        <button @click="$emit('back')"
          class="mr-3 py-1 px-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center">
          ← Back
        </button>
        <div class="flex-1 text-center">
          <h2 class="text-lg font-bold text-gray-900">{{ selectedProduce.name }}</h2>
          <div class="flex justify-center items-center space-x-3 text-sm">
            <span class="text-gray-600">{{ selectedProduce.unitType || selectedProduce.unit_type }}</span>
            <span class="text-garden-green-600">${{ (selectedProduce.pricePerLb || selectedProduce.price_per_lb ||
              0).toFixed(2) }}/{{ getUnitAbbr(selectedProduce.unitType || selectedProduce.unit_type) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Fields -->
    <div class="space-y-2">
      <!-- For pounds: show weight field only -->
      <div v-if="isPoundsUnit" class="w-full">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Weight (lbs)
        </label>
        <div @click="activeField = 'weight'" class="relative cursor-pointer">
          <input
            :value="activeField === 'weight' ? displayValue : (weight > 0 ? weight.toString() : '0')"
            type="text" readonly placeholder="Tap to enter" :class="[
              'block w-full px-3 py-2 text-lg font-medium border-2 rounded-lg text-center text-gray-900 transition-colors',
              activeField === 'weight'
                ? 'border-garden-green-500 bg-garden-green-50 ring-2 ring-garden-green-200'
                : 'border-gray-200 hover:border-gray-300'
            ]" />
          <div class="absolute inset-y-0 right-0 pr-2 flex items-center">
            <span class="text-gray-500 text-xs pointer-events-none">lbs</span>
          </div>
        </div>
      </div>
      
      <!-- For non-pounds: show quantity field only -->
      <div v-else class="w-full">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Quantity ({{ selectedProduce.unitType || selectedProduce.unit_type }})
        </label>
        <div @click="activeField = 'quantity'" class="relative cursor-pointer">
          <input :value="activeField === 'quantity' ? displayValue : (quantity > 0 ? quantity.toString() : '0')"
            type="text" readonly placeholder="Tap to enter" :class="[
              'block w-full px-3 py-2 text-lg font-medium border-2 rounded-lg text-center text-gray-900 transition-colors',
              activeField === 'quantity'
                ? 'border-garden-green-500 bg-garden-green-50 ring-2 ring-garden-green-200'
                : 'border-gray-200 hover:border-gray-300'
            ]" />
          <div class="absolute inset-y-0 right-0 pr-2 flex items-center">
            <span class="text-gray-500 text-xs pointer-events-none">{{ selectedProduce.unitType ||
              selectedProduce.unit_type }}</span>
          </div>
        </div>
      </div>


      <!-- Virtual Keypad for Touch -->
      <div class="grid grid-cols-3 gap-2 mt-3">
        <button v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="num" @click="appendNumber(num.toString())"
          class="py-3 px-4 bg-white border-2 border-gray-200 rounded-lg text-lg font-medium hover:border-garden-green-300 hover:bg-garden-green-50 transition-colors text-gray-900">
          {{ num }}
        </button>

        <button @click="appendNumber('.')"
          class="py-3 px-4 bg-white border-2 border-gray-200 rounded-lg text-lg font-medium hover:border-garden-green-300 hover:bg-garden-green-50 transition-colors text-gray-900">
          .
        </button>

        <button @click="appendNumber('0')"
          class="py-3 px-4 bg-white border-2 border-gray-200 rounded-lg text-lg font-medium hover:border-garden-green-300 hover:bg-garden-green-50 transition-colors text-gray-900">
          0
        </button>

        <button @click="backspace"
          class="py-3 px-4 bg-orange-100 border-2 border-orange-200 rounded-lg text-lg font-medium hover:border-orange-300 hover:bg-orange-200 transition-colors text-orange-700">
          <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Harvest Date -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        Harvest Date *
      </label>
      <input v-model="harvestDate" type="date" required
        class="block w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900" />
    </div>

    <!-- Growth/Harvest Location -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        Growth/Harvest Location *
      </label>
      <select v-model="selectedLocationId" required
        class="block w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900">
        <option value="">Select a location...</option>
        <option v-for="location in locations" :key="location.id || location._id" :value="location.id || location._id">
          {{ location.name }}
        </option>
      </select>
    </div>

    <!-- Pantry Selection -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        Destination Pantry *
      </label>
      <select v-model="selectedPantryId" required
        class="block w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900">
        <option value="">Select a pantry...</option>
        <option v-for="pantry in pantries" :key="pantry.id || pantry._id" :value="pantry.id || pantry._id">
          {{ pantry.name }}
        </option>
      </select>
    </div>

    <!-- Quantity Summary -->
    <div v-if="(isPoundsUnit && weight > 0) || (!isPoundsUnit && quantity > 0)" class="bg-gray-50 rounded-lg p-2 text-center">
      <p class="text-lg font-bold text-garden-green-600">
        {{ isPoundsUnit ? weight : quantity }} {{ selectedProduce.unitType || selectedProduce.unit_type }}
      </p>
      <p v-if="!isPoundsUnit" class="text-sm text-gray-500">
        Est. {{ actualWeight.toFixed(2) }} lbs •
        Est. value: ${{ estimatedValue.toFixed(2) }}
      </p>
      <p v-else class="text-sm text-gray-500">
        Est. value: ${{ estimatedValue.toFixed(2) }}
      </p>
    </div>

    <!-- Harvester Name (Optional) -->
    <div class="space-y-1">
      <label class="block text-sm font-medium text-gray-700">
        Entered By Name (Optional)
      </label>
      <input v-model="harvesterName" type="text" placeholder="Who harvested this?"
        class="block w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900" />
    </div>

    <!-- Notes (Optional) -->
    <div class="space-y-1">
      <button v-if="!showNotesField" @click="showNotesField = true"
        class="text-garden-green-600 hover:text-garden-green-700 text-sm font-medium underline">
        Add notes
      </button>
      <div v-if="showNotesField">
        <input v-model="notes" type="text" placeholder="Add any additional notes..."
          class="block w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900" />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="pt-2">
      <button @click="handleSubmit"
        :disabled="(!isPoundsUnit && (!quantity || quantity <= 0)) || (isPoundsUnit && (!weight || weight <= 0)) || !selectedLocationId || !selectedPantryId || !harvestDate || submitting"
        class="w-full py-3 px-4 bg-garden-green-600 text-white rounded-lg text-sm font-medium hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
        <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        {{ submitting ? 'Saving...' : 'Save Harvest' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'


type ProduceType = Database['public']['Tables']['produce_types']['Row']
type FoodPantry = Database['public']['Tables']['food_pantries']['Row']
type HarvestLocation = {
  _id?: string
  id?: string
  name: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  isActive: boolean
}

interface Props {
  selectedProduce: ProduceType | null
  submitting: boolean
  pantries: FoodPantry[]
  locations: HarvestLocation[]
}

interface Emits {
  (e: 'submit', data: {
    produce_type_id: string
    location_id: string
    pantry_id: string
    quantity: number
    unit: string
    weight?: number
    harvester_name: string
    notes: string
    harvestDate: string
  }): void
  (e: 'back'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const quantity = ref<number>(0)
const displayValue = ref('0')
const weight = ref<number | undefined>(undefined)
const selectedLocationId = ref<string>(localStorage.getItem('lastLocationId') || '')
const selectedPantryId = ref<string>(localStorage.getItem('lastPantryId') || '')
const harvesterName = ref(localStorage.getItem('harvesterName') || '')
const harvestDate = ref(new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }))
const notes = ref('')

// Clean up old localStorage entry for harvest date
localStorage.removeItem('lastHarvestDate')
const showNotesField = ref(false)
const activeField = ref<'quantity' | 'weight'>('quantity')


const isPoundsUnit = computed(() => {
  const unit = props.selectedProduce?.unitType || props.selectedProduce?.unit_type
  return unit === 'pounds'
})

const estimatedWeight = computed(() => {
  if (!props.selectedProduce || !quantity.value) return 0
  const conversionFactor = props.selectedProduce.conversionFactor || props.selectedProduce.conversion_factor || 1
  return quantity.value * conversionFactor
})

const actualWeight = computed(() => {
  return weight.value && weight.value > 0 ? weight.value : estimatedWeight.value
})

const estimatedValue = computed(() => {
  if (!props.selectedProduce || !actualWeight.value) return 0
  const price = props.selectedProduce.pricePerLb || props.selectedProduce.price_per_lb || 0
  return actualWeight.value * price
})

const getUnitAbbr = (unitType: string) => {
  switch (unitType) {
    case 'pounds': return 'lb'
    case 'half-pints': return 'half-pt'
    case 'bouquets': return 'bouquet'
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

  // Update the appropriate field based on activeField
  const newValue = parseFloat(newDisplayValue)
  if (!isNaN(newValue)) {
    if (activeField.value === 'quantity') {
      quantity.value = newValue
    } else {
      weight.value = newValue
    }
  }
}

const backspace = () => {
  if (displayValue.value.length <= 1 || displayValue.value === '0') {
    // Reset to 0 if only one character or already 0
    displayValue.value = '0'
    if (activeField.value === 'quantity') {
      quantity.value = 0
    } else {
      weight.value = 0
    }
  } else {
    // Remove last character
    displayValue.value = displayValue.value.slice(0, -1)

    // Update the appropriate field
    const newValue = parseFloat(displayValue.value)
    if (!isNaN(newValue)) {
      if (activeField.value === 'quantity') {
        quantity.value = newValue
      } else {
        weight.value = newValue
      }
    } else {
      if (activeField.value === 'quantity') {
        quantity.value = 0
      } else {
        weight.value = 0
      }
    }
  }
}

const clearActiveField = () => {
  displayValue.value = '0'
  if (activeField.value === 'quantity') {
    quantity.value = 0
  } else {
    weight.value = 0
  }
}

const handleSubmit = () => {
  const unit = props.selectedProduce?.unitType || props.selectedProduce?.unit_type
  const isValidEntry = isPoundsUnit.value 
    ? weight.value && weight.value > 0 
    : quantity.value && quantity.value > 0
  
  if (!props.selectedProduce || !isValidEntry || !selectedLocationId.value || !selectedPantryId.value || !harvestDate.value) return

  const submitData: any = {
    produce_type_id: props.selectedProduce.id || props.selectedProduce._id,
    location_id: selectedLocationId.value,
    pantry_id: selectedPantryId.value,
    quantity: isPoundsUnit.value ? weight.value : quantity.value,
    unit: unit,
    harvester_name: harvesterName.value.trim(),
    notes: notes.value.trim(),
    harvestDate: harvestDate.value
  }

  // For pounds, weight equals quantity; for others, use estimated weight
  if (isPoundsUnit.value) {
    submitData.weight = weight.value
  } else {
    submitData.weight = estimatedWeight.value
  }

  // Save form values to localStorage for next time (but not harvest date)
  localStorage.setItem('lastLocationId', selectedLocationId.value)
  localStorage.setItem('lastPantryId', selectedPantryId.value)

  emit('submit', submitData)
}

// Update display value when switching between fields
watch(activeField, () => {
  if (activeField.value === 'quantity') {
    displayValue.value = quantity.value > 0 ? quantity.value.toString() : '0'
  } else {
    displayValue.value = weight.value && weight.value > 0 ? weight.value.toString() : '0'
  }
})

// Save harvester name to localStorage when it changes
watch(harvesterName, (newName) => {
  if (newName.trim()) {
    localStorage.setItem('harvesterName', newName.trim())
  } else {
    localStorage.removeItem('harvesterName')
  }
})

// Save location ID to localStorage when it changes
watch(selectedLocationId, (newId) => {
  if (newId) {
    localStorage.setItem('lastLocationId', newId)
  }
})

// Save pantry ID to localStorage when it changes
watch(selectedPantryId, (newId) => {
  if (newId) {
    localStorage.setItem('lastPantryId', newId)
  }
})

// Don't save harvest date to localStorage - always use today's date

// Reset form when produce changes (but keep harvester name and pantry)
watch(() => props.selectedProduce, () => {
  quantity.value = 0
  displayValue.value = '0'
  weight.value = undefined
  // Keep location, pantry, harvester name but always reset date to today
  selectedLocationId.value = localStorage.getItem('lastLocationId') || ''
  selectedPantryId.value = localStorage.getItem('lastPantryId') || ''
  harvestDate.value = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  notes.value = ''
  showNotesField.value = false
  // Set active field based on unit type
  activeField.value = isPoundsUnit.value ? 'weight' : 'quantity'
}, { immediate: true })
</script>