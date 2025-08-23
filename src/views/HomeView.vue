<template>
  <div class="min-h-screen bg-gradient-to-br from-garden-green-50 to-sky-blue-200">
    <!-- Navigation Header -->
    <nav class="bg-white/80 backdrop-blur-sm shadow-sm border-b border-garden-green-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-gradient-to-br from-garden-green-600 to-garden-green-700 rounded-full flex items-center justify-center shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
                </svg>
              </div>
              <h1 class="ml-3 text-2xl font-bold text-garden-green-700">Garden For All</h1>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- Show when not authenticated -->
            <router-link 
              v-if="!isAuthenticated"
              to="/login"
              class="text-garden-green-600 hover:text-garden-green-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Admin Login
            </router-link>
            
            <!-- Show when authenticated -->
            <div v-if="isAuthenticated" class="flex items-center space-x-4">
              <router-link 
                to="/dashboard"
                class="text-garden-green-600 hover:text-garden-green-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </router-link>
              <router-link 
                v-if="isAdmin"
                to="/admin"
                class="text-garden-green-600 hover:text-garden-green-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin
              </router-link>
              
              <!-- User Info & Logout -->
              <div class="flex items-center space-x-3 pl-4 border-l border-garden-green-300">
                <div class="flex items-center space-x-2">
                  <div class="w-8 h-8 bg-garden-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-garden-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div class="text-sm">
                    <p class="text-gray-700 font-medium">{{ userDisplayName }}</p>
                    <p class="text-gray-500 text-xs" v-if="isAdmin">Admin</p>
                  </div>
                </div>
                <button
                  @click="handleSignOut"
                  class="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                  title="Sign Out"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span class="block">Growing Community</span>
            <span class="block text-garden-green-600">Feeding Neighbors</span>
          </h1>
          <p class="mt-6 max-w-lg mx-auto text-xl text-gray-500 sm:max-w-3xl">
            Garden For All tracks produce from our community garden and ensures fresh, healthy food reaches local food pantries throughout New Albany, Ohio.
          </p>
          <div class="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
            <div class="space-y-4 sm:space-y-0 sm:space-x-4 sm:inline-flex">
              <router-link
                to="/harvest"
                class="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-garden-green-600 hover:bg-garden-green-700 md:py-4 md:text-lg md:px-10 shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                🌱 Record Harvest
              </router-link>
              <router-link
                to="/dashboard"
                class="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-garden-green-700 bg-garden-green-100 hover:bg-garden-green-200 md:py-4 md:text-lg md:px-10 shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                📊 View Dashboard
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Decorative Background -->
      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div class="w-96 h-96 bg-garden-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      </div>
      <div class="absolute top-0 right-1/4 transform translate-x-1/2 -translate-y-1/2 animation-delay-2000">
        <div class="w-96 h-96 bg-flower-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      </div>
      <div class="absolute -bottom-8 left-1/4 transform -translate-x-1/2 animation-delay-4000">
        <div class="w-96 h-96 bg-flower-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="py-16 bg-white/60 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-base text-garden-green-600 font-semibold tracking-wide uppercase">Our Impact</h2>
          <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Making a Difference in Our Community
          </p>
        </div>

        <div class="mt-16">
          <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Feature 1 -->
            <div class="pt-6">
              <div class="flow-root bg-white rounded-lg px-6 pb-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div class="-mt-6">
                  <div>
                    <span class="inline-flex items-center justify-center p-3 bg-garden-green-500 rounded-md shadow-lg">
                      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
                      </svg>
                    </span>
                  </div>
                  <h3 class="mt-8 text-lg font-medium text-gray-900 tracking-tight">Easy Harvest Tracking</h3>
                  <p class="mt-5 text-base text-gray-500">
                    Simple, touch-friendly interface designed for volunteers to quickly record harvest data while working in the garden.
                  </p>
                </div>
              </div>
            </div>

            <!-- Feature 2 -->
            <div class="pt-6">
              <div class="flow-root bg-white rounded-lg px-6 pb-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div class="-mt-6">
                  <div>
                    <span class="inline-flex items-center justify-center p-3 bg-garden-green-500 rounded-md shadow-lg">
                      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </span>
                  </div>
                  <h3 class="mt-8 text-lg font-medium text-gray-900 tracking-tight">Real-time Dashboard</h3>
                  <p class="mt-5 text-base text-gray-500">
                    Live production statistics and commitment tracking displayed on large screens for easy viewing by staff and volunteers.
                  </p>
                </div>
              </div>
            </div>

            <!-- Feature 3 -->
            <div class="pt-6">
              <div class="flow-root bg-white rounded-lg px-6 pb-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div class="-mt-6">
                  <div>
                    <span class="inline-flex items-center justify-center p-3 bg-garden-green-500 rounded-md shadow-lg">
                      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                    </span>
                  </div>
                  <h3 class="mt-8 text-lg font-medium text-gray-900 tracking-tight">Pantry Management</h3>
                  <p class="mt-5 text-base text-gray-500">
                    Track commitments and deliveries to local food pantries, ensuring fresh produce reaches those who need it most.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="bg-garden-green-600">
      <div class="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-extrabold text-white sm:text-4xl">
          <span class="block">Ready to help?</span>
        </h2>
        <p class="mt-4 text-lg leading-6 text-garden-green-200">
          Join our community garden volunteers and make a difference in New Albany. Every harvest counts!
        </p>
        <router-link
          to="/harvest"
          class="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-garden-green-600 bg-white hover:bg-garden-green-50 sm:w-auto shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          Start Recording Harvests
        </router-link>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white">
      <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div class="flex justify-center items-center">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-garden-green-600 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
              </svg>
            </div>
            <p class="ml-3 text-base text-gray-500">
              Garden For All - New Albany, Ohio Community Garden Management System
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, isAuthenticated, isAdmin, signOut } = useAuth()

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

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
