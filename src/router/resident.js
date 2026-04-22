// TODO: 입주민 영역 라우트 구조를 정의합니다.
import ResidentLayout from '@/layouts/ResidentLayout.vue'
import ResidentHome from '@/views/resident/home/ResidentHome.vue'
import ResidentMyPage from '@/views/resident/mypage/ResidentMyPage.vue'
import NotificationList from '@/views/resident/notification/NotificationList.vue'
import MyReservationList from '@/views/resident/reservation/MyReservationList.vue'
import MyVehicleList from '@/views/resident/vehicle/MyVehicleList.vue'

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
        component: ResidentHome,
        meta: {
          requiresAuth: true,
          role: 'RESIDENT',
        },
      },
      {
        path: 'reservations',
        name: 'resident-reservations',
        component: MyReservationList,
        meta: {
          requiresAuth: true,
          role: 'RESIDENT',
        },
      },
      {
        path: 'vehicles',
        name: 'resident-vehicles',
        component: MyVehicleList,
        meta: {
          requiresAuth: true,
          role: 'RESIDENT',
        },
      },
      {
        path: 'notifications',
        name: 'resident-notifications',
        component: NotificationList,
        meta: {
          requiresAuth: true,
          role: 'RESIDENT',
        },
      },
      {
        path: 'mypage',
        name: 'resident-mypage',
        component: ResidentMyPage,
        meta: {
          requiresAuth: true,
          role: 'RESIDENT',
        },
      },
    ],
  },
]

export default residentRoutes
