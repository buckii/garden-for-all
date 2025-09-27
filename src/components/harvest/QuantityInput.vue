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
      <div v-if="!isEditingDate" class="flex items-center justify-between py-0.5">
        <span class="text-sm font-medium text-gray-700">Harvest Date *</span>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-900">{{ formattedHarvestDate }}</span>
          <button @click="isEditingDate = true" class="p-1 text-gray-400 hover:text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div v-if="isEditingDate" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Harvest Date *</label>
        <div class="flex space-x-2">
          <input v-model="harvestDate" type="date" required
            class="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900" />
          <button @click="isEditingDate = false" class="px-3 py-2 bg-garden-green-600 text-white rounded-lg text-sm hover:bg-garden-green-700">
            Done
          </button>
        </div>
      </div>
    </div>

    <!-- Growth/Harvest Location -->
    <div class="space-y-2">
      <div v-if="!isEditingLocation" class="flex items-center justify-between py-0.5">
        <span class="text-sm font-medium text-gray-700">Growth/Harvest Location *</span>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-900" :class="{ 'text-gray-400': !selectedLocationId }">
            {{ selectedLocationName }}
          </span>
          <button @click="isEditingLocation = true" class="p-1 text-gray-400 hover:text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
        </div>
      </div>
      <p v-if="locationRecommendationReason && !isEditingLocation" class="text-xs text-green-800 mt-1">
        📍 {{ locationRecommendationReason }}
      </p>
      <div v-if="isEditingLocation" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Growth/Harvest Location *</label>
        <div class="flex space-x-2">
          <select v-model="selectedLocationId" required
            class="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900">
            <option value="">Select a location...</option>
            <option v-for="location in locations" :key="location.id || location._id" :value="location.id || location._id">
              {{ location.name }}
            </option>
          </select>
          <button @click="isEditingLocation = false" class="px-3 py-2 bg-garden-green-600 text-white rounded-lg text-sm hover:bg-garden-green-700">
            Done
          </button>
        </div>
        <p v-if="locationRecommendationReason" class="text-xs text-green-800 mt-1">
          📍 {{ locationRecommendationReason }}
        </p>
      </div>
    </div>

    <!-- Entered By Name -->
    <div class="space-y-2">
      <div v-if="!isEditingHarvesterName" class="flex items-center justify-between py-0.5">
        <span class="text-sm font-medium text-gray-700">Entered By Name (Optional)</span>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-900" :class="{ 'text-gray-400': !harvesterName.trim() }">
            {{ displayHarvesterName }}
          </span>
          <button @click="isEditingHarvesterName = true" class="p-1 text-gray-400 hover:text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div v-if="isEditingHarvesterName" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Entered By Name (Optional)</label>
        <div class="flex space-x-2">
          <input v-model="harvesterName" type="text" placeholder="Who harvested this?"
            class="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900" />
          <button @click="isEditingHarvesterName = false" class="px-3 py-2 bg-garden-green-600 text-white rounded-lg text-sm hover:bg-garden-green-700">
            Done
          </button>
        </div>
      </div>
    </div>

    <!-- More Details (Optional) -->
    <div class="space-y-1">
      <button v-if="!showNotesField" @click="showNotesField = true"
        class="text-garden-green-600 hover:text-garden-green-700 text-sm font-medium underline">
        Add more details
      </button>
      <div v-if="showNotesField" class="space-y-3">
        <!-- Destination Pantry -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Destination Pantry (Optional)
          </label>
          <select v-model="selectedPantryId"
            class="block w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900">
            <option value="">Select a pantry...</option>
            <option v-for="pantry in pantries" :key="pantry.id || pantry._id" :value="pantry.id || pantry._id">
              {{ pantry.name }}
            </option>
          </select>
          <p v-if="pantryRecommendationReason" class="text-xs text-blue-800 mt-1">
            🎯 {{ pantryRecommendationReason }}
          </p>
        </div>

        <!-- Notes -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <input v-model="notes" type="text" placeholder="Add any additional notes..."
            class="block w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900" />
        </div>
      </div>
    </div>

    <!-- Quantity Summary -->
    <div class="bg-gray-50 rounded-lg p-4 text-center">
      <p class="text-xl font-bold text-garden-green-600 mb-2">
        <span v-if="(isPoundsUnit && weight && weight > 0) || (!isPoundsUnit && quantity && quantity > 0)">
          {{ isPoundsUnit ? weight : quantity }} {{ selectedProduce.unitType || selectedProduce.unit_type }}
        </span>
        <span v-else class="text-gray-400">
          Enter {{ isPoundsUnit ? 'weight' : 'quantity' }} above
        </span>
      </p>
      <div class="space-y-1">
        <p v-if="!isPoundsUnit" class="text-base text-gray-600">
          <span v-if="quantity && quantity > 0">
            Est. {{ actualWeight.toFixed(2) }} lbs
          </span>
          <span v-else class="text-gray-400">
            Est. weight: 0.0 lbs
          </span>
        </p>
        <p class="text-base text-gray-600">
          <span v-if="((isPoundsUnit && weight && weight > 0) || (!isPoundsUnit && quantity && quantity > 0))">
            Est. value: ${{ estimatedValue.toFixed(2) }}
          </span>
          <span v-else class="text-gray-400">
            Est. value: $0.00
          </span>
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="pt-2">
      <button @click="handleSubmit"
        :disabled="(!isPoundsUnit && (!quantity || quantity <= 0)) || (isPoundsUnit && (!weight || weight <= 0)) || !selectedLocationId || !harvestDate || submitting"
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
import { computed, ref, watch, nextTick } from 'vue'


