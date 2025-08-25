import { ref, computed } from 'vue'
import { defineStore } from 'pinia'



type HarvestEntry = Database['public']['Tables']['harvest_entries']['Row']
type FoodPantry = Database['public']['Tables']['food_pantries']['Row']
type ProduceType = Database['public']['Tables']['produce_types']['Row']

interface DashboardSummary {
  today: { quantity: number; value: number }
  week: { quantity: number; value: number }
  month: { quantity: number; value: number }
  year: { quantity: number; value: number }
}

interface PantryProgress {
  pantry: FoodPantry
  committed: number
  delivered: number
  remaining: number
  percentage: number
}

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref<DashboardSummary>({
    today: { quantity: 0, value: 0 },
    week: { quantity: 0, value: 0 },
    month: { quantity: 0, value: 0 },
    year: { quantity: 0, value: 0 }
  })
  
  const recentEntries = ref<HarvestEntry[]>([])
  const pantryProgress = ref<PantryProgress[]>([])
  const produceBreakdown = ref<{ name: string; quantity: number; value: number }[]>([])
  const productionTrends = ref<{ date: string; quantity: number; value: number }[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date>(new Date())

  // Computed
  const formattedLastUpdated = computed(() => {
    return lastUpdated.value.toLocaleTimeString()
  })

  // Actions
  const fetchDashboardData = async () => {
    loading.value = true
    try {
      await Promise.all([
        fetchSummaryStats(),
        fetchRecentEntries(),
        fetchPantryProgress(),
        fetchProduceBreakdown(),
        fetchProductionTrends()
      ])
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch dashboard data'
    } finally {
      loading.value = false
    }
  }

  const fetchSummaryStats = async () => {
    const today = new Date()
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const yearStart = new Date(today.getFullYear(), 0, 1)

    // Fetch harvest entries with produce type info
    const { data: entries, error: entriesError } = await supabase
      .from('harvest_entries')
      .select(`
        *,
        produce_type:produce_types(*)
      `)
      .gte('harvest_date', yearStart.toISOString().split('T')[0])

    if (entriesError) throw entriesError

    // Calculate summaries
    const todayStr = today.toISOString().split('T')[0]
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const monthStartStr = monthStart.toISOString().split('T')[0]
    const yearStartStr = yearStart.toISOString().split('T')[0]

    console.log('Dashboard Debug:', {
      totalEntries: entries?.length || 0,
      todayStr,
      weekStartStr,
      monthStartStr,
      yearStartStr,
      sampleEntry: entries?.[0]
    })

    summary.value = {
      today: calculatePeriodSummary(entries || [], todayStr),
      week: calculatePeriodSummary(entries || [], weekStartStr),
      month: calculatePeriodSummary(entries || [], monthStartStr),
      year: calculatePeriodSummary(entries || [], yearStartStr)
    }

    console.log('Calculated Summary:', summary.value)
  }

  const calculatePeriodSummary = (entries: any[], startDate: string) => {
    const periodEntries = entries.filter(entry => entry.harvest_date >= startDate)
    
    console.log(`Period calculation for ${startDate}:`, {
      totalEntries: entries.length,
      filteredEntries: periodEntries.length,
      periodEntries: periodEntries.map(e => ({ 
        date: e.harvest_date, 
        quantity: e.quantity, 
        conversionFactor: e.produce_type?.conversion_factor 
      }))
    })
    
    return periodEntries.reduce((acc, entry) => {
      const conversionFactor = entry.produce_type?.conversion_factor || 0
      return {
        quantity: acc.quantity + entry.quantity,
        value: acc.value + (entry.quantity * conversionFactor)
      }
    }, { quantity: 0, value: 0 })
  }

  const fetchRecentEntries = async () => {
    const { data, error: fetchError } = await supabase
      .from('harvest_entries')
      .select(`
        *,
        produce_type:produce_types(
          *,
          category:produce_categories(*)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (fetchError) throw fetchError
    recentEntries.value = data || []
  }

  const fetchPantryProgress = async () => {
    // Fetch pantries and their commitments
    const { data: pantries, error: pantriesError } = await supabase
      .from('food_pantries')
      .select('*')

    if (pantriesError) throw pantriesError

    // Fetch distributions for current year
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const { data: distributions, error: distributionsError } = await supabase
      .from('pantry_distributions')
      .select(`
        *,
        harvest_entry:harvest_entries(
          *,
          produce_type:produce_types(*)
        )
      `)
      .gte('distribution_date', yearStart)

    if (distributionsError) throw distributionsError

    // Calculate progress for each pantry
    pantryProgress.value = (pantries || []).map(pantry => {
      const pantryDistributions = (distributions || []).filter(d => d.pantry_id === pantry.id)
      const delivered = pantryDistributions.reduce((sum, dist) => {
        const conversionFactor = dist.harvest_entry?.produce_type?.conversion_factor || 0
        return sum + (dist.quantity_distributed * conversionFactor)
      }, 0)
      
      const committed = pantry.commitment_amounts?.total || 0
      const remaining = Math.max(0, committed - delivered)
      const percentage = committed > 0 ? Math.min(100, (delivered / committed) * 100) : 0

      return {
        pantry,
        committed,
        delivered,
        remaining,
        percentage
      }
    })
  }

  const fetchProduceBreakdown = async () => {
    const monthStart = new Date()
    monthStart.setDate(1)
    const monthStartStr = monthStart.toISOString().split('T')[0]

    const { data, error: fetchError } = await supabase
      .from('harvest_entries')
      .select(`
        quantity,
        produce_type:produce_types(
          name,
          conversion_factor,
          category:produce_categories(name)
        )
      `)
      .gte('harvest_date', monthStartStr)

    if (fetchError) throw fetchError

    // Group by produce type
    const breakdown = (data || []).reduce((acc: any, entry: any) => {
      const name = entry.produce_type?.name || 'Unknown'
      const conversionFactor = entry.produce_type?.conversion_factor || 0
      
      if (!acc[name]) {
        acc[name] = { name, quantity: 0, value: 0 }
      }
      
      acc[name].quantity += entry.quantity
      acc[name].value += entry.quantity * conversionFactor
      
      return acc
    }, {})

    produceBreakdown.value = (Object.values(breakdown) as { name: string; quantity: number; value: number }[])
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10
  }

  const fetchProductionTrends = async () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString().split('T')[0]

    const { data, error: fetchError } = await supabase
      .from('harvest_entries')
      .select(`
        harvest_date,
        quantity,
        produce_type:produce_types(conversion_factor)
      `)
      .gte('harvest_date', startDate)
      .order('harvest_date')

    if (fetchError) throw fetchError

    // Group by date
    const trends = (data || []).reduce((acc: any, entry: any) => {
      const date = entry.harvest_date
      const conversionFactor = entry.produce_type?.conversion_factor || 0
      
      if (!acc[date]) {
        acc[date] = { date, quantity: 0, value: 0 }
      }
      
      acc[date].quantity += entry.quantity
      acc[date].value += entry.quantity * conversionFactor
      
      return acc
    }, {})

    productionTrends.value = Object.values(trends) as { date: string; quantity: number; value: number }[]
  }

  const refreshData = async () => {
    await fetchDashboardData()
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    summary,
    recentEntries,
    pantryProgress,
    produceBreakdown,
    productionTrends,
    loading,
    error,
    lastUpdated,
    
    // Computed
    formattedLastUpdated,
    
    // Actions
    fetchDashboardData,
    refreshData,
    clearError,
  }
})