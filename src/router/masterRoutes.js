import ResidentPreviewLayout from '@/layouts/ResidentPreviewLayout.vue'
import { useComplexStore } from '@/stores/useComplexStore'
import AdminComplexCreate from '@/views/master/complex/AdminComplexCreate.vue'
import AdminComplexDetail from '@/views/master/complex/AdminComplexDetail.vue'
import AdminComplexEdit from '@/views/master/complex/AdminComplexEdit.vue'
import AdminComplexList from '@/views/master/complex/AdminComplexList.vue'

const masterRouteMeta = {
  requiresAuth: true,
  roles: ['MASTER'],
}

// 기존 MASTER 전용 관리자 업무 URL로 들어오면 선택 단지를 저장한 뒤 공통 관리자 화면으로 넘긴다.
async function redirectToSharedAdminPage(to, targetPath) {
  const code = String(to.params.code || '')

  if (!code) {
    return '/admin/master'
  }

  const complexStore = useComplexStore()

  try {
    await complexStore.selectComplexForMaster(code)
    return targetPath
  } catch (error) {
    console.error(error)
    return '/admin/master'
  }
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
    // 기존 MASTER 대시보드 URL은 선택 단지를 저장한 뒤 공통 관리자 대시보드로 이동한다.
    path: '/admin/master/complexes/:code/dashboard',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/dashboard'),
  },
  {
    // 기존 MASTER 관리자 관리 URL은 선택 단지를 저장한 뒤 공통 관리자 관리 화면으로 이동한다.
    path: '/admin/master/complexes/:code/admins',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/admins'),
  },
  {
    path: '/admin/master/complexes/:code/households',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/households'),
  },
  {
    path: '/admin/master/complexes/:code/bills',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/bills'),
  },
  {
    path: '/admin/master/complexes/:code/vehicles',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/vehicles'),
  },
  {
    path: '/admin/master/complexes/:code/visitor-vehicles',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/visitor-vehicles'),
  },
  {
    path: '/admin/master/complexes/:code/parking-logs',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/parking-logs'),
  },
  {
    path: '/admin/master/complexes/:code/parking/dashboard',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/parking/dashboard'),
  },
  {
    path: '/admin/master/complexes/:code/parking/statistics',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/parking/statistics'),
  },
  {
    path: '/admin/master/complexes/:code/notices',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/notices'),
  },
  {
    path: '/admin/master/complexes/:code/votes',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/votes'),
  },
  {
    path: '/admin/master/complexes/:code/boards/statistics',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/boards/statistics'),
  },
  {
    path: '/admin/master/complexes/:code/facilities',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/facilities'),
  },
  {
    path: '/admin/master/complexes/:code/reservations',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/reservations'),
  },
  {
    path: '/admin/master/complexes/:code/gx-programs',
    meta: masterRouteMeta,
    beforeEnter: (to) => redirectToSharedAdminPage(to, '/admin/gx-programs'),
  },
  {
    path: '/admin/complexes/:code/resident-preview',
    component: ResidentPreviewLayout,
    meta: masterRouteMeta,
  },
]

export default masterRoutes
