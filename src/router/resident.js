// TODO: 입주민 영역 라우트 구조를 정의합니다.
import ResidentLayout from '@/layouts/ResidentLayout.vue'
import ResidentHomeView from '@/views/resident/ResidentHomeView.vue'
import ResidentMyPageView from '@/views/resident/ResidentMyPageView.vue'
import ResidentNotificationView from '@/views/resident/ResidentNotificationView.vue'
import ResidentReservationView from '@/views/resident/ResidentReservationView.vue'
import ResidentVehicleView from '@/views/resident/ResidentVehicleView.vue'

const residentRoutes = [
  {
    path: '/resident',
    component: ResidentLayout,
    meta: {
      requiresAuth: true,
      role: 'RESIDENT',
    },
    children: [
      {
        path: '',
        redirect: '/resident/home',
      },
      {
        path: 'home',
        name: 'resident-home',
        component: ResidentHomeView,
        meta: {
          requiresAuth: true,
          role: 'RESIDENT',
        },
      },
      {
        path: 'reservations',
        name: 'resident-reservations',
        component: ResidentReservationView,
        meta: {
          requiresAuth: true,
          role: 'RESIDENT',
        },
      },
      {
        path: 'vehicles',
        name: 'resident-vehicles',
        component: ResidentVehicleView,
        meta: {
          requiresAuth: true,
          role: 'RESIDENT',
        },
      },
      {
        path: 'notifications',
        name: 'resident-notifications',
        component: ResidentNotificationView,
        meta: {
          requiresAuth: true,
          role: 'RESIDENT',
        },
      },
      {
        path: 'mypage',
        name: 'resident-mypage',
        component: ResidentMyPageView,
        meta: {
          requiresAuth: true,
          role: 'RESIDENT',
        },
      },
    ],
  },
]

export default residentRoutes
