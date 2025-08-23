import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      produce_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          display_order?: number | null
          updated_at?: string
        }
      }
      produce_types: {
        Row: {
          id: string
          category_id: string
          name: string
          unit_type: string
          conversion_factor: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          unit_type: string
          conversion_factor: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          unit_type?: string
          conversion_factor?: number
          updated_at?: string
        }
      }
      food_pantries: {
        Row: {
          id: string
          name: string
          contact_info: any
          commitment_amounts: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_info?: any
          commitment_amounts?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_info?: any
          commitment_amounts?: any
          updated_at?: string
        }
      }
      harvest_entries: {
        Row: {
          id: string
          produce_type_id: string
          quantity: number
          unit: string
          harvest_date: string
          harvester_name: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          produce_type_id: string
          quantity: number
          unit: string
          harvest_date: string
          harvester_name?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          produce_type_id?: string
          quantity?: number
          unit?: string
          harvest_date?: string
          harvester_name?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      pantry_distributions: {
        Row: {
          id: string
          pantry_id: string
          harvest_entry_id: string
          quantity_distributed: number
          distribution_date: string
          created_at: string
        }
        Insert: {
          id?: string
          pantry_id: string
          harvest_entry_id: string
          quantity_distributed: number
          distribution_date: string
          created_at?: string
        }
        Update: {
          id?: string
          pantry_id?: string
          harvest_entry_id?: string
          quantity_distributed?: number
          distribution_date?: string
        }
      }
    }
  }
}