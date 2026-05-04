import ResidentPreviewLayout from '@/layouts/ResidentPreviewLayout.vue'
import AdminComplexCreate from '@/views/master/complex/AdminComplexCreate.vue'
import AdminComplexDashboard from '@/views/master/complex/AdminComplexDashboard.vue'
import ComplexAdminManage from '@/views/master/complex/ComplexAdminManage.vue'
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
    // MASTER 전용 관리자형 화면은 각 페이지가 legacy AdminLayout을 직접 사용한다.
    path: '/admin/master/complexes/:code/dashboard',
    component: AdminComplexDashboard,
    meta: masterRouteMeta,
  },
  {
    // 선택 단지의 관리자 관리 화면은 별도 페이지 컴포넌트로 분리한다.
    path: '/admin/master/complexes/:code/admins',
    component: ComplexAdminManage,
    meta: masterRouteMeta,
  },
  {
    path: '/admin/complexes/:code/resident-preview',
    component: ResidentPreviewLayout,
    meta: masterRouteMeta,
  },
]

export default masterRoutes
