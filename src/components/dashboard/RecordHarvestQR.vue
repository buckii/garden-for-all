<template>
  <a :href="harvestUrl"
    class="inline-flex items-center gap-2 bg-white rounded-lg border shadow-sm px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
    title="Scan to record a harvest on your phone">
    <qrcode-vue :value="harvestUrl" :size="56" level="M" render-as="svg" />
    <span class="text-xs font-medium text-gray-600 leading-tight pr-1">Record<br>Harvest</span>
  </a>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'
import { computed } from 'vue'

// Absolute URL so a phone that scans the QR reaches the same host the dashboard
// is served from (works on production, deploy previews, and local network).
const harvestUrl = computed(() => {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/harvest`
})
</script>
