<template>
  <div class="space-y-6">
    <!-- Category Filter -->
    <div class="space-y-3">
      <!-- Desktop Category Filter -->
      <div class="hidden sm:flex flex-wrap gap-2">
        <button
          @click="selectedCategoryId = null"
          :class="[
            'px-4 py-2 rounded-lg text-base font-medium transition-colors',
            !selectedCategoryId 
              ? 'bg-garden-green-600 text-white shadow-lg' 
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-garden-green-300'
          ]"
        >
          All
        </button>
        <button
          v-for="category in categories"
          :key="category.id || category._id"
          @click="selectedCategoryId = String(category.id || category._id)"
          :class="[
            'px-4 py-2 rounded-lg text-base font-medium transition-colors',
            selectedCategoryId === String(category.id || category._id) 
              ? 'bg-garden-green-600 text-white shadow-lg' 
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-garden-green-300'
          ]"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- Mobile Category Dropdown -->
      <div class="sm:hidden">
        <select
          :value="selectedCategoryId || ''"
          @change="handleCategoryChange"
          class="block w-full rounded-lg border-2 border-gray-200 py-3 pl-4 pr-10 text-base focus:border-garden-green-500 focus:ring-garden-green-500 text-gray-900"
        >
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category.id || category._id" :value="String(category.id || category._id)">
            {{ category.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Search -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search produce..."
        class="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-lg focus:ring-garden-green-500 focus:border-garden-green-500 text-gray-900"
      />
    </div>

    <!-- Recently Used -->
    <div v-if="recentlyUsed.length > 0 && !searchQuery" class="space-y-3">
      <h3 class="text-lg font-medium text-gray-900">Recently Used</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <button
          v-for="produce in recentlyUsed"
          :key="`recent-${produce.id}`"
          @click="selectProduce(produce)"
          class="bg-garden-green-50 border-2 border-garden-green-200 rounded-lg p-3 text-center hover:bg-garden-green-100 hover:border-garden-green-300 transition-colors min-h-[70px] flex flex-col justify-center"
        >
          <div class="text-base font-medium text-gray-900">{{ produce.name }}</div>
          <div class="text-sm text-gray-500">{{ produce.unit_type }}</div>
        </button>
      </div>
    </div>

    <!-- Frequently Used Produce -->
    <div v-if="!searchQuery" class="space-y-3">
      <h3 class="text-lg font-medium text-gray-900">
        {{ selectedCategoryId ? `${getCategoryName(selectedCategoryId)} - Frequently Used` : 'Frequently Used' }}
        <span class="text-gray-500 font-normal">({{ filteredFrequentlyUsed.length }})</span>
      </h3>
      
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-garden-green-600"></div>
      </div>
      
      <div v-else-if="filteredFrequentlyUsed.length === 0" class="text-center py-8">
        <p class="text-gray-500">No frequently used produce types</p>
      </div>
      
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <button
          v-for="produce in filteredFrequentlyUsed"
          :key="`freq-${produce.id}`"
          @click="selectProduce(produce)"
          class="bg-white border-2 border-gray-200 rounded-lg p-4 text-center hover:border-garden-green-300 hover:shadow-md transition-all min-h-[80px] flex flex-col justify-center touch-manipulation"
        >
          <div class="text-lg font-medium text-gray-900">{{ produce.name }}</div>
          <div class="text-sm text-gray-500">{{ produce.unitType }}</div>
          <div class="text-xs text-garden-green-600 mt-1">${{ (produce.pricePerLb || 0).toFixed(2) }}/{{ getUnitAbbr(produce.unitType) }}</div>
        </button>
      </div>
    </div>

    <!-- Rarely Used Produce (Collapsible) -->
    <div v-if="!searchQuery && filteredRarelyUsed.length > 0" class="space-y-3">
      <div>
        <button
          @click="showUnusedProduce = !showUnusedProduce"
          class="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg 
            :class="['w-5 h-5 mr-2 transition-transform', showUnusedProduce ? 'rotate-90' : '']"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-lg font-medium">
            More produce types ({{ filteredRarelyUsed.length }} unused in past year)
          </span>
        </button>
      </div>
      
      <div v-if="showUnusedProduce" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <button
          v-for="produce in filteredRarelyUsed"
          :key="`rare-${produce.id}`"
          @click="selectProduce(produce)"
          class="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-center hover:border-garden-green-300 hover:shadow-md hover:bg-white transition-all min-h-[80px] flex flex-col justify-center touch-manipulation"
        >
          <div class="text-lg font-medium text-gray-700">{{ produce.name }}</div>
          <div class="text-sm text-gray-500">{{ produce.unitType }}</div>
          <div class="text-xs text-garden-green-600 mt-1">${{ (produce.pricePerLb || 0).toFixed(2) }}/{{ getUnitAbbr(produce.unitType) }}</div>
        </button>
      </div>
    </div>

    <!-- Search Results (All Produce) -->
    <div v-if="searchQuery" class="space-y-3">
      <h3 class="text-lg font-medium text-gray-900">
        Search Results
        <span class="text-gray-500 font-normal">({{ filteredProduce.length }})</span>
      </h3>
      
      <div v-if="filteredProduce.length === 0" class="text-center py-12">
        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <p class="mt-4 text-lg text-gray-500">
          No produce found matching your search
        </p>
      </div>
      
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <button
          v-for="produce in filteredProduce"
          :key="`search-${produce.id}`"
          @click="selectProduce(produce)"
          class="bg-white border-2 border-gray-200 rounded-lg p-4 text-center hover:border-garden-green-300 hover:shadow-md transition-all min-h-[80px] flex flex-col justify-center touch-manipulation"
        >
          <div class="text-lg font-medium text-gray-900">{{ produce.name }}</div>
          <div class="text-sm text-gray-500">{{ produce.unitType }}</div>
          <div class="text-xs text-garden-green-600 mt-1">${{ (produce.pricePerLb || 0).toFixed(2) }}/{{ getUnitAbbr(produce.unitType) }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Database } from '@/types/database'

type ProduceType = Database['public']['Tables']['produce_types']['Row']
type ProduceCategory = Database['public']['Tables']['produce_categories']['Row']

interface Props {
  produceTypes: ProduceType[]
  categories: ProduceCategory[]
  loading: boolean
  recentlyUsed?: ProduceType[]
  harvestEntries?: any[] // Add harvest entries to analyze usage
}

interface Emits {
  (e: 'select', produce: ProduceType): void
}

const props = withDefaults(defineProps<Props>(), {
  recentlyUsed: () => [],
  harvestEntries: () => []
})

const emit = defineEmits<Emits>()

const selectedCategoryId = ref<string | null>(null)
const searchQuery = ref('')
const showUnusedProduce = ref(false)

// Analyze produce usage in the past 12 months
const produceUsageAnalysis = computed(() => {
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  
  const usedProduceIds = new Set()
  
  // Analyze harvest entries to find which produce types were used
  props.harvestEntries.forEach(entry => {
    const entryDate = new Date(entry.harvestDate || entry.harvest_date || entry.createdAt || entry.created_at)
    if (entryDate >= twelveMonthsAgo) {
      const produceId = entry.produceTypeId || entry.produce_type_id
      if (produceId) {
        usedProduceIds.add(String(produceId))
      }
    }
  })
  
  return {
    usedProduceIds,
    frequentlyUsed: props.produceTypes.filter(p => usedProduceIds.has(String(p.id || p._id))),
    rarelyUsed: props.produceTypes.filter(p => !usedProduceIds.has(String(p.id || p._id)))
  }
})

// Filtered frequently used produce
const filteredFrequentlyUsed = computed(() => {
  let filtered = produceUsageAnalysis.value.frequentlyUsed

  // Filter by category
  if (selectedCategoryId.value) {
    filtered = filtered.filter(p => {
      const pCategoryId = String(p.category_id || p.categoryId || '')
      const selectedId = String(selectedCategoryId.value)
      return pCategoryId === selectedId
    })
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      getCategoryName(p.category_id).toLowerCase().includes(query)
    )
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

// Filtered rarely used produce
const filteredRarelyUsed = computed(() => {
  let filtered = produceUsageAnalysis.value.rarelyUsed

  // Filter by category
  if (selectedCategoryId.value) {
    filtered = filtered.filter(p => {
      const pCategoryId = String(p.category_id || p.categoryId || '')
      const selectedId = String(selectedCategoryId.value)
      return pCategoryId === selectedId
    })
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      getCategoryName(p.category_id).toLowerCase().includes(query)
    )
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

// Combined filtered produce for backward compatibility and count display
const filteredProduce = computed(() => {
  return [...filteredFrequentlyUsed.value, ...filteredRarelyUsed.value]
})

const getCategoryName = (categoryId: string) => {
  const category = props.categories.find(c => String(c.id || c._id) === String(categoryId))
  return category?.name || 'Unknown'
}

const getUnitAbbr = (unitType: string) => {
  switch (unitType) {
    case 'pounds': return 'lb'
    case 'half-pints': return 'half-pt'
    case 'bouquets': return 'bouquet'
    default: return unitType
  }
}

const handleCategoryChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  selectedCategoryId.value = value === '' ? null : value
}

const selectProduce = (produce: ProduceType) => {
  emit('select', produce)
}
</script>