import { ref, computed } from 'vue'

const STORAGE_KEY = 'gfa-kiosk-mode'

// Routes that remain accessible while kiosk mode is active
export const KIOSK_ROUTE_NAMES = ['harvest', 'harvest-history']

const readStored = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

// Module-level state so kiosk mode is shared across the app
const kioskMode = ref<boolean>(readStored())

export const useKiosk = () => {
  const isKiosk = computed(() => kioskMode.value)

  const setKiosk = (value: boolean) => {
    kioskMode.value = value
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
      } catch {
        // Ignore storage failures (e.g. private browsing)
      }
    }
  }

  const toggleKiosk = () => setKiosk(!kioskMode.value)

  return { isKiosk, setKiosk, toggleKiosk }
}
