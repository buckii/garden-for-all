import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type HarvestEntry = Database['public']['Tables']['harvest_entries']['Row']
type ProduceType = Database['public']['Tables']['produce_types']['Row']

export const useHarvestStore = defineStore('harvest', () => {
  const harvestEntries = ref<HarvestEntry[]>([])
  const produceTypes = ref<ProduceType[]>([])
  const recentEntries = ref<HarvestEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const todaysEntries = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return harvestEntries.value.filter(entry => entry.harvest_date === today)
  })

  const totalQuantityToday = computed(() => {
    return todaysEntries.value.reduce((total, entry) => total + entry.quantity, 0)
  })

  const totalValueToday = computed(() => {
    return todaysEntries.value.reduce((total, entry) => {
      const produceType = produceTypes.value.find(p => p.id === entry.produce_type_id)
      return total + (entry.quantity * (produceType?.conversion_factor || 0))
    }, 0)
  })

  // Actions
  const fetchProduceTypes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('produce_types')
        .select(`
          *,
          category:produce_categories(*)
        `)
        .order('name')
      
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
      const { data, error: fetchError } = await supabase
        .from('harvest_entries')
        .select(`
          *,
          produce_type:produce_types(
            *,
            category:produce_categories(*)
          )
        `)
        .eq('harvest_date', today)
        .order('created_at', { ascending: false })
      
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
        .limit(limit)
      
      if (fetchError) throw fetchError
      recentEntries.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const createHarvestEntry = async (entryData: Database['public']['Tables']['harvest_entries']['Insert']) => {
    try {
      const { data, error: createError } = await supabase
        .from('harvest_entries')
        .insert({
          ...entryData,
          harvest_date: entryData.harvest_date || new Date().toISOString().split('T')[0]
        })
        .select(`
          *,
          produce_type:produce_types(
            *,
            category:produce_categories(*)
          )
        `)
        .single()
      
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

  const updateHarvestEntry = async (id: string, updates: Database['public']['Tables']['harvest_entries']['Update']) => {
    try {
      const { data, error: updateError } = await supabase
        .from('harvest_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          produce_type:produce_types(
            *,
            category:produce_categories(*)
          )
        `)
        .single()
      
      if (updateError) throw updateError
      if (data) {
        const harvestIndex = harvestEntries.value.findIndex(e => e.id === id)
        if (harvestIndex !== -1) harvestEntries.value[harvestIndex] = data
        
        const recentIndex = recentEntries.value.findIndex(e => e.id === id)
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
      const { error: deleteError } = await supabase
        .from('harvest_entries')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      harvestEntries.value = harvestEntries.value.filter(e => e.id !== id)
      recentEntries.value = recentEntries.value.filter(e => e.id !== id)
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