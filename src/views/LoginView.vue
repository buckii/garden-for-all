<template>
  <div class="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <img src="/gfa-mark.png" alt="Garden For All" class="h-20 w-auto" />
      </div>
      <h2 class="mt-6 text-center text-3xl font-bold text-white">
        Garden For All
      </h2>
      <p class="mt-2 text-center text-sm text-gray-300">
        Sign in to access the admin panel
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md lg:max-w-4xl">
      <div class="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
        <div class="lg:flex lg:items-stretch lg:gap-10">
          <!-- Email / Password Login -->
          <div class="lg:flex-1">
            <form class="space-y-6" @submit.prevent="handleLogin">
              <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {{ error }}
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div class="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    required
                    v-model="email"
                    :disabled="loading"
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-garden-green-500 focus:border-garden-green-500 sm:text-sm disabled:bg-gray-100 text-gray-900"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div class="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autocomplete="current-password"
                    required
                    v-model="password"
                    :disabled="loading"
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-garden-green-500 focus:border-garden-green-500 sm:text-sm disabled:bg-gray-100 text-gray-900"
                    placeholder="Enter your password"
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
                  {{ loading ? 'Signing in...' : 'Sign in' }}
                </button>
              </div>
            </form>

            <div class="mt-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300" />
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white text-gray-500">
                    <router-link to="/forgot-password" class="font-medium text-garden-green-600 hover:text-garden-green-500">
                      Forgot your password?
                    </router-link>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- OR divider: horizontal on mobile, vertical on desktop -->
          <div class="my-8 flex items-center lg:hidden" aria-hidden="true">
            <div class="flex-1 border-t border-gray-300"></div>
            <span class="px-4 text-sm font-semibold tracking-[0.2em] text-gray-400">OR</span>
            <div class="flex-1 border-t border-gray-300"></div>
          </div>
          <div class="hidden lg:flex flex-col items-center self-stretch" aria-hidden="true">
            <div class="flex-1 border-l border-gray-300"></div>
            <span class="py-4 text-sm font-semibold tracking-[0.2em] text-gray-400">OR</span>
            <div class="flex-1 border-l border-gray-300"></div>
          </div>

          <!-- QR Code Login -->
          <div class="lg:flex-1 flex flex-col items-center justify-center text-center">
            <h3 class="text-lg font-semibold text-gray-900">Scan to login</h3>

            <div class="mt-4 flex items-center justify-center" style="min-height: 216px">
              <!-- Generating -->
              <div v-if="qrLogin.status.value === 'loading'" class="flex flex-col items-center text-gray-500">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-garden-green-600"></div>
                <p class="mt-3 text-sm">Generating code...</p>
              </div>

              <!-- Ready to scan -->
              <div v-else-if="qrLogin.status.value === 'ready'" class="rounded-lg border-2 border-gray-200 p-3">
                <QrcodeVue :value="qrLogin.qrUrl.value" :size="192" level="M" />
              </div>

              <!-- Authorized, exchanging for a token -->
              <div v-else-if="qrLogin.status.value === 'claiming'" class="flex flex-col items-center text-gray-600">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-garden-green-600"></div>
                <p class="mt-3 text-sm font-medium">Logging you in...</p>
              </div>

              <!-- Error -->
              <div v-else class="flex flex-col items-center">
                <p class="text-sm text-red-600">{{ qrLogin.errorMessage.value }}</p>
                <button
                  @click="qrLogin.start()"
                  class="mt-3 px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                >
                  Try again
                </button>
              </div>
            </div>

            <p class="mt-4 text-sm text-gray-500 max-w-xs">
              Scan this code with a phone where you're already logged in to sign in on this device automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import QrcodeVue from 'qrcode.vue'
import { useAuth } from '@/composables/useAuth'
import { useQrLogin } from '@/composables/useQrLogin'

const router = useRouter()
const route = useRoute()
const { signIn, signInWithSession } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const redirectAfterLogin = () => {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    router.push(redirect)
  } else {
    router.push({ name: 'admin' })
  }
}

const qrLogin = useQrLogin(({ token, session }) => {
  signInWithSession(token, session)
  redirectAfterLogin()
})

onMounted(() => {
  qrLogin.start()
})

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please enter both email and password'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await signIn(email.value, password.value)
    redirectAfterLogin()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
