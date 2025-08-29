<template>
  <div class="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <img src="/gfa-mark.png" alt="Garden For All" class="h-20 w-auto" />
      </div>
      <h2 class="mt-6 text-center text-3xl font-bold text-white">
        Set New Password
      </h2>
      <p class="mt-2 text-center text-sm text-gray-300">
        Enter your new password below
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
        <form v-if="!success" class="space-y-6" @submit.prevent="handleSubmit">
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ error }}
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div class="mt-1">
              <input 
                id="password" 
                name="password" 
                type="password" 
                autocomplete="new-password" 
                required
                v-model="password"
                :disabled="loading"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-garden-green-500 focus:border-garden-green-500 sm:text-sm disabled:bg-gray-100 text-gray-900"
                placeholder="Enter new password (min 6 characters)"
                minlength="6"
              />
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div class="mt-1">
              <input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                autocomplete="new-password" 
                required
                v-model="confirmPassword"
                :disabled="loading"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-garden-green-500 focus:border-garden-green-500 sm:text-sm disabled:bg-gray-100 text-gray-900"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              :disabled="loading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-garden-green-600 hover:bg-garden-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5" src="/gfa-mark.png" alt="Loading" />
              {{ loading ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>

        <div v-else class="text-center">
          <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  Password updated successfully!
                </h3>
                <div class="mt-2 text-sm text-green-700">
                  <p>Your password has been changed. You can now sign in with your new password.</p>
                </div>
              </div>
            </div>
          </div>
          
          <router-link
            to="/login"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-garden-green-600 hover:bg-garden-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-green-500"
          >
            Go to Sign In
          </router-link>
        </div>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">
                <router-link to="/login" class="font-medium text-garden-green-600 hover:text-garden-green-500">
                  Back to sign in
                </router-link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import netlifyAuth from '@/lib/netlify-auth'

const route = useRoute()
const router = useRouter()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const success = ref(false)

onMounted(() => {
  token.value = route.params.token as string
  if (!token.value) {
    router.push('/login')
  }
})

const handleSubmit = async () => {
  if (!password.value || password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { error: resetError } = await netlifyAuth.confirmPasswordReset(token.value, password.value)
    
    if (resetError) {
      throw new Error(resetError.message)
    }
    
    success.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to reset password'
  } finally {
    loading.value = false
  }
}
</script>