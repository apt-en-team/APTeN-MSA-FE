import AdminLayout from '@/layouts/AdminLayout.vue'
import ResidentPreviewLayout from '@/layouts/ResidentPreviewLayout.vue'
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
import AdminComplexCreate from '@/views/master/complex/AdminComplexCreate.vue'
import AdminComplexDetail from '@/views/master/complex/AdminComplexDetail.vue'
import AdminComplexEdit from '@/views/master/complex/AdminComplexEdit.vue'
import AdminComplexList from '@/views/master/complex/AdminComplexList.vue'

const masterRouteMeta = {
  requiresAuth: true,
  roles: ['MASTER'],
}

const masterRoutes = [
  {
    // 마스터 홈은 랜딩형 단독 화면이므로 별도 레이아웃 없이 렌더링한다.
    path: '/admin/master',
    component: AdminComplexList,
    meta: masterRouteMeta,
  },
  {
    path: '/admin/master/complexes',
    meta: masterRouteMeta,
    redirect: '/admin/master',
  },
  {
    // 단지 등록 화면도 중앙 카드형 단독 화면이므로 레이아웃 없이 렌더링한다.
    path: '/admin/master/complexes/create',
    component: AdminComplexCreate,
    meta: masterRouteMeta,
  },
  {
    // 단지 상세 화면은 기존 흐름 호환을 위해 레이아웃 없이 유지한다.
    path: '/admin/master/complexes/:code',
    component: AdminComplexDetail,
    meta: masterRouteMeta,
  },
  {
    // 단지 수정 화면도 중앙 카드형 단독 화면이므로 레이아웃 없이 렌더링한다.
    path: '/admin/master/complexes/:code/edit',
    component: AdminComplexEdit,
    meta: masterRouteMeta,
  },
  {
    // 선택 단지 관리 화면부터는 일반 ADMIN과 같은 대표 메뉴를 재사용한다.
    path: '/admin/master/complexes/:code',
    component: AdminLayout,
    meta: masterRouteMeta,
    children: [
      {
        path: 'dashboard',
        component: AdminDashboard,
        meta: { ...masterRouteMeta, title: '대시보드' },
      },
      {
        path: 'admins',
        component: AdminAccountManage,
        meta: { ...masterRouteMeta, title: '관리자 관리' },
      },
      {
        path: 'households',
        component: AdminHouseholdList,
        meta: { ...masterRouteMeta, title: '세대 관리' },
      },
      {
        path: 'bills',
        component: AdminBillList,
        meta: { ...masterRouteMeta, title: '관리비 관리' },
      },
      {
        path: 'vehicles',
        component: AdminVehicleList,
        meta: { ...masterRouteMeta, title: '입주민 차량 목록' },
      },
      {
        path: 'visitor-vehicles',
        component: AdminVisitorVehicleList,
        meta: { ...masterRouteMeta, title: '방문차량 목록' },
      },
      {
        path: 'parking-logs',
        component: AdminParkingLogList,
        meta: { ...masterRouteMeta, title: '입출차 기록' },
      },
      {
        path: 'parking/dashboard',
        component: AdminParkingDashboard,
        meta: { ...masterRouteMeta, title: '주차 현황' },
      },
      {
        path: 'notices',
        component: AdminNoticeList,
        meta: { ...masterRouteMeta, title: '공지사항 관리' },
      },
      {
        path: 'votes',
        component: AdminVoteList,
        meta: { ...masterRouteMeta, title: '투표 관리' },
      },
      {
        path: 'boards/statistics',
        component: AdminBoardStatistics,
        meta: { ...masterRouteMeta, title: '게시판 통계' },
      },
      {
        path: 'facilities',
        component: AdminFacilityList,
        meta: { ...masterRouteMeta, title: '시설 관리' },
      },
      {
        path: 'reservations',
        component: AdminReservationList,
        meta: { ...masterRouteMeta, title: '예약 현황' },
      },
      {
        path: 'gx-programs',
        component: AdminGxProgramList,
        meta: { ...masterRouteMeta, title: 'GX 프로그램 관리' },
      },
    ],
  },
  {
    path: '/admin/complexes/:code/resident-preview',
    component: ResidentPreviewLayout,
    meta: masterRouteMeta,
  },
]

export default masterRoutes
