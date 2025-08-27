<template>
  <nav class="bg-gray-900 shadow-lg sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center">
            <img 
              src="https://content.app-sources.com/s/79642463807075583/uploads/logo_options/2025_Horizontal_Logo_Color_-9406719.png?format=webp" 
              alt="Garden For All"
              class="h-10 w-auto"
            />
          </router-link>
        </div>
        
        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-4">
          <router-link 
            to="/dashboard"
            class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Dashboard
          </router-link>
          <router-link 
            to="/harvest"
            class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            + Harvest
          </router-link>
          <router-link 
            to="/harvest-history"
            class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Today's Harvest
          </router-link>
          <router-link 
            to="/admin"
            class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Admin
          </router-link>
          
          <!-- User Info & Logout (only show if authenticated) -->
          <div v-if="isAuthenticated" class="flex items-center space-x-3 pl-4 border-l border-gray-600">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-garden-green-600 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div class="text-sm">
                <p class="text-gray-100 font-medium">{{ userDisplayName }}</p>
                <p class="text-gray-400 text-xs" v-if="isAdmin">Admin</p>
              </div>
            </div>
            <button
              @click="handleSignOut"
              class="text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
              title="Sign Out"
            >
              Logout
            </button>
          </div>
        </div>

        <!-- Mobile menu button -->
        <div class="md:hidden flex items-center">
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="text-gray-300 hover:text-white p-2 rounded-md"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="md:hidden">
        <div class="px-2 pt-2 pb-3 space-y-1 border-t border-gray-600">
          <router-link 
            to="/dashboard"
            @click="mobileMenuOpen = false"
            class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
          >
            Dashboard
          </router-link>
          <router-link 
            to="/harvest"
            @click="mobileMenuOpen = false"
            class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
          >
            + Harvest
          </router-link>
          <router-link 
            to="/harvest-history"
            @click="mobileMenuOpen = false"
            class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
          >
            Today's Harvest
          </router-link>
          <router-link 
            to="/admin"
            @click="mobileMenuOpen = false"
            class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
          >
            Admin
          </router-link>
          
          <div v-if="isAuthenticated" class="border-t border-gray-600 pt-3 mt-3">
            <div class="flex items-center px-3 py-2">
              <div class="w-8 h-8 bg-garden-green-600 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-gray-100 text-sm font-medium">{{ userDisplayName }}</p>
                <p class="text-gray-400 text-xs" v-if="isAdmin">Admin</p>
              </div>
            </div>
            <button
              @click="handleSignOut(); mobileMenuOpen = false"
              class="text-gray-300 hover:text-red-400 block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, isAuthenticated, isAdmin, signOut } = useAuth()

const mobileMenuOpen = ref(false)

// User display name
const userDisplayName = computed(() => {
  if (!user.value) return 'User'
  return user.value.email?.split('@')[0] || user.value.email || 'User'
})

const handleSignOut = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Sign out failed:', error)
  }
}
</script>