import { onMounted, onUnmounted } from 'vue'
import { pusher, gardenChannel, adminChannel, dashboardChannel } from '@/lib/pusher'

export const usePusher = () => {
  const subscribeToHarvestUpdates = (callback: (data: any) => void) => {
    gardenChannel.bind('harvest-created', callback)
    gardenChannel.bind('harvest-updated', callback)
    gardenChannel.bind('harvest-deleted', callback)
  }

  const subscribeToAdminUpdates = (callback: (data: any) => void) => {
    adminChannel.bind('order-created', callback)
    adminChannel.bind('order-updated', callback)
    adminChannel.bind('order-deleted', callback)
    adminChannel.bind('pantry-created', callback)
    adminChannel.bind('pantry-updated', callback)
    adminChannel.bind('pantry-deleted', callback)
    adminChannel.bind('commitment-created', callback)
    adminChannel.bind('commitment-updated', callback)
    adminChannel.bind('commitment-deleted', callback)
  }

  const subscribeToDashboardUpdates = (callback: (data: any) => void) => {
    dashboardChannel.bind('dashboard-update', callback)
  }

  const unsubscribeFromHarvestUpdates = (callback: (data: any) => void) => {
    gardenChannel.unbind('harvest-created', callback)
    gardenChannel.unbind('harvest-updated', callback)
    gardenChannel.unbind('harvest-deleted', callback)
  }

  const unsubscribeFromAdminUpdates = (callback: (data: any) => void) => {
    adminChannel.unbind('order-created', callback)
    adminChannel.unbind('order-updated', callback)
    adminChannel.unbind('order-deleted', callback)
    adminChannel.unbind('pantry-created', callback)
    adminChannel.unbind('pantry-updated', callback)
    adminChannel.unbind('pantry-deleted', callback)
    adminChannel.unbind('commitment-created', callback)
    adminChannel.unbind('commitment-updated', callback)
    adminChannel.unbind('commitment-deleted', callback)
  }

  const unsubscribeFromDashboardUpdates = (callback: (data: any) => void) => {
    dashboardChannel.unbind('dashboard-update', callback)
  }

  const cleanup = () => {
    gardenChannel.unbind_all()
    adminChannel.unbind_all()
    dashboardChannel.unbind_all()
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    subscribeToHarvestUpdates,
    subscribeToAdminUpdates,
    subscribeToDashboardUpdates,
    unsubscribeFromHarvestUpdates,
    unsubscribeFromAdminUpdates,
    unsubscribeFromDashboardUpdates,
    cleanup,
  }
}