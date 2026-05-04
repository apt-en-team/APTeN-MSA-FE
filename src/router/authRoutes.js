import AuthLayout from '@/layouts/AuthLayout.vue'
import Forbidden from '@/views/common/Forbidden.vue'
import LandingPage from '@/views/common/LandingPage.vue'
import ResidentLogin from '@/views/auth/login/ResidentLogin.vue'
import AdminLogin from '@/views/auth/login/AdminLogin.vue'

const authRoutes = [
  // 랜딩 페이지
  {
    path: '/',
    component: LandingPage,
    meta: { requiresAuth: false },
  },

  // 입주민 로그인 (기존 경로 유지)
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        component: ResidentLogin,
        meta: {
          requiresAuth: false,
          roles: ['GUEST', 'USER', 'ADMIN', 'MASTER'],
        },
      },
    ],
  },

  // 관리자 로그인
  {
    path: '/admin/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        component: AdminLogin,
        meta: {
          requiresAuth: false,
          roles: ['GUEST', 'ADMIN', 'MASTER'],
        },
      },
    ],
  },

  // 접근 금지
  {
    path: '/forbidden',
    component: AuthLayout,
    children: [
      {
        path: '',
        component: Forbidden,
        meta: {
          requiresAuth: false,
          roles: ['GUEST', 'USER', 'ADMIN', 'MASTER'],
        },
      },
    ],
  },
]

export default authRoutes
