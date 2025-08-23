<template>
  <div class="space-y-6">
    <!-- Category Filter -->
    <div class="flex flex-wrap gap-2">
      <button
        @click="selectedCategoryId = null"
        :class="[
          'px-6 py-3 rounded-lg text-lg font-medium transition-colors min-h-[44px]',
          !selectedCategoryId 
            ? 'bg-garden-green-600 text-white shadow-lg' 
            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-garden-green-300'
        ]"
      >
        All
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        @click="selectedCategoryId = category.id"
        :class="[
          'px-6 py-3 rounded-lg text-lg font-medium transition-colors min-h-[44px]',
          selectedCategoryId === category.id 
            ? 'bg-garden-green-600 text-white shadow-lg' 
            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-garden-green-300'
        ]"
      >
        {{ category.name }}
      </button>
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
          class="bg-garden-green-50 border-2 border-garden-green-200 rounded-lg p-4 text-center hover:bg-garden-green-100 hover:border-garden-green-300 transition-colors min-h-[100px] flex flex-col justify-center"
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
          class="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-garden-green-300 hover:shadow-md transition-all min-h-[120px] flex flex-col justify-center touch-manipulation"
        >
          <!-- Placeholder for produce image -->
          <div class="w-12 h-12 mx-auto mb-3 bg-garden-green-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-garden-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          
          <div class="text-lg font-medium text-gray-900">{{ produce.name }}</div>
          <div class="text-sm text-gray-500">{{ produce.unit_type }}</div>
          <div class="text-xs text-garden-green-600 mt-1">${{ produce.conversion_factor }}/{{ getUnitAbbr(produce.unit_type) }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Database } from '@/lib/supabase'

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

  // Filter by category
  if (selectedCategoryId.value) {
    filtered = filtered.filter(p => p.category_id === selectedCategoryId.value)
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
  const category = props.categories.find(c => c.id === categoryId)
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

const selectProduce = (produce: ProduceType) => {
  emit('select', produce)
}
</script>