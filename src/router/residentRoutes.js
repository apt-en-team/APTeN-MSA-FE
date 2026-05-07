import ResidentLayout from '@/layouts/ResidentLayout.vue'
import ResidentPending from '@/views/resident/home/ResidentPending.vue'
import ResidentHome from '@/views/resident/home/ResidentHome.vue'
import ResidentMyPage from '@/views/resident/mypage/ResidentMyPage.vue'
import ChangePassword from '@/views/resident/mypage/ChangePassword.vue'
import NotificationList from '@/views/resident/notification/NotificationList.vue'

const residentRoutes = [
  {
    path: '/resident/:complexId',
    component: ResidentLayout,
    meta: {
      requiresAuth: true,
      roles: ['USER'],
    },
    children: [
      {
        path: '',
        redirect: to => `/resident/${to.params.complexId}/home`,
      },
      {
        path: 'home',
        component: ResidentHome,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'pending',
        component: ResidentPending,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'mypage',
        component: ResidentMyPage,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'mypage/password',
        component: ChangePassword,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'notifications',
        component: NotificationList,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'mypage/edit',
        component: () => import('@/views/resident/mypage/ResidentMyPageEdit.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
    ],
  },
]

export default residentRoutes
