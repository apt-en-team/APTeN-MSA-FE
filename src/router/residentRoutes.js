import ResidentLayout from '@/layouts/ResidentLayout.vue'
import ResidentPending from '@/views/resident/home/ResidentPending.vue'
import ResidentHome from '@/views/resident/home/ResidentHome.vue'
import ResidentMyPage from '@/views/resident/mypage/ResidentMyPage.vue'
import ChangePassword from '@/views/resident/mypage/ChangePassword.vue'
import NotificationList from '@/views/resident/notification/NotificationList.vue'
import MyReservationList from '@/views/resident/reservation/MyReservationList.vue'
import MyVehicleList from '@/views/resident/vehicle/MyVehicleList.vue'

const residentRoutes = [
  {
    path: '/resident',
    component: ResidentLayout,
    meta: {
      requiresAuth: true,
      roles: ['USER'],
    },
    children: [
      {
        path: '',
        redirect: '/resident/home',
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
        path: 'notification/setting',
        component: () => import('@/views/resident/notification/NotificationSetting.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },

      // 관리비
      {
        path: 'bill',
        component: () => import('@/views/resident/bill/MyBillList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'bill/:id',
        component: () => import('@/views/resident/bill/MyBillDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },

      // 공지사항
      {
        path: 'notice',
        component: () => import('@/views/resident/notice/ResidentNoticeList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'notice/:id',
        component: () => import('@/views/resident/notice/ResidentNoticeDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },

      // 게시판
      {
        path: 'board',
        component: () => import('@/views/resident/board/ResidentBoardList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'board/create',
        component: () => import('@/views/resident/board/ResidentBoardCreate.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'board/:id',
        component: () => import('@/views/resident/board/ResidentBoardDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'board/:id/edit',
        component: () => import('@/views/resident/board/ResidentBoardEdit.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'board/popular',
        component: () => import('@/views/resident/board/PopularBoardList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'my-posts',
        component: () => import('@/views/resident/board/MyBoardList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'my-comments',
        component: () => import('@/views/resident/board/MyCommentList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },

      // 투표
      {
        path: 'vote',
        component: () => import('@/views/resident/board/ResidentVoteList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'vote/:id',
        component: () => import('@/views/resident/board/ResidentVoteDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'vote/history',
        component: () => import('@/views/resident/board/MyVoteHistory.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },

      // 시설
      {
        path: 'facility',
        component: () => import('@/views/resident/facility/ResidentFacilityList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'facility/:id',
        component: () => import('@/views/resident/facility/ResidentFacilityDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },

      // 예약
      {
        path: 'reservations',
        component: MyReservationList,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'reservations/:id',
        component: () => import('@/views/resident/reservation/MyReservationDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'reservations/create',
        component: () => import('@/views/resident/reservation/ReservationCreate.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'reservations/golf',
        component: () => import('@/views/resident/reservation/GolfReservation.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'reservations/study-room',
        component: () => import('@/views/resident/reservation/StudyRoomReservation.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'reservations/gx',
        component: () => import('@/views/resident/reservation/ResidentGxProgramList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'reservations/gx/:id',
        component: () => import('@/views/resident/reservation/ResidentGxProgramDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },

      // 차량
      {
        path: 'vehicles',
        component: MyVehicleList,
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'vehicles/create',
        component: () => import('@/views/resident/vehicle/MyVehicleCreate.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'vehicles/:id',
        component: () => import('@/views/resident/vehicle/MyVehicleDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'vehicles/:id/edit',
        component: () => import('@/views/resident/vehicle/MyVehicleEdit.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },

      // 방문차량
      {
        path: 'visitor-vehicle',
        component: () => import('@/views/resident/vehicle/VisitorVehicleList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'visitor-vehicle/create',
        component: () => import('@/views/resident/vehicle/VisitorVehicleCreate.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'visitor-vehicle/:id/edit',
        component: () => import('@/views/resident/vehicle/VisitorVehicleEdit.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },

      // 고정 방문차량
      {
        path: 'visitor-vehicle/fixed',
        component: () => import('@/views/resident/regularVisitorVehicle/RegularVisitorVehicleList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'visitor-vehicle/fixed/create',
        component: () => import('@/views/resident/regularVisitorVehicle/RegularVisitorVehicleCreate.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'visitor-vehicle/fixed/:id/edit',
        component: () => import('@/views/resident/regularVisitorVehicle/RegularVisitorVehicleEdit.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },

      // 세대
      {
        path: 'household',
        component: () => import('@/views/resident/household/MyHousehold.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'household/bill',
        component: () => import('@/views/resident/household/MyBillList.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
      {
        path: 'household/bill/:id',
        component: () => import('@/views/resident/household/MyBillDetail.vue'),
        meta: { requiresAuth: true, roles: ['USER'] },
      },
    ],
  },
]

export default residentRoutes
