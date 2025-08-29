import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/dashboard',
      redirect: '/',
    },
    {
      path: '/harvest',
      name: 'harvest',
      component: () => import('../views/HarvestView.vue'),
    },
    {
      path: '/harvest-history',
      name: 'harvest-history',
      component: () => import('../views/HarvestHistoryView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
    },
    {
      path: '/reset-password/:token',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, isAdmin, initialize, loading } = useAuth()
  
  // Initialize auth if not already done
  if (loading.value) {
    await initialize()
  }
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // Check if route requires admin access
  if (to.meta.requiresAdmin && !isAdmin.value) {
    next({ name: 'home' })
    return
  }
  
  // Redirect authenticated users away from login
  if (to.name === 'login' && isAuthenticated.value) {
    next({ name: 'home' })
    return
  }
  
  next()
})

export default router
