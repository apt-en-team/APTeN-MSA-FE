import {createRouter, createWebHistory} from 'vue-router'
import {useAuthStore} from '@/stores/useAuthStore'
import adminRoutes from './adminRoutes'
import authRoutes from './authRoutes'
import masterRoutes from './masterRoutes'
import residentRoutes from './residentRoutes'

// 역할 기반 접근 권한 확인
// allowedRoles가 비어있으면 누구나 접근 가능
// MASTER는 모든 페이지 접근 가능
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

  // localStorage에서 인증 정보 복원 (새로고침 시 상태 유지)
  authStore.initializeAuth()

  // 개발 중 화면 확인용 임시 처리 — 로그인 구현 후 제거
  if (import.meta.env.DEV && to.path.startsWith('/admin/master') && !authStore.isAuthenticated) {
    authStore.setDevMasterAuth()
  }

  // 이미 로그인 상태에서 랜딩/로그인 페이지 접근 시 역할별 대시보드로 이동
  // 입주민이 PWA 아이콘 눌렀을 때 로그인 화면 대신 바로 대시보드로 가게 함
  if (authStore.isAuthenticated) {
    const guestOnlyPaths = ['/', '/login', '/admin/login']
    if (guestOnlyPaths.includes(to.path)) {
      if (authStore.role === 'USER') return next('/resident/home')
      if (authStore.role === 'ADMIN') return next('/admin/dashboard')
      if (authStore.role === 'MASTER') return next('/admin/master/complexes')
    }
  }

  // 로그인이 필요한 페이지인데 비로그인 상태면 로그인 페이지로 이동
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // 역할 권한 없으면 forbidden 페이지로 이동
  if (!canAccess(authStore.role, to.meta.roles)) {
    return next('/forbidden')
  }

  // 입주민 승인 대기 상태면 대기 페이지로 이동
  if (authStore.role === 'USER' && authStore.status === 'PENDING' && to.path !== '/resident/pending') {
    return next('/resident/pending')
  }

  next()
})

export default router
