import type { HarvestEntry, ProduceType } from '@/types/database'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// Harvest API functions
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Attach the JWT when present so signed-in users can edit/delete previous
// days' entries. Today's entries don't require it.
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const api = {
  async getProduceTypes() {
    try {
      const response = await fetch(`${API_BASE}/produce-types-list`)
      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },
  
  async getHarvestEntries(date?: string) {
    try {
      const url = new URL(`${API_BASE}/harvest-list`, window.location.origin)
      if (date) {
        // Use startDate and endDate with the same date to get entries for that specific day
        url.searchParams.set('startDate', date)
        url.searchParams.set('endDate', date)
      }

      const response = await fetch(url.toString())
      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },
  
  async createHarvestEntry(data: any) {
    try {
      const response = await fetch(`${API_BASE}/harvest-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      return { data: result.data || null, error: result.success ? null : result.error }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },
  
  async updateHarvestEntry(id: string, data: any) {
    try {
      const response = await fetch(`${API_BASE}/harvest-update?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      return { data: result.data || null, error: result.success ? null : (result.error || 'Failed to update harvest entry') }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },

  async deleteHarvestEntry(id: string) {
    try {
      const response = await fetch(`${API_BASE}/harvest-delete?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      })
      const result = await response.json()
      return { error: result.success ? null : (result.error || 'Failed to delete harvest entry') }
    } catch (error: any) {
      return { error: error.message }
    }
  },

  async getPantryRecommendation(produceTypeId: string, harvestDate?: string) {
    try {
      const url = new URL(`${API_BASE}/pantry-recommendations`, window.location.origin)
      url.searchParams.set('produceTypeId', produceTypeId)
      if (harvestDate) url.searchParams.set('harvestDate', harvestDate)
      
      const response = await fetch(url.toString())
      const result = await response.json()
      return { data: result.data || null, error: result.success ? null : result.error }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
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
    // Use Eastern timezone to match the backend
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    
    return harvestEntries.value.filter(entry => {
      const entryDate = typeof entry.harvestDate === 'string' ? entry.harvestDate.split('T')[0] : entry.harvestDate
      return entryDate === today
    })
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
    loading.value = true
    try {
      const { data, error: fetchError } = await api.getProduceTypes()
      
      if (fetchError) throw fetchError
      produceTypes.value = data || []
    } catch (err) {
      console.error('❌ fetchProduceTypes error:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const fetchTodaysHarvest = async () => {
    loading.value = true
    try {
      // Get today's date in Eastern timezone to match the backend
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

      // Fetch only today's entries from the server
      const { data, error: fetchError } = await api.getHarvestEntries(today)

      if (fetchError) throw fetchError

      // Handle both old format (array) and new format (object with entries)
      const entries = data?.entries || data || []
      harvestEntries.value = entries
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
      
      // Handle both old format (array) and new format (object with entries)
      const entries = data?.entries || data || []
      recentEntries.value = entries.slice(0, limit)
      
      // Also update harvestEntries if it's not initialized
      if (!Array.isArray(harvestEntries.value)) {
        harvestEntries.value = entries
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const createHarvestEntry = async (entryData: Partial<HarvestEntry>) => {
    try {
      const { data, error: createError } = await api.createHarvestEntry({
        ...entryData,
        harvest_date: entryData.harvestDate || new Date().toISOString().split('T')[0]
      })
      
      if (createError) throw createError
      if (data) {
        // Ensure harvestEntries is an array
        if (!Array.isArray(harvestEntries.value)) {
          harvestEntries.value = []
        }
        
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

  const updateHarvestEntry = async (id: string, updates: Record<string, any>) => {
    try {
      const { data, error: updateError } = await api.updateHarvestEntry(id, updates)

      if (updateError) throw new Error(updateError)
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

      if (deleteError) throw new Error(deleteError)
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

  const getPantryRecommendation = async (produceTypeId: string, harvestDate?: string) => {
    try {
      const { data, error: fetchError } = await api.getPantryRecommendation(produceTypeId, harvestDate)
      
      if (fetchError) throw fetchError
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      return null
    }
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
    getPantryRecommendation,
  }
})