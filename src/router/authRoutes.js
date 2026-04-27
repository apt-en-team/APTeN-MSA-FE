import AuthLayout from '@/layouts/AuthLayout.vue'
import Forbidden from '@/views/auth/Forbidden.vue'
import ResidentLogin from '@/views/auth/login/ResidentLogin.vue'

const authRoutes = [
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
