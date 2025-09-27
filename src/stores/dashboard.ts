import type { HarvestEntry } from '@/types/database'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// Dashboard API functions
const API_BASE = import.meta.env.VITE_API_URL || '/api'

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
      // Fetch enough entries to calculate monthly totals accurately (last 1000 entries)
      const response = await fetch(`${API_BASE}/harvest-list?limit=1000&sortBy=harvestDate&sortOrder=desc`, {
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

  async getProductionTrends(weeks = 12) {
    try {
      const response = await fetch(`${API_BASE}/production-trends?weeks=${weeks}`, {
        headers: getAuthHeader()
      })
      const result = await response.json()
      return { data: result.data || null, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },

  async getMonthlyProduceBreakdown() {
    try {
      const response = await fetch(`${API_BASE}/production-trends?period=month`, {
        headers: getAuthHeader()
      })
      const result = await response.json()
      return { data: result.data || null, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },

  async getPeriodComparison() {
    try {
      const response = await fetch(`${API_BASE}/period-comparison`, {
        headers: getAuthHeader()
      })
      const result = await response.json()
      return { data: result.data || null, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },
  
  async getCommitments() {
    try {
      // Get current and last Monday dates
      const getCurrentMonday = () => {
        const today = new Date()
        const dayOfWeek = today.getDay()
        const monday = new Date(today)
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        monday.setDate(today.getDate() - daysFromMonday)
        return monday
      }
      
      const getLastMonday = () => {
        const currentMonday = getCurrentMonday()
        const lastMonday = new Date(currentMonday)
        lastMonday.setDate(currentMonday.getDate() - 7)
        return lastMonday
      }

      const thisMonday = getCurrentMonday()
      const lastMonday = getLastMonday()
      
      // Calculate Sunday end dates (Monday + 6 days)
      const thisSunday = new Date(thisMonday)
      thisSunday.setDate(thisMonday.getDate() + 6)
      
      const lastSunday = new Date(lastMonday)
      lastSunday.setDate(lastMonday.getDate() + 6)
      
      const thisMondayStr = thisMonday.toISOString().split('T')[0]
      const thisSundayStr = thisSunday.toISOString().split('T')[0]
      const lastMondayStr = lastMonday.toISOString().split('T')[0]
      const lastSundayStr = lastSunday.toISOString().split('T')[0]

      // Fetch food pantries
      const pantriesResponse = await fetch(`${API_BASE}/food-pantries`, {
        headers: getAuthHeader()
      })
      const pantriesResult = await pantriesResponse.json()
      const pantries = pantriesResult.data || []
      
      const broadStreetPantry = pantries.find((p: any) => 
        p.name.toLowerCase().includes('broad street')
      )
      
      if (!broadStreetPantry) {
        return { data: null, error: 'Broad Street Food Pantry not found' }
      }

      // Fetch commitments for both weeks (Monday to Sunday)
      const thisWeekUrl = `${API_BASE}/commitments?pantryId=${broadStreetPantry._id}&startDate=${thisMondayStr}&endDate=${thisSundayStr}`
      const lastWeekUrl = `${API_BASE}/commitments?pantryId=${broadStreetPantry._id}&startDate=${lastMondayStr}&endDate=${lastSundayStr}`
      
      const [thisWeekResponse, lastWeekResponse] = await Promise.all([
        fetch(thisWeekUrl, {
          headers: getAuthHeader()
        }),
        fetch(lastWeekUrl, {
          headers: getAuthHeader()
        })
      ])

      const thisWeekResult = await thisWeekResponse.json()
      const lastWeekResult = await lastWeekResponse.json()
      
      // Fetch harvest entries for both weeks
      const [thisWeekHarvest, lastWeekHarvest] = await Promise.all([
        fetch(`${API_BASE}/harvest-list?pantryId=${broadStreetPantry._id}&startDate=${thisMondayStr}&endDate=${thisSundayStr}`, {
          headers: getAuthHeader()
        }),
        fetch(`${API_BASE}/harvest-list?pantryId=${broadStreetPantry._id}&startDate=${lastMondayStr}&endDate=${lastSundayStr}`, {
          headers: getAuthHeader()
        })
      ])

      const thisWeekHarvestResult = await thisWeekHarvest.json()
      const lastWeekHarvestResult = await lastWeekHarvest.json()

      return { 
        data: {
          pantry: broadStreetPantry,
          thisWeek: {
            commitments: thisWeekResult.data || [],
            harvest: thisWeekHarvestResult.data?.entries || thisWeekHarvestResult.data || [],
            weekStart: thisMondayStr
          },
          lastWeek: {
            commitments: lastWeekResult.data || [],
            harvest: lastWeekHarvestResult.data?.entries || lastWeekHarvestResult.data || [],
            weekStart: lastMondayStr
          }
        }, 
        error: null 
      }
    } catch (error: any) {
      return { data: null, error: error.message }
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
      const harvestResponse = await fetch(`${API_BASE}/harvest-list?limit=2000`, {
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
          const harvestDate = entry.harvestDate || entry.harvest_date
          
          // Ensure we have a valid date
          if (!harvestDate) return false
          
          const harvestYear = new Date(harvestDate).getFullYear()
          const matches = entryPantryId === pantryId && harvestYear === currentYear
          return matches
        })
        
        // Calculate delivered weight, handling both weight field and calculated weight
        const delivered = relevantEntries.reduce((total: number, entry: any) => {
          // Use actual weight if available, otherwise calculate from quantity
          let entryWeight = 0
          
          if (entry.weight && entry.weight > 0) {
            // Use the actual weight if provided
            entryWeight = entry.weight
          } else if (entry.quantity && entry.quantity > 0) {
            // Calculate weight from quantity if weight is not available
            // This handles older entries that might not have weight field
            const conversionFactor = entry.produceType?.conversionFactor || 
                                    entry.produceType?.conversion_factor || 1
            entryWeight = entry.quantity * conversionFactor
          }
          
          
          return total + entryWeight
        }, 0)
        
        
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
  const productionTrendsData = ref<any>(null)
  const monthlyBreakdownData = ref<any>(null)
  const periodComparisonData = ref<any>(null)
  const commitmentData = ref<any>(null)
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
    if (!monthlyBreakdownData.value?.productTotals) return []
    
    // Convert server-side productTotals to the format expected by the chart
    return Object.entries(monthlyBreakdownData.value.productTotals).map(([name, quantity]) => ({
      name,
      quantity: Number(quantity),
      value: 0 // Value calculation would need to be added to the API if needed
    }))
  })

  const productionTrends = computed(() => {
    return productionTrendsData.value || { labels: [], datasets: [], summary: null }
  })

  const periodComparison = computed(() => {
    return periodComparisonData.value
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

  const fetchProductionTrends = async () => {
    try {
      const { data, error: fetchError } = await dashboardAPI.getProductionTrends()
      if (fetchError) throw new Error(fetchError)
      productionTrendsData.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const fetchMonthlyBreakdown = async () => {
    try {
      const { data, error: fetchError } = await dashboardAPI.getMonthlyProduceBreakdown()
      if (fetchError) throw new Error(fetchError)
      monthlyBreakdownData.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const fetchPeriodComparison = async () => {
    try {
      const { data, error: fetchError } = await dashboardAPI.getPeriodComparison()
      if (fetchError) throw new Error(fetchError)
      periodComparisonData.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const fetchCommitments = async () => {
    try {
      const { data, error: fetchError } = await dashboardAPI.getCommitments()
      if (fetchError) throw new Error(fetchError)
      commitmentData.value = data
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
        fetchProductionTrends(),
        fetchMonthlyBreakdown(),
        fetchPeriodComparison(),
        fetchCommitments()
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
    commitmentData,
    loading,
    error,
    
    // Chart data
    recentEntries,
    produceBreakdown,
    productionTrends,
    periodComparison,
    
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
    fetchProductionTrends,
    fetchMonthlyBreakdown,
    fetchPeriodComparison,
    fetchCommitments,
    fetchAll,
    clearError,
  }
})