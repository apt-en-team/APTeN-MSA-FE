import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminNoticeCreate from '@/views/admin/board/AdminNoticeCreate.vue'
import AdminNoticeDetail from '@/views/admin/board/AdminNoticeDetail.vue'
import AdminNoticeEdit from '@/views/admin/board/AdminNoticeEdit.vue'
import AdminNoticeList from '@/views/admin/board/AdminNoticeList.vue'
import AdminVoteCreate from '@/views/admin/board/AdminVoteCreate.vue'
import AdminVoteDetail from '@/views/admin/board/AdminVoteDetail.vue'
import AdminVoteEdit from '@/views/admin/board/AdminVoteEdit.vue'
import AdminVoteList from '@/views/admin/board/AdminVoteList.vue'
import AdminVoteResult from '@/views/admin/board/AdminVoteResult.vue'
import AdminChatbotHistory from '@/views/admin/chatbot/AdminChatbotHistory.vue'
import AdminChatbotHistoryDetail from '@/views/admin/chatbot/AdminChatbotHistoryDetail.vue'
import AdminChatbotPolicy from '@/views/admin/chatbot/AdminChatbotPolicy.vue'
import AdminFaqCreate from '@/views/admin/chatbot/AdminFaqCreate.vue'
import AdminFaqEdit from '@/views/admin/chatbot/AdminFaqEdit.vue'
import AdminFaqList from '@/views/admin/chatbot/AdminFaqList.vue'
import AdminDashboard from '@/views/admin/dashboard/AdminDashboard.vue'
import AdminBillDetail from '@/views/admin/household/AdminBillDetail.vue'
import AdminBillList from '@/views/admin/household/AdminBillList.vue'
import AdminBillPolicy from '@/views/admin/household/AdminBillPolicy.vue'
import AdminHouseholdCreate from '@/views/admin/household/AdminHouseholdCreate.vue'
import AdminHouseholdDetail from '@/views/admin/household/AdminHouseholdDetail.vue'
import AdminHouseholdEdit from '@/views/admin/household/AdminHouseholdEdit.vue'
import AdminHouseholdList from '@/views/admin/household/AdminHouseholdList.vue'
import AdminHouseholdMatchList from '@/views/admin/household/AdminHouseholdMatchList.vue'
import AdminFacilityCreate from '@/views/admin/reservation/AdminFacilityCreate.vue'
import AdminFacilityDetail from '@/views/admin/reservation/AdminFacilityDetail.vue'
import AdminFacilityEdit from '@/views/admin/reservation/AdminFacilityEdit.vue'
import AdminFacilityList from '@/views/admin/reservation/AdminFacilityList.vue'
import AdminFacilityPolicy from '@/views/admin/reservation/AdminFacilityPolicy.vue'
import AdminFacilityType from '@/views/admin/reservation/AdminFacilityType.vue'
import AdminFacilityUsageStatus from '@/views/admin/reservation/AdminFacilityUsageStatus.vue'
import AdminGxApprovalList from '@/views/admin/reservation/AdminGxApprovalList.vue'
import AdminGxProgramCreate from '@/views/admin/reservation/AdminGxProgramCreate.vue'
import AdminGxProgramDetail from '@/views/admin/reservation/AdminGxProgramDetail.vue'
import AdminGxProgramEdit from '@/views/admin/reservation/AdminGxProgramEdit.vue'
import AdminGxProgramList from '@/views/admin/reservation/AdminGxProgramList.vue'
import AdminReservationDetail from '@/views/admin/reservation/AdminReservationDetail.vue'
import AdminReservationList from '@/views/admin/reservation/AdminReservationList.vue'
import AdminParkingStatus from '@/views/admin/vehicle/AdminParkingStatus.vue'
import AdminVehicleList from '@/views/admin/vehicle/AdminVehicleList.vue'
import AdminVehiclePolicy from '@/views/admin/vehicle/AdminVehiclePolicy.vue'
import AdminVisitorPolicy from '@/views/admin/vehicle/AdminVisitorPolicy.vue'
import AdminVisitorVehicleCreate from '@/views/admin/vehicle/AdminVisitorVehicleCreate.vue'
import AdminVisitorVehicleList from '@/views/admin/vehicle/AdminVisitorVehicleList.vue'

const adminRouteMeta = {
  requiresAuth: true,
  roles: ['ADMIN'],
}

