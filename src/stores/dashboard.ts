import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { HarvestEntry, FoodPantry } from '@/types/database'

// Dashboard API functions
const API_BASE = import.meta.env.VITE_API_URL || '/.netlify/functions'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const dashboardAPI = {
  async getSummary() {
    try {
      const response = await fetch(`${API_BASE}/dashboard-summary`, {
        headers: getAuthHeader()
      })
      const result = await response.json()
      return { data: result.data || null, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },
  
  async getHarvestData() {
    try {
      const response = await fetch(`${API_BASE}/harvest-list`, {
        headers: getAuthHeader()
      })
      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },
  
  async getPantryProgress() {
    // TODO: Implement pantry progress function
    console.warn('API not yet implemented: getPantryProgress')
    return { data: [], error: null }
  }
}

interface DashboardSummary {
  daily: { totalQuantity: number; totalValue: number; count: number }
  weekly: { totalQuantity: number; totalValue: number; count: number }
  monthly: { totalQuantity: number; totalValue: number; count: number }
  yearly: { totalQuantity: number; totalValue: number; count: number }
}

const defaultSummary: DashboardSummary = {
  daily: { totalQuantity: 0, totalValue: 0, count: 0 },
  weekly: { totalQuantity: 0, totalValue: 0, count: 0 },
  monthly: { totalQuantity: 0, totalValue: 0, count: 0 },
  yearly: { totalQuantity: 0, totalValue: 0, count: 0 }
}

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref<DashboardSummary>(defaultSummary)
  const harvestData = ref<HarvestEntry[]>([])
  const pantryProgress = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalHarvestedToday = computed(() => summary.value.daily.totalQuantity)
  const totalValueToday = computed(() => summary.value.daily.totalValue)
  const totalHarvestedThisWeek = computed(() => summary.value.weekly.totalQuantity)
  const totalHarvestedThisMonth = computed(() => summary.value.monthly.totalQuantity)

  // Backward compatibility for existing components
  const summaryFormatted = computed(() => ({
    today: {
      quantity: summary.value.daily.totalQuantity,
      value: summary.value.daily.totalValue
    },
    week: {
      quantity: summary.value.weekly.totalQuantity,
      value: summary.value.weekly.totalValue
    },
    month: {
      quantity: summary.value.monthly.totalQuantity,
      value: summary.value.monthly.totalValue
    },
    year: {
      quantity: summary.value.yearly.totalQuantity,
      value: summary.value.yearly.totalValue
    }
  }))

  // Additional computed properties for Charts component
  const recentEntries = computed(() => harvestData.value.slice(0, 10))
  
  const produceBreakdown = computed(() => {
    const breakdown = new Map()
    harvestData.value.forEach(entry => {
      const name = entry.produceType?.name || 'Unknown'
      const existing = breakdown.get(name) || { name, quantity: 0, value: 0 }
      existing.quantity += entry.quantity
      existing.value += entry.quantity * (entry.produceType?.conversionFactor || 0)
      breakdown.set(name, existing)
    })
    return Array.from(breakdown.values()).sort((a, b) => b.value - a.value)
  })

  const productionTrends = computed(() => {
    const trends = new Map()
    harvestData.value.forEach(entry => {
      const date = new Date(entry.harvestDate).toISOString().split('T')[0]
      const existing = trends.get(date) || { date, quantity: 0, value: 0 }
      existing.quantity += entry.quantity
      existing.value += entry.quantity * (entry.produceType?.conversionFactor || 0)
      trends.set(date, existing)
    })
    return Array.from(trends.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days
  })

  const fetchSummary = async () => {
    try {
      const { data, error: fetchError } = await dashboardAPI.getSummary()
      if (fetchError) throw new Error(fetchError)
      summary.value = data || defaultSummary
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const fetchHarvestData = async () => {
    try {
      const { data, error: fetchError } = await dashboardAPI.getHarvestData()
      if (fetchError) throw new Error(fetchError)
      harvestData.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const fetchPantryProgress = async () => {
    try {
      const { data, error: fetchError } = await dashboardAPI.getPantryProgress()
      if (fetchError) throw new Error(fetchError)
      pantryProgress.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    
    try {
      await Promise.all([
        fetchSummary(),
        fetchHarvestData(),
        fetchPantryProgress()
      ])
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State (backward compatible)
    summary: summaryFormatted,
    harvestData,
    pantryProgress,
    loading,
    error,
    
    // Chart data
    recentEntries,
    produceBreakdown,
    productionTrends,
    
    // Raw summary data
    rawSummary: summary,
    
    // Computed
    totalHarvestedToday,
    totalValueToday,
    totalHarvestedThisWeek,
    totalHarvestedThisMonth,
    
    // Actions
    fetchSummary,
    fetchHarvestData,
    fetchPantryProgress,
    fetchAll,
    clearError,
  }
})