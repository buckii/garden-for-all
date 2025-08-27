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
      // Handle new API format with entries and pagination
      const entries = result.data?.entries || result.data || []
      return { data: entries, error: null }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },
  
  async getPantryProgress() {
    try {
      // Fetch food pantries
      const pantriesResponse = await fetch(`${API_BASE}/admin-food-pantries`, {
        headers: getAuthHeader()
      })
      const pantriesResult = await pantriesResponse.json()
      const pantries = pantriesResult.data || []
      
      // Fetch harvest entries to calculate actual deliveries
      const harvestResponse = await fetch(`${API_BASE}/harvest-list`, {
        headers: getAuthHeader()
      })
      const harvestResult = await harvestResponse.json()
      // Handle both old format (array) and new format (object with entries)
      const harvestEntries = harvestResult.data?.entries || harvestResult.data || []
      
      // Calculate progress for each pantry
      const progressData = pantries.map((pantry: any) => {
        const commitment = pantry.commitmentAmounts || pantry.commitment_amounts
        const totalCommitted = commitment?.total || 0
        
        // Skip pantries without commitments
        if (totalCommitted === 0) return null
        
        const pantryId = pantry.id || pantry._id
        
        // Calculate total weight delivered to this pantry this year
        const currentYear = new Date().getFullYear()
        const relevantEntries = harvestEntries.filter((entry: any) => {
          const entryPantryId = entry.pantryId || entry.pantry_id
          const harvestYear = new Date(entry.harvestDate || entry.harvest_date).getFullYear()
          const matches = entryPantryId === pantryId && harvestYear === currentYear
          if (matches) {
            console.log(`Pantry ${pantry.name} - Found harvest:`, {
              entryId: entry._id,
              weight: entry.weight,
              date: entry.harvestDate || entry.harvest_date,
              pantryId: entryPantryId
            })
          }
          return matches
        })
        
        const delivered = relevantEntries.reduce((total: number, entry: any) => {
          return total + (entry.weight || 0)
        }, 0)
        
        console.log(`Pantry ${pantry.name} (${pantryId}):`, {
          totalEntries: harvestEntries.length,
          relevantEntries: relevantEntries.length,
          totalDelivered: delivered,
          committed: totalCommitted
        })
        
        const remaining = Math.max(0, totalCommitted - delivered)
        const percentage = totalCommitted > 0 ? (delivered / totalCommitted) * 100 : 0
        
        return {
          pantry: {
            id: pantry.id || pantry._id,
            name: pantry.name,
            contactInfo: pantry.contactInfo || pantry.contact_info,
            commitmentAmounts: pantry.commitmentAmounts || pantry.commitment_amounts
          },
          committed: totalCommitted,
          delivered,
          remaining,
          percentage
        }
      }).filter(Boolean) // Remove null entries (pantries without commitments)
      
      // Filter out pantries with no distributions and sort by delivered amount
      const filteredProgressData = progressData
        .filter(item => item.delivered > 0) // Hide pantries with no distributions
        .sort((a, b) => b.delivered - a.delivered) // Sort by total pounds distributed (descending)
      
      return { data: filteredProgressData, error: null }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
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
  const recentEntries = computed(() => {
    const entries = Array.isArray(harvestData.value) ? harvestData.value : []
    return entries.slice(0, 10)
  })
  
  const produceBreakdown = computed(() => {
    const breakdown = new Map()
    const entries = Array.isArray(harvestData.value) ? harvestData.value : []
    entries.forEach(entry => {
      // Use actual weight if available, otherwise calculate from quantity
      const weightInPounds = entry.weight || (entry.quantity * (entry.produceType?.conversionFactor || 1))
      
      // Only include entries with either quantity > 0 or weight > 0
      if (entry.quantity > 0 || weightInPounds > 0) {
        const name = entry.produceType?.name || 'Unknown'
        const existing = breakdown.get(name) || { name, quantity: 0, value: 0 }
        existing.quantity += weightInPounds
        existing.value += weightInPounds * (entry.produceType?.pricePerLb || 0)
        breakdown.set(name, existing)
      }
    })
    return Array.from(breakdown.values()).sort((a, b) => b.quantity - a.quantity)
  })

  const productionTrends = computed(() => {
    const trends = new Map()
    const entries = Array.isArray(harvestData.value) ? harvestData.value : []
    entries.forEach(entry => {
      // Use actual weight if available, otherwise calculate from quantity
      const weightInPounds = entry.weight || (entry.quantity * (entry.produceType?.conversionFactor || 1))
      
      // Only include entries with either quantity > 0 or weight > 0
      if (entry.quantity > 0 || weightInPounds > 0) {
        const date = new Date(entry.harvestDate).toISOString().split('T')[0]
        const existing = trends.get(date) || { date, quantity: 0, value: 0 }
        existing.quantity += weightInPounds
        existing.value += weightInPounds * (entry.produceType?.pricePerLb || 0)
        trends.set(date, existing)
      }
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