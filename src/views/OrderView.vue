<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-7xl mx-auto px-4 py-4 sm:py-6 pb-28 lg:pb-6">
      <!-- Page Header -->
      <div class="mb-4 sm:mb-8 flex justify-between items-start gap-3">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 font-poppins">Create New Order</h1>
          <p class="hidden sm:block text-gray-600 mt-2">Select harvest entries to pack for delivery to a food pantry</p>
        </div>
        <router-link to="/harvest"
          class="inline-flex items-center px-3 py-2 sm:px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-garden-green-600 hover:bg-garden-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-green-500 transition-colors whitespace-nowrap">
          <svg class="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span class="hidden sm:inline">Add Harvest</span>
        </router-link>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <div v-if="success" class="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
        <p class="text-sm text-green-700">{{ success }}</p>
      </div>

      <!-- Desktop Layout -->
      <div class="lg:flex lg:gap-8">
        <!-- Main Content -->
        <div class="lg:w-2/3">
          <form @submit.prevent="submitOrder" class="space-y-4 sm:space-y-6">
            <!-- Order Details Card -->
            <div class="bg-white rounded-lg shadow-sm border">
              <!-- Collapsed summary bar -->
              <div v-if="detailsCollapsed"
                class="flex items-center justify-between gap-3 p-4 cursor-pointer"
                @click="detailsCollapsed = false">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 text-sm text-gray-500">
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                    <span>Order Details</span>
                  </div>
                  <p class="font-semibold text-gray-900 truncate mt-0.5">{{ selectedPantryName }}</p>
                  <p class="text-sm text-gray-600 truncate">
                    {{ formatDate(form.deliveryDate) }} · {{ form.orderType === 'pickup' ? 'Pickup' : 'Delivery' }}
                    <span v-if="form.orderType === 'pickup' && form.pickupTime"> · {{ form.pickupTime }}</span>
                    <span v-if="form.packerName"> · {{ form.packerName }}</span>
                  </p>
                </div>
                <button type="button" @click.stop="detailsCollapsed = false"
                  class="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-garden-green-700 bg-garden-green-50 rounded-lg hover:bg-garden-green-100 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Edit
                </button>
              </div>

              <!-- Expanded form -->
              <div v-else class="p-4 sm:p-6">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-lg sm:text-xl font-semibold text-gray-900">Order Details</h2>
                  <button v-if="detailsComplete" type="button" @click="detailsCollapsed = true"
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-garden-green-600 rounded-lg hover:bg-garden-green-700 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Done
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <!-- Pantry Selection -->
                  <div>
                    <label for="pantry" class="block text-sm font-medium text-gray-700 mb-2">Food Pantry *</label>
                    <select id="pantry" v-model="form.pantryId" required
                      @change="onPantryChange"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                      <option value="">Select a pantry...</option>
                      <option v-for="pantry in pantries" :key="pantry._id" :value="pantry._id">
                        {{ pantry.name }}
                      </option>
                    </select>
                  </div>

                  <!-- Order Type -->
                  <div>
                    <label for="orderType" class="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                    <select id="orderType" v-model="form.orderType" required
                      class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                      <option value="delivery">Delivery</option>
                      <option value="pickup">Pickup</option>
                    </select>
                  </div>

                  <!-- Delivery Date -->
                  <div>
                    <label for="deliveryDate" class="block text-sm font-medium text-gray-700 mb-2">Delivery Date *</label>
                    <input type="date" id="deliveryDate" v-model="form.deliveryDate" required
                      class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                  </div>

                  <!-- Pickup Time -->
                  <div v-if="form.orderType === 'pickup'">
                    <label for="pickupTime" class="block text-sm font-medium text-gray-700 mb-2">Pickup Time</label>
                    <input type="time" id="pickupTime" v-model="form.pickupTime"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                  </div>

                  <!-- Packer Name -->
                  <div :class="form.orderType === 'delivery' ? 'md:col-span-2' : ''">
                    <label for="packerName" class="block text-sm font-medium text-gray-700 mb-2">Packer Name</label>
                    <input type="text" id="packerName" v-model="form.packerName"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500">
                  </div>
                </div>

                <!-- Notes -->
                <div class="mt-4">
                  <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea id="notes" v-model="form.notes" rows="3"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-garden-green-500 focus:border-garden-green-500"></textarea>
                </div>
              </div>
            </div>

            <!-- Available Harvest Entries -->
            <div v-if="form.pantryId" class="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 class="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Available Harvest
                <span class="hidden sm:inline">Entries for {{ selectedPantryName }}</span>
              </h2>

              <div v-if="loadingEntries" class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
                <p class="mt-2 text-gray-600">Loading available harvest entries...</p>
              </div>

              <div v-else-if="availableEntries.length === 0" class="text-center py-8 text-gray-500">
                <p>No available harvest entries for this pantry</p>
              </div>

              <div v-else class="space-y-3">
                <div v-for="entry in availableEntries" :key="entry._id"
                  class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  :class="{ 'bg-green-50 border-green-500': isEntrySelected(entry._id) }"
                  @click="toggleEntry(entry)">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-3">
                        <input type="checkbox" :checked="isEntrySelected(entry._id)" @click.stop="toggleEntry(entry)"
                          class="h-5 w-5 rounded border-gray-300 text-garden-green-600 focus:ring-garden-green-500 flex-shrink-0">
                        <div class="min-w-0">
                          <h4 class="font-medium text-gray-900 truncate">{{ entry.produceType.name }}</h4>
                          <div class="text-sm text-gray-600 mt-1">
                            <span>{{ entry.weight.toFixed(1) }} lbs available</span>
                            <span class="mx-2">•</span>
                            <span>{{ formatDate(entry.harvestDate) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <div class="text-sm font-medium text-gray-900">
                        ${{ (entry.weight * entry.produceType.pricePerLb).toFixed(2) }}
                      </div>
                      <div class="text-xs text-gray-500">
                        ${{ entry.produceType.pricePerLb.toFixed(2) }}/lb
                      </div>
                    </div>
                  </div>

                  <!-- Partial weight selector (shown when entry is selected) -->
                  <div v-if="isEntrySelected(entry._id)" class="mt-3 pl-8" @click.stop>
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      Weight to add (max {{ entry.weight.toFixed(1) }} lbs)
                    </label>
                    <div class="flex items-center gap-2">
                      <input type="number" inputmode="decimal" step="0.1" min="0.1" :max="entry.weight"
                        :value="selectedAllocations[entry._id]"
                        @input="updateAllocation(entry, $event)"
                        @click.stop
                        class="w-24 border border-gray-300 rounded px-2 py-2 text-base focus:ring-1 focus:ring-garden-green-500 focus:border-garden-green-500">
                      <span class="text-sm text-gray-500">lbs</span>
                      <button type="button" @click.stop="setFullWeight(entry)"
                        class="ml-auto text-sm text-garden-green-600 hover:text-garden-green-700 hover:underline px-2 py-1">
                        Use all
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Order Summary Sidebar (desktop only) -->
        <div class="hidden lg:block lg:w-1/3 mt-6 lg:mt-0">
          <div class="sticky top-6 space-y-6">
            <!-- Order Summary -->
            <div class="bg-white rounded-lg shadow-sm border p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div v-if="selectedEntryIds.length === 0" class="text-center py-8 text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p class="text-sm">No items selected</p>
                <p class="text-xs mt-1">Select harvest entries to add to this order</p>
              </div>

              <div v-else class="space-y-4">
                <!-- Selected Items -->
                <div class="border-b pb-4">
                  <h4 class="text-sm font-medium text-gray-700 mb-3">Selected Items</h4>
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    <div v-for="item in groupedSelectedItems" :key="item.produceTypeName" class="flex justify-between text-sm">
                      <span class="text-gray-700">{{ item.produceTypeName }}</span>
                      <span class="font-medium">{{ item.totalWeight.toFixed(1) }} lbs</span>
                    </div>
                  </div>
                </div>

                <!-- Summary Stats -->
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Total Weight:</span>
                    <span class="font-semibold text-gray-900">{{ totalWeight.toFixed(1) }} lbs</span>
                  </div>
                </div>

                <!-- Action Button -->
                <div class="pt-4 border-t">
                  <button type="button" @click="submitOrder" :disabled="loading || selectedEntryIds.length === 0"
                    class="w-full px-4 py-3 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                    <span v-if="loading">Creating Order...</span>
                    <span v-else>Create Order</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Plan Box -->
            <div v-if="form.pantryId && form.deliveryDate" class="bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Plan for {{ formatDate(form.deliveryDate) }}</h3>

            <div v-if="loadingPlans" class="text-center py-8">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-garden-green-600"></div>
              <p class="mt-2 text-sm text-gray-600">Loading plans...</p>
            </div>

            <div v-else-if="planFulfillment.length === 0" class="text-center py-8 text-gray-500">
              <p class="text-sm">No plans for this pantry on this date</p>
            </div>

            <div v-else class="space-y-3">
              <div v-for="plan in planFulfillment" :key="plan._id" class="border-b pb-3 last:border-b-0">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-sm text-gray-700">{{ getPlanDescription(plan) }}</span>
                </div>

                <!-- Progress Bar -->
                <div class="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="plan.fulfilled >= plan.dailyWeightLbs ? 'bg-green-600' : 'bg-blue-500'"
                    :style="{ width: `${Math.min((plan.fulfilled / plan.dailyWeightLbs) * 100, 100)}%` }"
                  ></div>
                </div>

                <!-- Progress Text -->
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600">
                    {{ plan.fulfilled.toFixed(1) }} / {{ plan.dailyWeightLbs }} lbs
                  </span>
                  <span
                    :class="plan.fulfilled >= plan.dailyWeightLbs ? 'text-green-600 font-medium' : 'text-gray-500'"
                  >
                    {{ ((plan.fulfilled / plan.dailyWeightLbs) * 100).toFixed(0) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Floating Summary (lg:hidden) -->
    <div v-if="form.pantryId" class="lg:hidden fixed inset-x-0 bottom-0 z-40">
      <!-- Expandable detail sheet -->
      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4">
        <div v-if="showMobileSummary" class="bg-white border-t shadow-2xl rounded-t-2xl max-h-[70vh] overflow-y-auto">
          <div class="p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base font-semibold text-gray-900">Order Summary</h3>
              <button type="button" @click="showMobileSummary = false" class="p-1 text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div v-if="selectedEntryIds.length === 0" class="text-center py-6 text-gray-500">
              <p class="text-sm">No items selected yet</p>
            </div>

            <div v-else class="space-y-2 mb-4">
              <div v-for="item in groupedSelectedItems" :key="item.produceTypeName"
                class="flex justify-between text-sm">
                <span class="text-gray-700">{{ item.produceTypeName }}</span>
                <span class="font-medium">{{ item.totalWeight.toFixed(1) }} lbs</span>
              </div>
            </div>

            <!-- Plan progress (mobile) -->
            <div v-if="form.deliveryDate && planFulfillment.length > 0" class="pt-3 border-t space-y-3">
              <h4 class="text-sm font-medium text-gray-700">Plan for {{ formatDate(form.deliveryDate) }}</h4>
              <div v-for="plan in planFulfillment" :key="plan._id">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-600">{{ getPlanDescription(plan) }}</span>
                  <span :class="plan.fulfilled >= plan.dailyWeightLbs ? 'text-green-600 font-medium' : 'text-gray-500'">
                    {{ plan.fulfilled.toFixed(1) }} / {{ plan.dailyWeightLbs }} lbs
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all"
                    :class="plan.fulfilled >= plan.dailyWeightLbs ? 'bg-green-600' : 'bg-blue-500'"
                    :style="{ width: `${Math.min((plan.fulfilled / plan.dailyWeightLbs) * 100, 100)}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Always-visible bottom bar -->
      <div class="bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3"
        style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom));">
        <button type="button" @click="showMobileSummary = !showMobileSummary"
          class="flex-shrink-0 flex flex-col items-start">
          <span class="text-xs text-gray-500 flex items-center gap-1">
            {{ selectedEntryIds.length }} item{{ selectedEntryIds.length === 1 ? '' : 's' }}
            <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showMobileSummary }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
            </svg>
          </span>
          <span class="text-lg font-bold text-gray-900">{{ totalWeight.toFixed(1) }} lbs</span>
        </button>
        <button type="button" @click="submitOrder" :disabled="loading || selectedEntryIds.length === 0"
          class="flex-1 px-4 py-3 bg-garden-green-600 text-white rounded-lg hover:bg-garden-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
          <span v-if="loading">Creating Order...</span>
          <span v-else>Create Order</span>
        </button>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showConfirmationModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeModal">
      <div class="relative top-20 mx-auto p-8 border max-w-md shadow-lg rounded-md bg-white" @click.stop>
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Order Created Successfully!</h3>
          <p class="text-sm text-gray-500 mb-6">
            Order for {{ selectedPantryName }} has been created with {{ selectedEntryIds.length }} harvest entries.
          </p>
          <div class="flex gap-3">
            <router-link to="/dashboard"
              class="flex-1 px-4 py-2 bg-garden-green-600 text-white rounded-md hover:bg-garden-green-700 transition-colors text-center">
              Go to Dashboard
            </router-link>
            <button @click="createAnother"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              Create Another
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const route = useRoute()
const API_BASE = '/api'

// State
const loading = ref(false)
const loadingEntries = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const showConfirmationModal = ref(false)
const detailsCollapsed = ref(false)
const showMobileSummary = ref(false)

// Form data
const form = ref({
  pantryId: '',
  deliveryDate: '',
  pickupTime: '',
  packerName: '',
  orderType: 'delivery' as 'delivery' | 'pickup',
  notes: ''
})

// Data
const pantries = ref<any[]>([])
const availableEntries = ref<any[]>([])
// Maps a harvest entry _id to the weight (lbs) being taken from it into this order.
// A full entry uses its whole weight; a partial selection uses less than the entry's weight.
const selectedAllocations = ref<Record<string, number>>({})
const createdOrder = ref<any>(null)
const plans = ref<any[]>([])
const loadingPlans = ref(false)

// Computed
const selectedPantryName = computed(() => {
  const pantry = pantries.value.find(p => p._id === form.value.pantryId)
  return pantry?.name || ''
})

// Required order settings are filled in — enables collapsing the details card
const detailsComplete = computed(() => !!form.value.pantryId && !!form.value.deliveryDate)

const selectedEntryIds = computed(() => Object.keys(selectedAllocations.value))

// Selected entries paired with the weight (lbs) being taken from each
const selectedItems = computed(() => {
  return availableEntries.value
    .filter(e => e._id in selectedAllocations.value)
    .map(e => ({
      entry: e,
      weight: selectedAllocations.value[e._id] || 0
    }))
})

const groupedSelectedItems = computed(() => {
  const grouped = new Map()

  selectedItems.value.forEach(({ entry, weight }) => {
    const produceName = entry.produceType.name
    if (!grouped.has(produceName)) {
      grouped.set(produceName, {
        produceTypeName: produceName,
        totalWeight: 0
      })
    }
    grouped.get(produceName).totalWeight += weight
  })

  return Array.from(grouped.values())
})

const totalWeight = computed(() => {
  return selectedItems.value.reduce((sum, { weight }) => sum + weight, 0)
})

const totalValue = computed(() => {
  return selectedItems.value.reduce((sum, { entry, weight }) => {
    return sum + (weight * entry.produceType.pricePerLb)
  }, 0)
})

const uniqueProduceTypes = computed(() => {
  const types = new Set(selectedItems.value.map(({ entry }) => entry.produceType.name))
  return types.size
})

// Plan fulfillment calculation
const planFulfillment = computed(() => {
  if (plans.value.length === 0) return []

  // Create a mutable copy of plans with fulfillment tracking
  const fulfillmentData = plans.value.map(plan => ({
    ...plan,
    fulfilled: 0,
    remaining: plan.dailyWeightLbs || 0
  }))

  // Sort entries to ensure consistent allocation
  const items = [...selectedItems.value]

  // Process each selected item using the weight being taken (not the full entry weight)
  items.forEach(({ entry, weight }) => {
    let remainingWeight = weight
    const produceTypeId = entry.produceType._id
    const categoryId = entry.produceType.categoryId

    // Priority 1: Specific produce type match
    const produceTypePlan = fulfillmentData.find(p =>
      p.commitmentType === 'produce_type' &&
      p.produceTypeId?._id === produceTypeId &&
      p.remaining > 0
    )

    if (produceTypePlan && remainingWeight > 0) {
      const allocated = Math.min(remainingWeight, produceTypePlan.remaining)
      produceTypePlan.fulfilled += allocated
      produceTypePlan.remaining -= allocated
      remainingWeight -= allocated
    }

    // Priority 2: Category match
    if (remainingWeight > 0 && categoryId) {
      const categoryPlan = fulfillmentData.find(p =>
        p.commitmentType === 'category' &&
        p.categoryId?._id === categoryId &&
        p.remaining > 0
      )

      if (categoryPlan) {
        const allocated = Math.min(remainingWeight, categoryPlan.remaining)
        categoryPlan.fulfilled += allocated
        categoryPlan.remaining -= allocated
        remainingWeight -= allocated
      }
    }

    // Priority 3: Any produce
    if (remainingWeight > 0) {
      const anyProducePlan = fulfillmentData.find(p =>
        p.commitmentType === 'total' &&
        p.remaining > 0
      )

      if (anyProducePlan) {
        const allocated = Math.min(remainingWeight, anyProducePlan.remaining)
        anyProducePlan.fulfilled += allocated
        anyProducePlan.remaining -= allocated
        remainingWeight -= allocated
      }
    }
  })

  return fulfillmentData
})

// Methods
const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const isEntrySelected = (entryId: string) => {
  return entryId in selectedAllocations.value
}

const toggleEntry = (entry: any) => {
  if (entry._id in selectedAllocations.value) {
    delete selectedAllocations.value[entry._id]
  } else {
    // Default to taking the full available weight
    selectedAllocations.value[entry._id] = entry.weight
  }
}

// Clamp the typed weight to (0, entry.weight] and store it for this entry
const updateAllocation = (entry: any, event: Event) => {
  const raw = parseFloat((event.target as HTMLInputElement).value)
  let val = isNaN(raw) ? 0 : raw
  if (val < 0) val = 0
  if (val > entry.weight) val = entry.weight
  selectedAllocations.value[entry._id] = val
}

const setFullWeight = (entry: any) => {
  selectedAllocations.value[entry._id] = entry.weight
}

const onPantryChange = async () => {
  selectedAllocations.value = {}
  if (form.value.pantryId) {
    await Promise.all([
      fetchAvailableEntries(),
      fetchPlans()
    ])
    // Once a pantry is picked and details are complete, collapse the settings
    // so the produce selection gets the screen — especially on mobile.
    if (detailsComplete.value) {
      detailsCollapsed.value = true
    }
  } else {
    availableEntries.value = []
    plans.value = []
  }
}

const fetchPantries = async () => {
  try {
    const response = await fetch(`${API_BASE}/admin-food-pantries`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    pantries.value = result.data || []
  } catch (err) {
    console.error('Failed to fetch pantries:', err)
  }
}

const fetchAvailableEntries = async () => {
  if (!form.value.pantryId) return

  loadingEntries.value = true
  try {
    const response = await fetch(`${API_BASE}/harvest-list?pantryId=${form.value.pantryId}&includeUnallocated=1&limit=1000`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    const allEntries = result.data?.entries || []

    // Show entries allocated to this pantry that aren't yet assigned to an order
    availableEntries.value = allEntries.filter((entry: any) => {
      return !entry.orderId
    })
  } catch (err) {
    console.error('Failed to fetch harvest entries:', err)
    error.value = 'Failed to load available harvest entries'
  } finally {
    loadingEntries.value = false
  }
}

const fetchPlans = async () => {
  if (!form.value.pantryId || !form.value.deliveryDate) return

  loadingPlans.value = true
  try {
    const params = new URLSearchParams({
      pantryId: form.value.pantryId,
      startDate: form.value.deliveryDate,
      endDate: form.value.deliveryDate
    })

    const response = await fetch(`${API_BASE}/commitments?${params}`, {
      headers: getAuthHeader()
    })
    const result = await response.json()
    plans.value = result.data || []
  } catch (err) {
    console.error('Failed to fetch plans:', err)
  } finally {
    loadingPlans.value = false
  }
}

const submitOrder = async () => {
  // Build allocations, keeping only entries with a positive weight to take
  const harvestAllocations = Object.entries(selectedAllocations.value)
    .filter(([, weight]) => weight > 0)
    .map(([harvestEntryId, weight]) => ({ harvestEntryId, weight }))

  if (harvestAllocations.length === 0) {
    error.value = 'Please select at least one harvest entry with a weight greater than 0'
    return
  }

  loading.value = true
  error.value = null
  success.value = null

  try {
    const orderData = {
      pantryId: form.value.pantryId,
      deliveryDate: form.value.deliveryDate,
      pickupTime: form.value.pickupTime,
      packerName: form.value.packerName,
      orderType: form.value.orderType,
      notes: form.value.notes,
      harvestAllocations,
      status: 'ready'
    }

    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create order')
    }

    const result = await response.json()
    createdOrder.value = result.data
    showConfirmationModal.value = true

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create order'
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  showConfirmationModal.value = false
  router.push('/dashboard')
}

const createAnother = () => {
  showConfirmationModal.value = false

  // Reset form but keep pantry selected
  const pantryId = form.value.pantryId
  form.value = {
    pantryId,
    deliveryDate: '',
    pickupTime: '',
    packerName: '',
    orderType: 'delivery',
    notes: ''
  }

  selectedAllocations.value = {}
  setDefaultDate()
  fetchAvailableEntries()
}

const setDefaultDate = () => {
  // Use local timezone to avoid UTC conversion issues
  form.value.deliveryDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

const getPlanDescription = (plan: any) => {
  const weight = plan.dailyWeightLbs || 0
  if (plan.commitmentType === 'total') {
    return `${weight}lb of Any Produce`
  } else if (plan.commitmentType === 'produce_type' && plan.produceTypeId?.name) {
    return `${weight}lb of ${plan.produceTypeId.name}`
  } else if (plan.commitmentType === 'category' && plan.categoryId?.name) {
    return `${weight}lb of Any ${plan.categoryId.name}`
  }
  return 'Unknown Type'
}

// Watch for delivery date changes to refetch plans
watch(() => form.value.deliveryDate, () => {
  if (form.value.pantryId && form.value.deliveryDate) {
    fetchPlans()
  }
})

onMounted(async () => {
  setDefaultDate()
  await fetchPantries()

  // Prepopulate pantry from query parameter if provided
  const pantryId = route.query.pantryId as string
  if (pantryId) {
    form.value.pantryId = pantryId
    await Promise.all([
      fetchAvailableEntries(),
      fetchPlans()
    ])
    if (detailsComplete.value) {
      detailsCollapsed.value = true
    }
  }
})
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
