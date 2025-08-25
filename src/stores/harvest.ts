import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { HarvestEntry, ProduceType, Database } from '@/types/database'

// Temporary placeholder API - will be replaced with actual Netlify Functions
const api = {
  async getProduceTypes() {
    console.warn('API not implemented: getProduceTypes')
    return { data: [], error: null }
  },
  async getHarvestEntries(date?: string) {
    console.warn('API not implemented: getHarvestEntries')
    return { data: [], error: null }
  },
  async createHarvestEntry(data: any) {
    console.warn('API not implemented: createHarvestEntry')
    return { data: null, error: null }
  },
  async updateHarvestEntry(id: string, data: any) {
    console.warn('API not implemented: updateHarvestEntry')
    return { data: null, error: null }
  },
  async deleteHarvestEntry(id: string) {
    console.warn('API not implemented: deleteHarvestEntry')
    return { error: null }
  }
}

export const useHarvestStore = defineStore('harvest', () => {
  const harvestEntries = ref<HarvestEntry[]>([])
  const produceTypes = ref<ProduceType[]>([])
  const recentEntries = ref<HarvestEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const todaysEntries = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return harvestEntries.value.filter(entry => entry.harvestDate === today)
  })

  const totalQuantityToday = computed(() => {
    return todaysEntries.value.reduce((total, entry) => total + entry.quantity, 0)
  })

  const totalValueToday = computed(() => {
    return todaysEntries.value.reduce((total, entry) => {
      const produceType = produceTypes.value.find(p => p._id === entry.produceTypeId)
      return total + (entry.quantity * (produceType?.conversionFactor || 0))
    }, 0)
  })

  // Actions
  const fetchProduceTypes = async () => {
    try {
      const { data, error: fetchError } = await api.getProduceTypes()
      
      if (fetchError) throw fetchError
      produceTypes.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const fetchTodaysHarvest = async () => {
    loading.value = true
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error: fetchError } = await api.getHarvestEntries(today)
      
      if (fetchError) throw fetchError
      harvestEntries.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const fetchRecentEntries = async (limit = 10) => {
    try {
      const { data, error: fetchError } = await api.getHarvestEntries()
      
      if (fetchError) throw fetchError
      recentEntries.value = (data || []).slice(0, limit)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const createHarvestEntry = async (entryData: Partial<HarvestEntry>) => {
    try {
      const { data, error: createError } = await api.createHarvestEntry({
        ...entryData,
        harvestDate: entryData.harvestDate || new Date().toISOString().split('T')[0]
      })
      
      if (createError) throw createError
      if (data) {
        harvestEntries.value.unshift(data)
        recentEntries.value.unshift(data)
        // Keep only recent entries (last 50)
        if (recentEntries.value.length > 50) {
          recentEntries.value = recentEntries.value.slice(0, 50)
        }
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const updateHarvestEntry = async (id: string, updates: Partial<HarvestEntry>) => {
    try {
      const { data, error: updateError } = await api.updateHarvestEntry(id, updates)
      
      if (updateError) throw updateError
      if (data) {
        const harvestIndex = harvestEntries.value.findIndex(e => e._id === id)
        if (harvestIndex !== -1) harvestEntries.value[harvestIndex] = data
        
        const recentIndex = recentEntries.value.findIndex(e => e._id === id)
        if (recentIndex !== -1) recentEntries.value[recentIndex] = data
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const deleteHarvestEntry = async (id: string) => {
    try {
      const { error: deleteError } = await api.deleteHarvestEntry(id)
      
      if (deleteError) throw deleteError
      harvestEntries.value = harvestEntries.value.filter(e => e._id !== id)
      recentEntries.value = recentEntries.value.filter(e => e._id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    harvestEntries,
    produceTypes,
    recentEntries,
    loading,
    error,
    
    // Computed
    todaysEntries,
    totalQuantityToday,
    totalValueToday,
    
    // Actions
    fetchProduceTypes,
    fetchTodaysHarvest,
    fetchRecentEntries,
    createHarvestEntry,
    updateHarvestEntry,
    deleteHarvestEntry,
    clearError,
  }
})