// TODO: 관리자 영역 라우트 구조를 정의합니다.
import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminBoardView from '@/views/admin/AdminBoardView.vue'
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import AdminHouseholdView from '@/views/admin/AdminHouseholdView.vue'
import AdminNotificationView from '@/views/admin/AdminNotificationView.vue'
import AdminReservationView from '@/views/admin/AdminReservationView.vue'
import AdminVehicleView from '@/views/admin/AdminVehicleView.vue'

const adminRoutes = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
      role: 'ADMIN',
    },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
      {
        path: 'households',
        name: 'admin-households',
        component: AdminHouseholdView,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
      {
        path: 'vehicles',
        name: 'admin-vehicles',
        component: AdminVehicleView,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
      {
        path: 'reservations',
        name: 'admin-reservations',
        component: AdminReservationView,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
      {
        path: 'boards',
        name: 'admin-boards',
        component: AdminBoardView,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
      {
        path: 'notifications',
        name: 'admin-notifications',
        component: AdminNotificationView,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
    ],
  },
]

export default adminRoutes
