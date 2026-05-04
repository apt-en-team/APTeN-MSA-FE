import AuthLayout from '@/layouts/AuthLayout.vue'
import Forbidden from '@/views/common/Forbidden.vue'
import LandingPage from '@/views/common/LandingPage.vue'
import ResidentLogin from '@/views/auth/login/ResidentLogin.vue'
import AdminLogin from '@/views/auth/login/AdminLogin.vue'
import Register from '@/views/auth/signup/Register.vue'
import SocialSignup from '@/views/auth/signup/SocialSignup.vue'
import ForgotPassword from '@/views/auth/password/ForgotPassword.vue'
import ResetPassword from '@/views/auth/password/ResetPassword.vue'

const authRoutes = [
  // 랜딩 페이지
  {
    path: '/',
    component: LandingPage,
    meta: { requiresAuth: false },
  },

  // 입주민 로그인
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        component: ResidentLogin,
        meta: { requiresAuth: false, roles: ['GUEST', 'USER', 'ADMIN', 'MASTER'] },
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
        meta: { requiresAuth: false, roles: ['GUEST', 'ADMIN', 'MASTER'] },
      },
    ],
  },

  // 회원가입
  {
    path: '/register',
    component: AuthLayout,
    children: [
      {
        path: '',
        component: Register,
        meta: { requiresAuth: false },
      },
    ],
  },

  // 소셜 추가정보 입력
  {
    path: '/social/signup',
    component: AuthLayout,
    children: [
      {
        path: '',
        component: SocialSignup,
        meta: { requiresAuth: false },
      },
    ],
  },

  // 비밀번호 찾기
  {
    path: '/forgot-password',
    component: AuthLayout,
    children: [
      {
        path: '',
        component: ForgotPassword,
        meta: { requiresAuth: false },
      },
    ],
  },

  // 비밀번호 재설정
  {
    path: '/reset-password',
    component: AuthLayout,
    children: [
      {
        path: '',
        component: ResetPassword,
        meta: { requiresAuth: false },
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
        meta: { requiresAuth: false, roles: ['GUEST', 'USER', 'ADMIN', 'MASTER'] },
      },
    ],
  },
]

export default authRoutes
