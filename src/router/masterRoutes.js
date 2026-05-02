import MasterAdminLayout from '@/layouts/MasterAdminLayout.vue'
import ResidentPreviewLayout from '@/layouts/ResidentPreviewLayout.vue'
import AdminComplexAdmin from '@/views/master/complex/AdminComplexAdmin.vue'
import AdminComplexCreate from '@/views/master/complex/AdminComplexCreate.vue'
import AdminComplexDashboard from '@/views/master/complex/AdminComplexDashboard.vue'
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
    // 선택 단지 관리 화면부터는 MasterAdminLayout을 사용한다.
    path: '/admin/master/complexes/:code/dashboard',
    component: MasterAdminLayout,
    meta: masterRouteMeta,
    children: [{ path: '', component: AdminComplexDashboard, meta: masterRouteMeta }],
  },
  {
    // 선택 단지 관리 화면부터는 MasterAdminLayout을 사용한다.
    path: '/admin/master/complexes/:code/admins',
    component: MasterAdminLayout,
    meta: masterRouteMeta,
    children: [{ path: '', component: AdminComplexAdmin, meta: masterRouteMeta }],
  },
  {
    path: '/admin/complexes/:code/resident-preview',
    component: ResidentPreviewLayout,
    meta: masterRouteMeta,
  },
]

export default masterRoutes
