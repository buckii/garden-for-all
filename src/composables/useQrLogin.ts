import { ref, computed, onUnmounted } from 'vue'
import type { Channel } from 'pusher-js'
import { pusher } from '@/lib/pusher'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export type QrLoginStatus = 'loading' | 'ready' | 'claiming' | 'error'

/**
 * Drives the "scan to login" QR code on the login page.
 *
 * Lifecycle: create a single-use session server-side, subscribe to that
 * session's own Pusher channel (qr-login-<sessionId>), and when the phone
 * authorizes it, exchange the session ID for a JWT via qr-login-claim.
 * The QR code regenerates itself when the session expires.
 */
export const useQrLogin = (onLogin: (data: { token: string; session: any }) => void) => {
  const status = ref<QrLoginStatus>('loading')
  const errorMessage = ref('')
  const sessionId = ref<string | null>(null)

  const qrUrl = computed(() =>
    sessionId.value ? `${window.location.origin}/qr-authorize/${sessionId.value}` : ''
  )

  let channel: Channel | null = null
  let expiryTimer: ReturnType<typeof setTimeout> | undefined
  let stopped = false

  const teardownSession = () => {
    clearTimeout(expiryTimer)
    if (channel) {
      channel.unbind_all()
      pusher.unsubscribe(channel.name)
      channel = null
    }
  }

  const claim = async () => {
    if (!sessionId.value || status.value === 'claiming') return
    status.value = 'claiming'

    try {
      const response = await fetch(`${API_BASE}/qr-login-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.value })
      })
      const result = await response.json().catch(() => null)
      if (!result?.success) throw new Error(result?.error || 'QR login failed')

      teardownSession()
      onLogin({ token: result.data.token, session: result.data.session })
    } catch (err) {
      status.value = 'error'
      errorMessage.value = err instanceof Error ? err.message : 'QR login failed'
    }
  }

  const start = async () => {
    stopped = false
    teardownSession()
    status.value = 'loading'
    errorMessage.value = ''

    try {
      const response = await fetch(`${API_BASE}/qr-login-create`, { method: 'POST' })
      const result = await response.json().catch(() => null)
      if (!result?.success) throw new Error(result?.error || 'Could not create QR login session')

      sessionId.value = result.data.sessionId

      // Channel is unique to this QR code, so the event only reaches this device
      channel = pusher.subscribe(`qr-login-${result.data.sessionId}`)
      channel.bind('qr-login-authorized', claim)

      // Regenerate a fresh QR code when this session expires
      expiryTimer = setTimeout(() => {
        if (!stopped && status.value === 'ready') start()
      }, result.data.expiresIn * 1000)

      status.value = 'ready'
    } catch (err) {
      status.value = 'error'
      errorMessage.value = err instanceof Error ? err.message : 'Could not create QR login session'
    }
  }

  const stop = () => {
    stopped = true
    teardownSession()
  }

  onUnmounted(stop)

  return {
    status,
    errorMessage,
    qrUrl,
    start,
    stop,
  }
}
