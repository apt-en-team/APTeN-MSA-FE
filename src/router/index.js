import { createRouter, createWebHistory } from 'vue-router'
import adminRoutes from './admin'
import residentRoutes from './resident'
import AuthLayout from '@/layouts/AuthLayout.vue'
import ResidentLogin from '@/views/auth/login/ResidentLogin.vue'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'login',
        component: ResidentLogin,
      },
    ],
  },
  ...adminRoutes,
  ...residentRoutes,
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  // TODO: 인증 및 권한 기반 라우트 가드를 구현합니다.
  next()
})

export default router
