<template>
  <div class="min-h-screen bg-gray-900 flex flex-col justify-center py-12 px-4">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <img src="/gfa-mark.png" alt="Garden For All" class="h-20 w-auto" />
      </div>

      <div class="mt-8 bg-white py-10 px-6 shadow-xl rounded-lg text-center">
        <!-- Authorizing -->
        <div v-if="status === 'authorizing'" class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-garden-green-600"></div>
          <p class="mt-4 text-lg font-medium text-gray-900">Logging in the other device...</p>
        </div>

        <!-- Success -->
        <div v-else-if="status === 'success'" class="flex flex-col items-center">
          <div class="w-16 h-16 bg-garden-green-100 rounded-full flex items-center justify-center">
            <svg class="w-9 h-9 text-garden-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="mt-4 text-lg font-medium text-gray-900">Device logged in!</p>
          <p class="mt-2 text-sm text-gray-500">
            The other device is now signed in as {{ userDisplayName }}. You can close this page.
          </p>
          <router-link to="/" class="mt-6 text-sm font-medium text-garden-green-600 hover:text-garden-green-500">
            Back to dashboard
          </router-link>
        </div>

        <!-- Error -->
        <div v-else class="flex flex-col items-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-9 h-9 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p class="mt-4 text-lg font-medium text-gray-900">Couldn't log in the other device</p>
          <p class="mt-2 text-sm text-red-600">{{ errorMessage }}</p>
          <router-link to="/" class="mt-6 text-sm font-medium text-garden-green-600 hover:text-garden-green-500">
            Back to dashboard
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { user } = useAuth()

const status = ref<'authorizing' | 'success' | 'error'>('authorizing')
const errorMessage = ref('')

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const userDisplayName = computed(() => user.value?.email || 'your account')

onMounted(async () => {
  try {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE}/qr-login-authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sessionId: route.params.sessionId })
    })
    const result = await response.json().catch(() => null)

    if (!result?.success) {
      throw new Error(result?.error || 'Authorization failed')
    }

    status.value = 'success'
  } catch (err) {
    status.value = 'error'
    errorMessage.value = err instanceof Error ? err.message : 'Authorization failed'
  }
})
</script>
