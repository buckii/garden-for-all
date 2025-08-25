// Database types for MongoDB-based system
export interface User {
  _id: string
  email: string
  role: 'admin' | 'user'
  firstName?: string
  lastName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProduceCategory {
  _id: string
  name: string
  description?: string
  displayOrder?: number
  createdAt: string
  updatedAt: string
}

export interface ProduceType {
  _id: string
  id?: string // API also returns string id
  categoryId: string
  category_id?: string // API also returns snake_case
  name: string
  unitType: 'pounds' | 'pints' | 'bunches'
  unit_type?: 'pounds' | 'pints' | 'bunches' // API also returns snake_case
  conversionFactor: number
  conversion_factor?: number // API also returns snake_case
  pricePerLb?: number
  price_per_lb?: number // API also returns snake_case
  servingWeightOz?: number
  serving_weight_oz?: number // API also returns snake_case
  servingsPerLb?: number
  servings_per_lb?: number // API also returns snake_case
  createdAt: string
  updatedAt: string
  // Populated fields
  category?: ProduceCategory
}

export interface FoodPantry {
  _id: string
  name: string
  contactInfo?: {
    phone?: string
    email?: string
    address?: string
  }
  commitmentAmounts?: {
    total: number
    vegetables: number
    fruits: number
    herbs: number
    flowers: number
  }
  createdAt: string
  updatedAt: string
}

export interface HarvestEntry {
  _id: string
  produceTypeId: string
  quantity: number
  unit: string
  harvestDate: string
  harvesterName?: string
  notes?: string
  createdAt: string
  updatedAt: string
  // Populated fields
  produceType?: ProduceType
}

export interface PantryDistribution {
  _id: string
  pantryId: string
  harvestEntryId: string
  quantityDistributed: number
  distributionDate: string
  createdAt: string
}

// For compatibility with existing code that expects Database type
export interface Database {
  public: {
    Tables: {
      produce_categories: {
        Row: ProduceCategory
        Insert: Omit<ProduceCategory, '_id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Omit<ProduceCategory, '_id' | 'createdAt' | 'updatedAt'>>
      }
      produce_types: {
        Row: ProduceType
        Insert: Omit<ProduceType, '_id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Omit<ProduceType, '_id' | 'createdAt' | 'updatedAt'>>
      }
      food_pantries: {
        Row: FoodPantry
        Insert: Omit<FoodPantry, '_id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Omit<FoodPantry, '_id' | 'createdAt' | 'updatedAt'>>
      }
      harvest_entries: {
        Row: HarvestEntry
        Insert: Omit<HarvestEntry, '_id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Omit<HarvestEntry, '_id' | 'createdAt' | 'updatedAt'>>
      }
      pantry_distributions: {
        Row: PantryDistribution
        Insert: Omit<PantryDistribution, '_id' | 'createdAt'>
        Update: Partial<Omit<PantryDistribution, '_id' | 'createdAt'>>
      }
    }
  }
}