import ResidentLayout from '@/layouts/ResidentLayout.vue'
import ResidentPending from '@/views/resident/home/ResidentPending.vue'
import ResidentFacilityHome from '@/views/resident/facility/ResidentFacilityHome.vue'
import ResidentReservationHome from '@/views/resident/facility/ResidentReservationHome.vue'
import ResidentHome from '@/views/resident/home/ResidentHome.vue'
import ResidentMyPage from '@/views/resident/mypage/ResidentMyPage.vue'
import ChangePassword from '@/views/resident/mypage/ChangePassword.vue'
import NotificationList from '@/views/resident/notification/NotificationList.vue'
import ResidentParkingStatusHome from '@/views/resident/parking/ResidentParkingStatusHome.vue'
import ResidentVoteHome from '@/views/resident/vote/ResidentVoteHome.vue'
import ResidentBoardList from '@/views/resident/board/ResidentBoardList.vue'
import ResidentBoardPost from '@/views/resident/board/ResidentBoardPost.vue'
import ResidentBoardDetail from '@/views/resident/board/ResidentBoardDetail.vue'

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
        path: 'board',
        component: ResidentBoardList,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'board/posts',
        component: ResidentBoardPost,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'board/:postId',
        component: ResidentBoardDetail,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'board/:postId/edit',
        component: ResidentBoardPost,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'board/my',
        component: () => import('@/views/resident/board/ResidentMyBoard.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'notice',
        component: () => import('@/views/resident/board/ResidentNoticeList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'notice/:noticeId',
        component: () => import('@/views/resident/board/ResidentNoticeDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'notifications',
        component: NotificationList,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'notifications/settings',
        component: () => import('@/views/resident/notification/NotificationSetting.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'facility',
        component: ResidentFacilityHome,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'facility/subscriptions',
        component: () => import('@/views/resident/facility/ResidentMySubscriptionView.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'facility/:facilityId',
        component: () => import('@/views/resident/facility/ResidentFacilityDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'facility/:facilityId/reserve',
        component: () => import('@/views/resident/facility/ResidentReservationCreate.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'facility/:facilityId/gx-programs',
        component: () => import('@/views/resident/facility/ResidentGxProgramList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'facility/gx-programs/:programId',
        component: () => import('@/views/resident/facility/ResidentGxProgramDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'reservations',
        component: ResidentReservationHome,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'reservations/:reservationId',
        component: () => import('@/views/resident/reservation/MyReservationDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'parking',
        component: ResidentParkingStatusHome,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'parking/zones/:zoneId/spots',
        component: () => import('@/views/resident/parking/ResidentParkingSpotMap.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'vehicles',
        component: () => import('@/views/resident/vehicle/MyVehicleList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'visitor-vehicle',
        component: () => import('@/views/resident/vehicle/VisitorVehicleList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'regular-visitor-vehicle',
        component: () => import('@/views/resident/vehicle/RegularVisitorVehicleList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'visitor-vehicle/register',
        component: () => import('@/views/resident/vehicle/VisitorVehicleForm.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'visitor-vehicle/:visitorVehicleId/edit',
        component: () => import('@/views/resident/vehicle/VisitorVehicleForm.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'regular-visitor-vehicle/register',
        component: () => import('@/views/resident/vehicle/RegularVisitorVehicleForm.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'regular-visitor-vehicle/:regularVisitorVehicleId/edit',
        component: () => import('@/views/resident/vehicle/RegularVisitorVehicleForm.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'vote',
        component: ResidentVoteHome,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'mypage/edit',
        component: () => import('@/views/resident/mypage/ResidentMyPageEdit.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'bill',
        component: () => import('@/views/resident/bill/ResidentBillHome.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'bill/detail',
        component: () => import('@/views/resident/bill/ResidentBillDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
    ],
  },
]

export default residentRoutes