type ProduceType = Database['public']['Tables']['produce_types']['Row'] & {
  mostRecentLocation?: {
    _id?: string
    id?: string
    name: string
    address?: any
    coordinates?: any
  }
}
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
const selectedLocationId = ref<string>('')
const selectedPantryId = ref<string>(localStorage.getItem('lastPantryId') || '')
const harvesterName = ref(localStorage.getItem('harvesterName') || '')
const harvestDate = ref(new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }))
const notes = ref('')

// Clean up old localStorage entry for harvest date
localStorage.removeItem('lastHarvestDate')
const showNotesField = ref(false)
const activeField = ref<'quantity' | 'weight'>('quantity')

// Edit states for date, location, and harvester name
const isEditingDate = ref(false)
const isEditingLocation = ref(false)
const isEditingHarvesterName = ref(false)

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Recommendation reasons
const locationRecommendationReason = ref<string>('')
const pantryRecommendationReason = ref<string>('')

// Track if we're programmatically setting values
const isSettingLocationProgrammatically = ref(false)
const isSettingPantryProgrammatically = ref(false)

// Initialize location from produce type's most recent location, then fall back to localStorage
const initializeLocation = () => {
  isSettingLocationProgrammatically.value = true
  
  // Prioritize the produce type's most recent location for better UX
  if (props.selectedProduce?.mostRecentLocation) {
    const mostRecentId = props.selectedProduce.mostRecentLocation._id || props.selectedProduce.mostRecentLocation.id
    if (mostRecentId) {
      selectedLocationId.value = mostRecentId
      locationRecommendationReason.value = `Most recent location used for ${props.selectedProduce.name}`
      isSettingLocationProgrammatically.value = false
      return
    }
  }
  
  // Fall back to general localStorage preference if no produce-specific location
  const lastLocationId = localStorage.getItem('lastLocationId')
  if (lastLocationId) {
    selectedLocationId.value = lastLocationId
    locationRecommendationReason.value = 'Your previously used location'
  } else {
    locationRecommendationReason.value = ''
  }
  
  isSettingLocationProgrammatically.value = false
}

