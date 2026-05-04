import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import adminRoutes from './adminRoutes'
import authRoutes from './authRoutes'
import masterRoutes from './masterRoutes'
import residentRoutes from './residentRoutes'

function canAccess(userRole, allowedRoles = []) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  if (userRole === 'MASTER') return true
  return allowedRoles.includes(userRole)
}

const routes = [
  ...authRoutes,
  ...masterRoutes,
  ...adminRoutes,
  ...residentRoutes,
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  authStore.initializeAuth()

  // 개발 중 화면 확인용 임시 처리이며 로그인 구현 후 제거합니다.
  if (import.meta.env.DEV && to.path.startsWith('/admin/master') && !authStore.isAuthenticated) {
    authStore.setDevMasterAuth()
  }

  // 로그인 필요 여부 확인
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // 권한 없으면 forbidden 페이지로 이동
  if (!canAccess(authStore.role, to.meta.roles)) {
    return next('/forbidden')
  }

  // USER가 승인 대기 상태면 대기 페이지로 이동
  if (authStore.role === 'USER' && authStore.status === 'PENDING' && to.path !== '/resident/pending') {
    return next('/resident/pending')
  }

  next()
})

export default router