const adminRoutes = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: adminRouteMeta,
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: AdminDashboard, meta: adminRouteMeta },
      { path: 'vehicles', component: AdminVehicleList, meta: adminRouteMeta },
      { path: 'vehicle-policies', component: AdminVehiclePolicy, meta: adminRouteMeta },
      { path: 'visitor-vehicles', component: AdminVisitorVehicleList, meta: adminRouteMeta },
      { path: 'visitor-vehicles/create', component: AdminVisitorVehicleCreate, meta: adminRouteMeta },
      { path: 'visitor-policies', component: AdminVisitorPolicy, meta: adminRouteMeta },
      { path: 'households', component: AdminHouseholdList, meta: adminRouteMeta },
      { path: 'households/create', component: AdminHouseholdCreate, meta: adminRouteMeta },
      { path: 'households/:householdId', component: AdminHouseholdDetail, meta: adminRouteMeta },
      { path: 'households/:householdId/edit', component: AdminHouseholdEdit, meta: adminRouteMeta },
      { path: 'household-match', component: AdminHouseholdMatchList, meta: adminRouteMeta },
      { path: 'bill-policy/basic', component: AdminBillPolicy, meta: adminRouteMeta },
      { path: 'bills', component: AdminBillList, meta: adminRouteMeta },
      { path: 'bills/:billId', component: AdminBillDetail, meta: adminRouteMeta },
      { path: 'notices', component: AdminNoticeList, meta: adminRouteMeta },
      { path: 'notices/create', component: AdminNoticeCreate, meta: adminRouteMeta },
      { path: 'notices/:noticeId', component: AdminNoticeDetail, meta: adminRouteMeta },
      { path: 'notices/:noticeId/edit', component: AdminNoticeEdit, meta: adminRouteMeta },
      { path: 'votes', component: AdminVoteList, meta: adminRouteMeta },
      { path: 'votes/create', component: AdminVoteCreate, meta: adminRouteMeta },
      { path: 'votes/:voteId', component: AdminVoteDetail, meta: adminRouteMeta },
      { path: 'votes/:voteId/edit', component: AdminVoteEdit, meta: adminRouteMeta },
      { path: 'votes/:voteId/results', component: AdminVoteResult, meta: adminRouteMeta },
      { path: 'facilities', component: AdminFacilityList, meta: adminRouteMeta },
      { path: 'facilities/create', component: AdminFacilityCreate, meta: adminRouteMeta },
      { path: 'facilities/:facilityId', component: AdminFacilityDetail, meta: adminRouteMeta },
      { path: 'facilities/:facilityId/edit', component: AdminFacilityEdit, meta: adminRouteMeta },
      { path: 'facility-types', component: AdminFacilityType, meta: adminRouteMeta },
      { path: 'facility-policies', component: AdminFacilityPolicy, meta: adminRouteMeta },
      { path: 'reservations', component: AdminReservationList, meta: adminRouteMeta },
      { path: 'reservations/:reservationId', component: AdminReservationDetail, meta: adminRouteMeta },
      { path: 'gx-programs', component: AdminGxProgramList, meta: adminRouteMeta },
      { path: 'gx-programs/create', component: AdminGxProgramCreate, meta: adminRouteMeta },
      { path: 'gx-programs/:programId', component: AdminGxProgramDetail, meta: adminRouteMeta },
      { path: 'gx-programs/:programId/edit', component: AdminGxProgramEdit, meta: adminRouteMeta },
      { path: 'gx-programs/:programId/approvals', component: AdminGxApprovalList, meta: adminRouteMeta },
      { path: 'facility-usage/status', component: AdminFacilityUsageStatus, meta: adminRouteMeta },
      { path: 'chatbot/faqs', component: AdminFaqList, meta: adminRouteMeta },
      { path: 'chatbot/faqs/create', component: AdminFaqCreate, meta: adminRouteMeta },
      { path: 'chatbot/faqs/:faqUid/edit', component: AdminFaqEdit, meta: adminRouteMeta },
      { path: 'chatbot/history', component: AdminChatbotHistory, meta: adminRouteMeta },
      { path: 'chatbot/history/:sessionUid', component: AdminChatbotHistoryDetail, meta: adminRouteMeta },
      { path: 'chatbot/policy', component: AdminChatbotPolicy, meta: adminRouteMeta },
    ],
  },
]

export default adminRoutes