// Initialize pantry from recommendation based on unmet commitments, then fall back to localStorage
const initializePantry = async () => {
  try {
    isSettingPantryProgrammatically.value = true
    
    if (props.selectedProduce?.id || props.selectedProduce?._id) {
      const produceTypeId = props.selectedProduce.id || props.selectedProduce._id
      
      // Call the pantry recommendation API directly
      const url = new URL(`${API_BASE}/pantry-recommendations`, window.location.origin)
      url.searchParams.set('produceTypeId', produceTypeId)
      url.searchParams.set('harvestDate', harvestDate.value)
      
      const response = await fetch(url.toString())
      const result = await response.json()
      
      if (result.success && result.data?.recommendedPantry?.pantryId) {
        selectedPantryId.value = result.data.recommendedPantry.pantryId
        
        // Set recommendation reason based on commitment type
        const recommendation = result.data.recommendedPantry
        if (recommendation.commitmentType === 'produce_type') {
          pantryRecommendationReason.value = `Has unmet ${props.selectedProduce.name} commitment (${recommendation.unmetAmount.toFixed(1)} lbs needed)`
        } else if (recommendation.commitmentType === 'category') {
          pantryRecommendationReason.value = `Has unmet category commitment (${recommendation.unmetAmount.toFixed(1)} lbs needed)`
        } else if (recommendation.commitmentType === 'total') {
          pantryRecommendationReason.value = `Has unmet total commitment (${recommendation.unmetAmount.toFixed(1)} lbs needed)`
        }
        return
      }
    }
    
    // Fall back to general localStorage preference if no recommendation
    const lastPantryId = localStorage.getItem('lastPantryId')
    if (lastPantryId) {
      // Validate that the pantry ID exists in the available pantries
      const isValidPantry = props.pantries?.some(pantry => 
        (pantry.id || pantry._id) === lastPantryId
      )
      
      if (isValidPantry) {
        selectedPantryId.value = lastPantryId
        pantryRecommendationReason.value = 'Your previously used pantry'
      } else {
        localStorage.removeItem('lastPantryId')
        pantryRecommendationReason.value = ''
      }
    } else {
      pantryRecommendationReason.value = ''
    }
  } catch (error) {
    console.error('Error initializing pantry:', error)
    // Fall back to localStorage on any error
    const lastPantryId = localStorage.getItem('lastPantryId')
    if (lastPantryId) {
      // Validate that the pantry ID exists in the available pantries
      const isValidPantry = props.pantries?.some(pantry => 
        (pantry.id || pantry._id) === lastPantryId
      )
      
      if (isValidPantry) {
        selectedPantryId.value = lastPantryId
        pantryRecommendationReason.value = 'Your previously used pantry'
      } else {
        localStorage.removeItem('lastPantryId')
      }
    }
  } finally {
    isSettingPantryProgrammatically.value = false
  }
}

// Initialize location and pantry when component mounts and when produce changes
watch(() => props.selectedProduce, () => {
  if (props.selectedProduce) {
    // Wait for locations to be available before initializing location
    nextTick(() => {
      if (props.locations && props.locations.length > 0) {
        initializeLocation()
      }
    })
    
    // Initialize pantry recommendation (can happen independently of locations)
    initializePantry()
  }
}, { immediate: true })

// Also initialize when locations become available
watch(() => props.locations, () => {
  // If we have a selected produce and locations are now available, initialize
  if (props.selectedProduce && props.locations?.length > 0) {
    initializeLocation()
  }
}, { immediate: true })

// Initialize pantry when pantries become available
watch(() => props.pantries, () => {
  // If we have a selected produce and pantries are now available, initialize pantry
  if (props.selectedProduce && props.pantries?.length > 0) {
    initializePantry()
  }
}, { immediate: true })


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

// Display values for date and location
const formattedHarvestDate = computed(() => {
  if (!harvestDate.value) return ''
  const date = new Date(harvestDate.value)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
})

const selectedLocationName = computed(() => {
  if (!selectedLocationId.value) return 'Select a location...'
  const location = props.locations?.find(loc => 
    (loc.id || loc._id) === selectedLocationId.value
  )
  return location?.name || 'Unknown location'
})

const displayHarvesterName = computed(() => {
  return harvesterName.value.trim() || 'Not specified'
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
  
  if (!props.selectedProduce || !isValidEntry || !selectedLocationId.value || !harvestDate.value) return

  const submitData: any = {
    produce_type_id: props.selectedProduce.id || props.selectedProduce._id,
    location_id: selectedLocationId.value,
    quantity: isPoundsUnit.value ? weight.value : quantity.value,
    unit: unit,
    harvester_name: harvesterName.value.trim(),
    notes: notes.value.trim(),
    harvestDate: harvestDate.value
  }

  // Add pantry_id only if selected
  if (selectedPantryId.value) {
    submitData.pantry_id = selectedPantryId.value
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
  
  // Clear recommendation reason if user manually changed selection
  if (!isSettingLocationProgrammatically.value) {
    locationRecommendationReason.value = ''
  }
})

// Save pantry ID to localStorage when it changes
watch(selectedPantryId, (newId) => {
  if (newId) {
    localStorage.setItem('lastPantryId', newId)
  }
  
  // Clear recommendation reason if user manually changed selection
  if (!isSettingPantryProgrammatically.value) {
    pantryRecommendationReason.value = ''
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