import MasterLayout from '@/layouts/MasterLayout.vue'
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
    path: '/admin/master',
    component: MasterLayout,
    meta: masterRouteMeta,
    children: [
      { path: '', component: AdminComplexList, meta: masterRouteMeta },
      { path: 'complexes', redirect: '/admin/master' },
      { path: 'complexes/create', component: AdminComplexCreate, meta: masterRouteMeta },
      { path: 'complexes/:code', component: AdminComplexDetail, meta: masterRouteMeta },
      { path: 'complexes/:code/edit', component: AdminComplexEdit, meta: masterRouteMeta },
    ],
  },
  {
    path: '/admin/master/complexes/:code',
    component: MasterAdminLayout,
    meta: masterRouteMeta,
    children: [
      { path: 'dashboard', component: AdminComplexDashboard, meta: masterRouteMeta },
      { path: 'admins', component: AdminComplexAdmin, meta: masterRouteMeta },
    ],
  },
  {
    path: '/admin/complexes/:code/resident-preview',
    component: ResidentPreviewLayout,
    meta: masterRouteMeta,
  },
]

export default masterRoutes
