import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminAccountManage from '@/views/admin/account/AdminAccountManage.vue'
import AdminBillList from '@/views/admin/bill/AdminBillList.vue'
import AdminBoardStatistics from '@/views/admin/community/AdminBoardStatistics.vue'
import AdminNoticeList from '@/views/admin/community/AdminNoticeList.vue'
import AdminVoteList from '@/views/admin/community/AdminVoteList.vue'
import AdminDashboard from '@/views/admin/dashboard/AdminDashboard.vue'
import AdminFacilityList from '@/views/admin/facility/AdminFacilityList.vue'
import AdminGxProgramList from '@/views/admin/facility/AdminGxProgramList.vue'
import AdminReservationList from '@/views/admin/facility/AdminReservationList.vue'
import AdminHouseholdList from '@/views/admin/household/AdminHouseholdList.vue'
import AdminParkingDashboard from '@/views/admin/parking/AdminParkingDashboard.vue'
import AdminParkingLogList from '@/views/admin/parking/AdminParkingLogList.vue'
import AdminVehicleList from '@/views/admin/vehicle/AdminVehicleList.vue'
import AdminVisitorVehicleList from '@/views/admin/vehicle/AdminVisitorVehicleList.vue'

const adminRouteMeta = {
  requiresAuth: true,
  roles: ['MASTER', 'MANAGER', 'ADMIN'],
}

const adminRoutes = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: adminRouteMeta,
    children: [
      // 관리자 기본 진입은 대표 대시보드로 연결한다.
      { path: '', redirect: '/admin/dashboard' },

      // 대시보드
      { path: 'dashboard', component: AdminDashboard, meta: { ...adminRouteMeta, title: '대시보드' } },

      // 관리자 계정 관리
      { path: 'admins', component: AdminAccountManage, meta: { ...adminRouteMeta, title: '관리자 관리' } },

      // 세대 / 관리비 관리
      { path: 'households', component: AdminHouseholdList, meta: { ...adminRouteMeta, title: '세대 관리' } },
      { path: 'bills', component: AdminBillList, meta: { ...adminRouteMeta, title: '관리비 관리' } },

      // 차량 / 방문차량 관리
      { path: 'vehicles', component: AdminVehicleList, meta: { ...adminRouteMeta, title: '입주민 차량 목록' } },
      { path: 'visitor-vehicles', component: AdminVisitorVehicleList, meta: { ...adminRouteMeta, title: '방문차량 목록' } },

      // 주차 관리
      { path: 'parking-logs', component: AdminParkingLogList, meta: { ...adminRouteMeta, title: '입출차 기록' } },
      { path: 'parking/dashboard', component: AdminParkingDashboard, meta: { ...adminRouteMeta, title: '주차 현황' } },

      // 커뮤니티 관리
      { path: 'notices', component: AdminNoticeList, meta: { ...adminRouteMeta, title: '공지사항 관리' } },
      { path: 'votes', component: AdminVoteList, meta: { ...adminRouteMeta, title: '투표 관리' } },
      { path: 'boards/statistics', component: AdminBoardStatistics, meta: { ...adminRouteMeta, title: '게시판 통계' } },

      // 시설 / 예약 관리
      { path: 'facilities', component: AdminFacilityList, meta: { ...adminRouteMeta, title: '시설 관리' } },
      { path: 'reservations', component: AdminReservationList, meta: { ...adminRouteMeta, title: '예약 현황' } },
      { path: 'gx-programs', component: AdminGxProgramList, meta: { ...adminRouteMeta, title: 'GX 프로그램 관리' } },
    ],
  },
]

export default adminRoutes