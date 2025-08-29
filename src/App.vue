<template>
  <div class="app">
    <!-- Loading Screen -->
    <div v-if="authLoading" class="loading-screen">
      <div class="loading-content">
        <img src="/gfa-mark.png" alt="Garden For All" class="w-20 h-20 animate-spin mb-4 mx-auto">
        <h2 class="text-2xl font-bold text-garden-green-700 mb-2 font-poppins">Garden For All</h2>
        <p class="text-gray-600">Loading...</p>
      </div>
    </div>

    <!-- Main Application -->
    <RouterView v-else />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { loading: authLoading, initialize } = useAuth()

onMounted(async () => {
  await initialize()
})
</script>

<style>
/* Global Styles */
.app {
  min-height: 100vh;
}

.loading-screen {
  @apply min-h-screen bg-gradient-to-br from-garden-green-50 to-sky-blue-200 flex items-center justify-center;
}

.loading-content {
  @apply text-center;
}

/* Ensure full height for mobile */
#app {
  min-height: 100vh;
  min-height: -webkit-fill-available;
}

/* Touch optimization for mobile devices */
@media (hover: none) and (pointer: coarse) {
  * {
    -webkit-tap-highlight-color: transparent;
  }
  
  button, a, input, select, textarea {
    touch-action: manipulation;
  }
}

/* Large screen optimizations for TV displays */
@media (min-width: 1920px) {
  html {
    font-size: 18px;
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
