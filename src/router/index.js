import {createRouter, createWebHistory} from 'vue-router'
import {useAuthStore} from '@/stores/useAuthStore'
import {useComplexStore} from '@/stores/useComplexStore'
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
  // 비로그인(null) 상태는 GUEST로 처리
  const role = userRole || 'GUEST'
  return allowedRoles.includes(role)
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

router.beforeEach((to, from) => {
  const authStore = useAuthStore()
  const complexStore = useComplexStore()
  authStore.initializeAuth()

  // 이미 로그인 상태에서 랜딩/로그인 페이지 접근 시 역할별 대시보드로 이동
  // 입주민이 PWA 아이콘 눌렀을 때 로그인 화면 대신 바로 대시보드로 가게 함
  if (authStore.isAuthenticated) {
    const guestOnlyPaths = ['/', '/login', '/admin/login']
    if (guestOnlyPaths.includes(to.path)) {
      if (authStore.role === 'USER') return '/resident/home'
      if (authStore.role === 'MANAGER' || authStore.role === 'ADMIN') return '/admin/dashboard'
      if (authStore.role === 'MASTER') return '/admin/master'
    }
  }

  // 로그인이 필요한 페이지인데 비로그인 상태면 로그인 페이지로 이동
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }

  // 권한이 없으면 역할별 기본 화면으로 이동한다.
  if (!canAccess(authStore.role, to.meta.roles)) {
    if (authStore.role === 'USER') return `/resident/${authStore.complexId}/home`
    if (authStore.role === 'MASTER') return '/admin/master'
    if (authStore.role === 'MANAGER' || authStore.role === 'ADMIN') return '/admin/dashboard'
    return '/'
  }
  // USER가 자기 단지가 아닌 다른 complexId로 접근 시 차단
  if (authStore.role === 'USER' && to.params.complexId) {
    if (String(to.params.complexId) !== String(authStore.complexId)) {
      return `/resident/${authStore.complexId}/home`
    }
  }

  // MASTER가 공통 관리자 화면에 들어갈 때는 선택 단지 정보가 세션에 있어야 한다.
  if (authStore.role === 'MASTER') {
    complexStore.restoreSelectedComplex()

    const isSharedAdminRoute = to.path.startsWith('/admin/') && !to.path.startsWith('/admin/master')

    if (isSharedAdminRoute && !complexStore.selectedComplex?.complexId) {
      return '/admin/master'
    }
  }

  // 입주민 승인 대기 상태면 대기 페이지로 이동
  if (authStore.role === 'USER' && authStore.status === 'PENDING' && to.path !== `/resident/${authStore.complexId}/pending`) {
    return `/resident/${authStore.complexId}/pending`
  }

  // 명시적으로 true 반환 — 통과
  return true
})

export default router
