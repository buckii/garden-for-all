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

    <!-- Produce Grid -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium text-gray-900">
        {{ selectedCategoryId ? getCategoryName(selectedCategoryId) : 'All Produce' }}
        <span class="text-gray-500 font-normal">({{ filteredProduce.length }})</span>
      </h3>
      
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-garden-green-600"></div>
      </div>
      
      <div v-else-if="filteredProduce.length === 0" class="text-center py-12">
        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <p class="mt-4 text-lg text-gray-500">
          {{ searchQuery ? 'No produce found matching your search' : 'No produce types available' }}
        </p>
      </div>
      
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <button
          v-for="produce in filteredProduce"
          :key="produce.id"
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


type ProduceType = Database['public']['Tables']['produce_types']['Row']
type ProduceCategory = Database['public']['Tables']['produce_categories']['Row']

interface Props {
  produceTypes: ProduceType[]
  categories: ProduceCategory[]
  loading: boolean
  recentlyUsed?: ProduceType[]
}

interface Emits {
  (e: 'select', produce: ProduceType): void
}

const props = withDefaults(defineProps<Props>(), {
  recentlyUsed: () => []
})

const emit = defineEmits<Emits>()

const selectedCategoryId = ref<string | null>(null)
const searchQuery = ref('')

const filteredProduce = computed(() => {
  let filtered = props.produceTypes

  // Filter by category - ensure string comparison
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

const getCategoryName = (categoryId: string) => {
  const category = props.categories.find(c => String(c.id || c._id) === String(categoryId))
  return category?.name || 'Unknown'
}

const getUnitAbbr = (unitType: string) => {
  switch (unitType) {
    case 'pounds': return 'lb'
    case 'pints': return 'pt'
    case 'bunches': return 'bunch'
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