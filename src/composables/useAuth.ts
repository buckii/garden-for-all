import { ref, computed } from 'vue'
import { supabase } from '@/lib/netlify-auth'

interface User {
  _id: string
  email: string
  role: 'admin' | 'user'
  firstName?: string
  lastName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Session {
  access_token: string
  user: User
}

const user = ref<User | null>(null)
const session = ref<Session | null>(null)
const loading = ref(true)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Update local state with the returned user and session
    if (data) {
      user.value = data.user
      session.value = data.session
    }
    
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Clear local state
    user.value = null
    session.value = null
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password
    })
    if (error) throw error
  }

  const initialize = async () => {
    loading.value = true
    
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    session.value = currentSession
    user.value = currentSession?.user ?? null
    
    supabase.auth.onAuthStateChange((_event, currentSession) => {
      session.value = currentSession
      user.value = currentSession?.user ?? null
      loading.value = false
    })
    
    loading.value = false
  }

  return {
    user: computed(() => user.value),
    session: computed(() => session.value),
    isAuthenticated,
    isAdmin,
    loading: computed(() => loading.value),
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    initialize,
  }
}