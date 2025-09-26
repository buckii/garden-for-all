<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="px-4 py-6 sm:px-0">
        <div class="border-4 border-dashed border-gray-200 rounded-lg">
          <!-- Navigation -->
          <div class="bg-white">
            <div class="border-b border-gray-200">
              <!-- Desktop Navigation -->
              <div class="hidden sm:flex items-center justify-between px-6 py-4">
                <div class="flex space-x-8">
                  <!-- Configuration Group -->
                  <div class="relative" @mouseenter="showConfigDropdown = true" @mouseleave="showConfigDropdown = false">
                    <button :class="[
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isInGroup($route.name, 'config')
                        ? 'bg-garden-green-100 text-garden-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    ]">
                      <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      Configuration
                      <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    <div v-if="showConfigDropdown" class="absolute z-10 top-full w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div class="py-1">
                        <router-link to="/admin/categories" :class="['block px-4 py-2 text-sm', $route.name === 'admin-categories' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Categories
                        </router-link>
                        <router-link to="/admin/produce-types" :class="['block px-4 py-2 text-sm', $route.name === 'admin-produce-types' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Produce Types
                        </router-link>
                        <router-link to="/admin/harvest-locations" :class="['block px-4 py-2 text-sm', $route.name === 'admin-harvest-locations' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Harvest Locations
                        </router-link>
                      </div>
                    </div>
                  </div>

                  <!-- Data Management Group -->
                  <div class="relative" @mouseenter="showDataDropdown = true" @mouseleave="showDataDropdown = false">
                    <button :class="[
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isInGroup($route.name, 'data')
                        ? 'bg-garden-green-100 text-garden-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    ]">
                      <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      Data Management
                      <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    <div v-if="showDataDropdown" class="absolute z-10 top-full w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div class="py-1">
                        <router-link to="/admin/food-pantries" :class="['block px-4 py-2 text-sm', $route.name === 'admin-food-pantries' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Food Pantries
                        </router-link>
                        <router-link to="/admin/commitments" :class="['block px-4 py-2 text-sm', $route.name === 'admin-commitments' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Commitments
                        </router-link>
                        <router-link to="/admin/harvest-entries" :class="['block px-4 py-2 text-sm', $route.name === 'admin-harvest-entries' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Harvest Entries
                        </router-link>
                        <router-link to="/admin/orders" :class="['block px-4 py-2 text-sm', $route.name === 'admin-orders' ? 'bg-garden-green-50 text-garden-green-700' : 'text-gray-700 hover:bg-gray-100']">
                          Orders
                        </router-link>
                      </div>
                    </div>
                  </div>

                  <!-- User Management -->
                  <router-link
                    to="/admin/users"
                    :class="[
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      $route.name === 'admin-users'
                        ? 'bg-garden-green-100 text-garden-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    ]"
                  >
                    <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                    </svg>
                    Users
                  </router-link>

                  <!-- Export -->
                  <router-link
                    to="/admin/export"
                    :class="[
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      $route.name === 'admin-export'
                        ? 'bg-garden-green-100 text-garden-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    ]"
                  >
                    <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export Data
                  </router-link>
                </div>
              </div>
              
              <!-- Mobile Navigation -->
              <div class="sm:hidden px-4 py-2">
                <select
                  :value="$route.name"
                  @change="$router.push({ name: $event.target.value })"
                  class="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-garden-green-500 focus:outline-none focus:ring-garden-green-500"
                >
                  <optgroup label="Configuration">
                    <option value="admin-categories">Categories</option>
                    <option value="admin-produce-types">Produce Types</option>
                    <option value="admin-harvest-locations">Harvest Locations</option>
                  </optgroup>
                  <optgroup label="Data Management">
                    <option value="admin-food-pantries">Food Pantries</option>
                    <option value="admin-commitments">Commitments</option>
                    <option value="admin-harvest-entries">Harvest Entries</option>
                    <option value="admin-orders">Orders</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="admin-users">Users</option>
                    <option value="admin-export">Export Data</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import AppHeader from '@/components/layout/AppHeader.vue'

const adminStore = useAdminStore()
const showConfigDropdown = ref(false)
const showDataDropdown = ref(false)

onMounted(async () => {
  // Fetch all admin data in parallel
  await Promise.all([
    adminStore.fetchCategories(),
    adminStore.fetchProduceTypes(),
    adminStore.fetchFoodPantries()
  ])
})

const isInGroup = (routeName: string | null | undefined, groupName: string): boolean => {
  if (!routeName) return false
  
  const groups = {
    config: ['admin-categories', 'admin-produce-types', 'admin-harvest-locations'],
    data: ['admin-food-pantries', 'admin-commitments', 'admin-harvest-entries', 'admin-orders']
  }
  return groups[groupName]?.includes(routeName) || false
}
</script>