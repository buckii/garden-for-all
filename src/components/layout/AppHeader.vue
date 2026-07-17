<template>
  <nav class="bg-gray-900 shadow-lg sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <router-link :to="isKiosk ? '/harvest-history' : '/'" class="flex items-center">
            <img
              src="https://content.app-sources.com/s/79642463807075583/uploads/logo_options/2025_Horizontal_Logo_Color_-9406719.png?format=webp"
              alt="Garden For All" class="h-10 w-auto" />
          </router-link>
        </div>

        <!-- Kiosk Mode: simplified navigation locked to the harvest pages -->
        <template v-if="isKiosk">
          <div class="flex items-center gap-2 sm:gap-3">
            <router-link to="/harvest-history"
              class="text-gray-100 hover:text-white px-3 py-2 sm:px-4 rounded-md text-base font-semibold bg-gray-800 hover:bg-gray-700 transition-colors">
              Today's Harvest
            </router-link>
            <router-link to="/harvest"
              class="text-white px-3 py-2 sm:px-4 rounded-md text-base font-semibold bg-garden-green-600 hover:bg-garden-green-700 transition-colors">
              + Harvest
            </router-link>

            <!-- Kiosk exit lives behind the menu button -->
            <div class="relative">
              <button @click="mobileMenuOpen = !mobileMenuOpen"
                class="text-gray-300 hover:text-white p-2 rounded-md" aria-label="Menu">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div v-if="mobileMenuOpen"
                class="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg border border-gray-700 p-2 z-20">
                <button @click="toggleKioskAndClose" class="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-700">
                  <span class="text-gray-200 text-sm font-medium">Kiosk Mode</span>
                  <KioskToggle :on="isKiosk" />
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Standard navigation -->
        <template v-else>
          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-4">
            <router-link to="/dashboard"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Dashboard
            </router-link>
            <router-link to="/harvest-history"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Today
            </router-link>
            <router-link to="/commitment-calendar"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Calendar
            </router-link>
            <router-link to="/harvest"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              + Harvest
            </router-link>
            <router-link to="/order"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              + Order
            </router-link>
            <router-link to="/admin"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Admin
            </router-link>

            <button @click="toggleKioskAndClose"
              class="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              title="Lock the screen to the harvest pages">
              <span>Kiosk</span>
              <KioskToggle :on="isKiosk" />
            </button>

            <!-- User Info & Logout (only show if authenticated) -->
            <div v-if="isAuthenticated" class="flex items-center space-x-3 pl-4 border-l border-gray-600">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-garden-green-600 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div class="text-sm">
                  <p class="text-gray-100 font-medium">{{ userDisplayName }}</p>
                  <p class="text-gray-400 text-xs" v-if="isAdmin">Admin</p>
                </div>
              </div>
              <button @click="handleSignOut"
                class="text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                title="Sign Out">
                Logout
              </button>
            </div>
          </div>

          <!-- Mobile: always-visible Today's Harvest link + menu button -->
          <div class="md:hidden flex items-center gap-2">
            <router-link to="/harvest-history"
              class="text-gray-100 hover:text-white px-3 py-2 rounded-md text-sm font-semibold bg-gray-800 hover:bg-gray-700 transition-colors">
              Today's Harvest
            </router-link>
            <button @click="mobileMenuOpen = !mobileMenuOpen" class="text-gray-300 hover:text-white p-2 rounded-md" aria-label="Menu">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </template>
      </div>

      <!-- Mobile menu (standard mode only) -->
      <div v-if="mobileMenuOpen && !isKiosk" class="md:hidden">
        <div class="px-2 pt-2 pb-3 space-y-1 border-t border-gray-600">
          <router-link to="/dashboard" @click="mobileMenuOpen = false"
            class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">
            Dashboard
          </router-link>
          <router-link to="/harvest-history" @click="mobileMenuOpen = false"
            class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">
            Today
          </router-link>
          <router-link to="/commitment-calendar" @click="mobileMenuOpen = false"
            class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">
            Calendar
          </router-link>
          <router-link to="/harvest" @click="mobileMenuOpen = false"
            class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">
            + Harvest
          </router-link>
          <router-link to="/order" @click="mobileMenuOpen = false"
            class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">
            + Order
          </router-link>
          <router-link to="/admin" @click="mobileMenuOpen = false"
            class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">
            Admin
          </router-link>

          <button @click="toggleKioskAndClose"
            class="w-full flex items-center justify-between text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800 transition-colors">
            <span>Kiosk Mode</span>
            <KioskToggle :on="isKiosk" />
          </button>

          <div v-if="isAuthenticated" class="border-t border-gray-600 pt-3 mt-3">
            <div class="flex items-center px-3 py-2">
              <div class="w-8 h-8 bg-garden-green-600 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-gray-100 text-sm font-medium">{{ userDisplayName }}</p>
                <p class="text-gray-400 text-xs" v-if="isAdmin">Admin</p>
              </div>
            </div>
            <button @click="handleSignOut(); mobileMenuOpen = false"
              class="text-gray-300 hover:text-red-400 block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import { useKiosk } from '@/composables/useKiosk'
import { computed, ref, h, type FunctionalComponent } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { user, isAuthenticated, isAdmin, signOut } = useAuth()
const { isKiosk, toggleKiosk } = useKiosk()

const mobileMenuOpen = ref(false)

// Small pill toggle used to indicate kiosk on/off state
const KioskToggle: FunctionalComponent<{ on: boolean }> = (props) =>
  h('span', {
    class: [
      'inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors',
      props.on ? 'bg-garden-green-500' : 'bg-gray-600',
    ],
  }, [
    h('span', {
      class: [
        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
        props.on ? 'translate-x-4' : 'translate-x-0.5',
      ],
    }),
  ])

const toggleKioskAndClose = () => {
  toggleKiosk()
  mobileMenuOpen.value = false
  // Entering kiosk mode from a non-harvest page should land on Today's Harvest
  if (isKiosk.value) {
    router.push('/harvest-history')
  }
}

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
