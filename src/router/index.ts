import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useKiosk, KIOSK_ROUTE_NAMES } from '@/composables/useKiosk'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // Restore position on back/forward, otherwise start at the top
    return savedPosition || { top: 0 }
  },
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
      path: '/commitment-calendar',
      name: 'commitment-calendar',
      component: () => import('../views/CommitmentCalendarView.vue'),
    },
    {
      path: '/order',
      name: 'order',
      component: () => import('../views/OrderView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      redirect: '/admin/categories'
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: () => import('../views/admin/CategoriesView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/produce-types',
      name: 'admin-produce-types',
      component: () => import('../views/admin/ProduceTypesView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/harvest-locations',
      name: 'admin-harvest-locations',
      component: () => import('../views/admin/HarvestLocationsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/food-pantries',
      name: 'admin-food-pantries',
      component: () => import('../views/admin/FoodPantriesView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/harvest-entries',
      name: 'admin-harvest-entries',
      component: () => import('../views/admin/HarvestEntriesView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: () => import('../views/admin/OrdersView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/admin/UsersView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/export',
      name: 'admin-export',
      component: () => import('../views/admin/ExportView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/commitments',
      name: 'admin-commitments',
      component: () => import('../views/admin/CommitmentsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/qr-authorize/:sessionId',
      name: 'qr-authorize',
      component: () => import('../views/QrAuthorizeView.vue'),
      meta: { requiresAuth: true }
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
  
  // Always wait for auth initialization to complete
  if (loading.value) {
    try {
      await initialize()
    } catch (error) {
      console.error('Auth initialization failed:', error)
    }
  }
  
  // Wait a bit longer for localStorage to be fully available on page reload
  if (typeof window !== 'undefined' && !isAuthenticated.value) {
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  // Kiosk mode: lock navigation to the harvest pages only
  const { isKiosk } = useKiosk()
  if (isKiosk.value && !KIOSK_ROUTE_NAMES.includes(to.name as string)) {
    next({ name: 'harvest-history' })
    return
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
