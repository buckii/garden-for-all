import { onMounted, onUnmounted } from 'vue'
import { pusher, gardenChannel, adminChannel } from '@/lib/pusher'

export const usePusher = () => {
  const subscribeToHarvestUpdates = (callback: (data: any) => void) => {
    gardenChannel.bind('new-harvest', callback)
    gardenChannel.bind('harvest-updated', callback)
  }

  const subscribeToAdminUpdates = (callback: (data: any) => void) => {
    adminChannel.bind('produce-updated', callback)
  }

  const unsubscribeFromHarvestUpdates = (callback: (data: any) => void) => {
    gardenChannel.unbind('new-harvest', callback)
    gardenChannel.unbind('harvest-updated', callback)
  }

  const unsubscribeFromAdminUpdates = (callback: (data: any) => void) => {
    adminChannel.unbind('produce-updated', callback)
  }

  const cleanup = () => {
    gardenChannel.unbind_all()
    adminChannel.unbind_all()
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    subscribeToHarvestUpdates,
    subscribeToAdminUpdates,
    unsubscribeFromHarvestUpdates,
    unsubscribeFromAdminUpdates,
    cleanup,
  }
}