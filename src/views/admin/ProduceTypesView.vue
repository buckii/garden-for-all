<template>
  <AdminLayout>
    <!-- Loading state -->
    <div v-if="adminStore.loading" 
         class="flex justify-center items-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-garden-green-600 mx-auto mb-4"></div>
        <p class="text-gray-500">Loading produce types...</p>
      </div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="adminStore.error" 
         class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium">Error loading produce types</h3>
          <p class="text-sm">{{ adminStore.error }}</p>
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <ProduceTypes v-else />
  </AdminLayout>
</template>

<script setup lang="ts">
import { useAdminStore } from '@/stores/admin'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import ProduceTypes from '@/components/admin/ProduceTypes.vue'

const adminStore = useAdminStore()
</script>