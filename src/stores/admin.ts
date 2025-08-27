import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ProduceCategory, ProduceType, FoodPantry } from '@/types/database'

// Admin API functions
const API_BASE = import.meta.env.VITE_API_URL || '/.netlify/functions'

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const adminAPI = {
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE}/admin-categories`)
      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },
  
  async getProduceTypes() {
    try {
      const response = await fetch(`${API_BASE}/admin-produce-types`)
      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },
  
  async getPantries() {
    try {
      const response = await fetch(`${API_BASE}/admin-food-pantries`)
      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },
  
  async createCategory(data: any) {
    try {
      const response = await fetch(`${API_BASE}/admin-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      return { data: result.data || null, error: result.success ? null : result.error }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },
  
  async updateCategory(id: string, data: any) {
    try {
      const response = await fetch(`${API_BASE}/admin-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      return { data: result.data || null, error: result.success ? null : result.error }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },
  
  async deleteCategory(id: string) {
    try {
      const response = await fetch(`${API_BASE}/admin-categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      const result = await response.json()
      return { error: result.success ? null : result.error }
    } catch (error: any) {
      return { error: error.message }
    }
  },
  
  async createProduceType(data: any) {
    try {
      const response = await fetch(`${API_BASE}/admin-produce-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      return { data: result.data || null, error: result.success ? null : result.error }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },
  async updateProduceType(id: string, data: any) {
    try {
      const response = await fetch(`${API_BASE}/admin-produce-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      return { data: result.data || null, error: result.success ? null : result.error }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },
  async deleteProduceType(id: string) {
    try {
      const response = await fetch(`${API_BASE}/admin-produce-types/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      const result = await response.json()
      return { error: result.success ? null : result.error }
    } catch (error: any) {
      return { error: error.message }
    }
  },
  async createPantry(data: any) {
    try {
      console.log('createPantry called with data:', data)
      const response = await fetch(`${API_BASE}/admin-food-pantries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      })
      console.log('createPantry response status:', response.status, 'method was POST')
      const result = await response.json()
      return { data: result.data || null, error: result.success ? null : result.error }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },
  async updatePantry(id: string, data: any) {
    try {
      console.log('updatePantry called with ID:', id, 'data:', data)
      const response = await fetch(`${API_BASE}/admin-food-pantries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      })
      console.log('updatePantry response status:', response.status, 'method was PUT')
      const result = await response.json()
      return { data: result.data || null, error: result.success ? null : result.error }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  },
  async deletePantry(id: string) {
    try {
      const response = await fetch(`${API_BASE}/admin-food-pantries/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      const result = await response.json()
      return { error: result.success ? null : result.error }
    } catch (error: any) {
      return { error: error.message }
    }
  }
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
      const { data, error: fetchError } = await adminAPI.getCategories()
      if (fetchError) throw new Error(fetchError)
      categories.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const createCategory = async (categoryData: any) => {
    try {
      const { data, error: createError } = await adminAPI.createCategory(categoryData)
      if (createError) throw new Error(createError)
      if (data) categories.value.push(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const updateCategory = async (id: string, updates: any) => {
    try {
      const { data, error: updateError } = await adminAPI.updateCategory(id, updates)
      if (updateError) throw new Error(updateError)
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
      const { error: deleteError } = await adminAPI.deleteCategory(id)
      if (deleteError) throw new Error(deleteError)
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
      const { data, error: fetchError } = await adminAPI.getProduceTypes()
      if (fetchError) throw new Error(fetchError)
      produceTypes.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const createProduceType = async (produceTypeData: any) => {
    try {
      const { data, error: createError } = await adminAPI.createProduceType(produceTypeData)
      if (createError) throw new Error(createError)
      if (data) produceTypes.value.push(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const updateProduceType = async (id: string, updates: any) => {
    try {
      const { data, error: updateError } = await adminAPI.updateProduceType(id, updates)
      if (updateError) throw new Error(updateError)
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
      const { error: deleteError } = await adminAPI.deleteProduceType(id)
      if (deleteError) throw new Error(deleteError)
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
      const { data, error: fetchError } = await adminAPI.getPantries()
      if (fetchError) throw new Error(fetchError)
      foodPantries.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const createFoodPantry = async (pantryData: any) => {
    try {
      const { data, error: createError } = await adminAPI.createPantry(pantryData)
      if (createError) throw new Error(createError)
      if (data) foodPantries.value.push(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
  }

  const updateFoodPantry = async (id: string, updates: any) => {
    try {
      const { data, error: updateError } = await adminAPI.updatePantry(id, updates)
      if (updateError) throw new Error(updateError)
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
      const { error: deleteError } = await adminAPI.deletePantry(id)
      if (deleteError) throw new Error(deleteError)
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