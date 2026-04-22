// TODO: 관리자 영역 라우트 구조를 정의합니다.
import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminNoticeList from '@/views/admin/board/AdminNoticeList.vue'
import AdminDashboard from '@/views/admin/dashboard/AdminDashboard.vue'
import AdminHouseholdList from '@/views/admin/household/AdminHouseholdList.vue'
import NotificationList from '@/views/admin/notification/NotificationList.vue'
import AdminReservationList from '@/views/admin/reservation/AdminReservationList.vue'
import AdminVehicleList from '@/views/admin/vehicle/AdminVehicleList.vue'

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
        component: AdminDashboard,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
      {
        path: 'households',
        name: 'admin-households',
        component: AdminHouseholdList,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
      {
        path: 'vehicles',
        name: 'admin-vehicles',
        component: AdminVehicleList,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
      {
        path: 'reservations',
        name: 'admin-reservations',
        component: AdminReservationList,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
      {
        path: 'boards',
        name: 'admin-boards',
        component: AdminNoticeList,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
      {
        path: 'notifications',
        name: 'admin-notifications',
        component: NotificationList,
        meta: {
          requiresAuth: true,
          role: 'ADMIN',
        },
      },
    ],
  },
]

export default adminRoutes
