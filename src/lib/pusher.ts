import Pusher from 'pusher-js'

const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY
const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER

if (!pusherKey || !pusherCluster) {
  throw new Error('Missing Pusher environment variables')
}

export const pusher = new Pusher(pusherKey, {
  cluster: pusherCluster,
  forceTLS: true,
})

export const gardenChannel = pusher.subscribe('garden-harvest')
export const adminChannel = pusher.subscribe('garden-admin')