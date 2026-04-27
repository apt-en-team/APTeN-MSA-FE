import MasterLayout from '@/layouts/MasterLayout.vue'
import ResidentPreviewLayout from '@/layouts/ResidentPreviewLayout.vue'
import AdminComplexAdmin from '@/views/admin/complex/AdminComplexAdmin.vue'
import AdminComplexCreate from '@/views/admin/complex/AdminComplexCreate.vue'
import AdminComplexDetail from '@/views/admin/complex/AdminComplexDetail.vue'
import AdminComplexEdit from '@/views/admin/complex/AdminComplexEdit.vue'
import AdminComplexList from '@/views/admin/complex/AdminComplexList.vue'

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
      { path: 'complexes', component: AdminComplexList, meta: masterRouteMeta },
      { path: 'complexes/create', component: AdminComplexCreate, meta: masterRouteMeta },
      { path: 'complexes/:code', component: AdminComplexDetail, meta: masterRouteMeta },
      { path: 'complexes/:code/edit', component: AdminComplexEdit, meta: masterRouteMeta },
      { path: 'complexes/:code/admins', component: AdminComplexAdmin, meta: masterRouteMeta },
    ],
  },
  {
    path: '/admin/complexes/:code/resident-preview',
    component: ResidentPreviewLayout,
    meta: masterRouteMeta,
  },
]

export default masterRoutes
