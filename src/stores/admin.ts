import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ProduceCategory, ProduceType, FoodPantry } from '@/types/database'

// Placeholder API for admin operations
const adminAPI = {
  async getCategories() { return { data: [], error: null } },
  async getProduceTypes() { return { data: [], error: null } },
  async getPantries() { return { data: [], error: null } },
  async createCategory(data: any) { return { data: null, error: null } },
  async updateCategory(id: string, data: any) { return { data: null, error: null } },
  async deleteCategory(id: string) { return { error: null } },
  async createProduceType(data: any) { return { data: null, error: null } },
  async updateProduceType(id: string, data: any) { return { data: null, error: null } },
  async deleteProduceType(id: string) { return { error: null } },
  async createPantry(data: any) { return { data: null, error: null } },
  async updatePantry(id: string, data: any) { return { data: null, error: null } },
  async deletePantry(id: string) { return { error: null } }
}

export const useAdminStore = defineStore('admin', () => {
  const categories = ref<ProduceCategory[]>([])
  const produceTypes = ref<ProduceType[]>([])
  const foodPantries = ref<FoodPantry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const categoriesByDisplayOrder = computed(() => 
    [...categories.value].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  )

  // Categories
  const fetchCategories = async () => {
    loading.value = true
    try {
      const { data, error: fetchError } = await supabase
        .from('produce_categories')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      categories.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const createCategory = async (categoryData: Database['public']['Tables']['produce_categories']['Insert']) => {
    try {
      const { data, error: createError } = await supabase
        .from('produce_categories')
        .insert(categoryData)
        .select()
        .single()
      
      if (createError) throw createError
      if (data) categories.value.push(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const updateCategory = async (id: string, updates: Database['public']['Tables']['produce_categories']['Update']) => {
    try {
      const { data, error: updateError } = await supabase
        .from('produce_categories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      if (data) {
        const index = categories.value.findIndex(c => c.id === id)
        if (index !== -1) categories.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('produce_categories')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  // Produce Types
  const fetchProduceTypes = async () => {
    loading.value = true
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
    } finally {
      loading.value = false
    }
  }

  const createProduceType = async (produceTypeData: Database['public']['Tables']['produce_types']['Insert']) => {
    try {
      const { data, error: createError } = await supabase
        .from('produce_types')
        .insert(produceTypeData)
        .select()
        .single()
      
      if (createError) throw createError
      if (data) produceTypes.value.push(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const updateProduceType = async (id: string, updates: Database['public']['Tables']['produce_types']['Update']) => {
    try {
      const { data, error: updateError } = await supabase
        .from('produce_types')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      if (data) {
        const index = produceTypes.value.findIndex(p => p.id === id)
        if (index !== -1) produceTypes.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const deleteProduceType = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('produce_types')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      produceTypes.value = produceTypes.value.filter(p => p.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  // Food Pantries
  const fetchFoodPantries = async () => {
    loading.value = true
    try {
      const { data, error: fetchError } = await supabase
        .from('food_pantries')
        .select('*')
        .order('name')
      
      if (fetchError) throw fetchError
      foodPantries.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const createFoodPantry = async (pantryData: Database['public']['Tables']['food_pantries']['Insert']) => {
    try {
      const { data, error: createError } = await supabase
        .from('food_pantries')
        .insert(pantryData)
        .select()
        .single()
      
      if (createError) throw createError
      if (data) foodPantries.value.push(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const updateFoodPantry = async (id: string, updates: Database['public']['Tables']['food_pantries']['Update']) => {
    try {
      const { data, error: updateError } = await supabase
        .from('food_pantries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      if (data) {
        const index = foodPantries.value.findIndex(f => f.id === id)
        if (index !== -1) foodPantries.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const deleteFoodPantry = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('food_pantries')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      foodPantries.value = foodPantries.value.filter(f => f.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  return {
    // State
    categories,
    produceTypes,
    foodPantries,
    loading,
    error,
    
    // Computed
    categoriesByDisplayOrder,
    
    // Actions
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchProduceTypes,
    createProduceType,
    updateProduceType,
    deleteProduceType,
    fetchFoodPantries,
    createFoodPantry,
    updateFoodPantry,
    deleteFoodPantry,
  }
})