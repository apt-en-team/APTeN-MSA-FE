import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminChatbotHistory from '@/views/admin/chatbot/AdminChatbotHistory.vue'
import AdminChatbotHistoryDetail from '@/views/admin/chatbot/AdminChatbotHistoryDetail.vue'
import AdminChatbotPolicy from '@/views/admin/chatbot/AdminChatbotPolicy.vue'
import AdminFaqCreate from '@/views/admin/chatbot/AdminFaqCreate.vue'
import AdminFaqEdit from '@/views/admin/chatbot/AdminFaqEdit.vue'
import AdminFaqList from '@/views/admin/chatbot/AdminFaqList.vue'
import AdminDashboard from '@/views/admin/dashboard/AdminDashboard.vue'
import AdminBillDetail from '@/views/admin/bill/AdminBillDetail.vue'
import AdminBillList from '@/views/admin/bill/AdminBillList.vue'
import AdminBillPolicy from '@/views/admin/bill/AdminBillPolicy.vue'
import AdminHouseholdCreate from '@/views/admin/household/AdminHouseholdCreate.vue'
import AdminHouseholdDetail from '@/views/admin/household/AdminHouseholdDetail.vue'
import AdminHouseholdEdit from '@/views/admin/household/AdminHouseholdEdit.vue'
import AdminHouseholdList from '@/views/admin/household/AdminHouseholdList.vue'
import AdminHouseholdMatchList from '@/views/admin/household/AdminHouseholdMatchList.vue'
import AdminNoticeCreate from '@/views/admin/notice/AdminNoticeCreate.vue'
import AdminNoticeDetail from '@/views/admin/notice/AdminNoticeDetail.vue'
import AdminNoticeEdit from '@/views/admin/notice/AdminNoticeEdit.vue'
import AdminNoticeList from '@/views/admin/notice/AdminNoticeList.vue'
import AdminFacilityCreate from '@/views/admin/facility/AdminFacilityCreate.vue'
import AdminFacilityDetail from '@/views/admin/facility/AdminFacilityDetail.vue'
import AdminFacilityEdit from '@/views/admin/facility/AdminFacilityEdit.vue'
import AdminFacilityList from '@/views/admin/facility/AdminFacilityList.vue'
import AdminFacilityPolicy from '@/views/admin/facility/AdminFacilityPolicy.vue'
import AdminFacilityType from '@/views/admin/facility/AdminFacilityType.vue'
import AdminFacilityUsageStatus from '@/views/admin/facility/AdminFacilityUsageStatus.vue'
import AdminGxApprovalList from '@/views/admin/gx/AdminGxApprovalList.vue'
import AdminGxProgramCreate from '@/views/admin/gx/AdminGxProgramCreate.vue'
import AdminGxProgramDetail from '@/views/admin/gx/AdminGxProgramDetail.vue'
import AdminGxProgramEdit from '@/views/admin/gx/AdminGxProgramEdit.vue'
import AdminGxProgramList from '@/views/admin/gx/AdminGxProgramList.vue'
import AdminReservationDetail from '@/views/admin/reservation/AdminReservationDetail.vue'
import AdminReservationList from '@/views/admin/reservation/AdminReservationList.vue'
import AdminVehicleList from '@/views/admin/vehicle/AdminVehicleList.vue'
import AdminVehiclePolicy from '@/views/admin/vehicle/AdminVehiclePolicy.vue'
import AdminVisitorPolicy from '@/views/admin/visitorVehicle/AdminVisitorPolicy.vue'
import AdminVisitorVehicleCreate from '@/views/admin/visitorVehicle/AdminVisitorVehicleCreate.vue'
import AdminVisitorVehicleList from '@/views/admin/visitorVehicle/AdminVisitorVehicleList.vue'
import AdminVoteCreate from '@/views/admin/vote/AdminVoteCreate.vue'
import AdminVoteDetail from '@/views/admin/vote/AdminVoteDetail.vue'
import AdminVoteEdit from '@/views/admin/vote/AdminVoteEdit.vue'
import AdminVoteList from '@/views/admin/vote/AdminVoteList.vue'
import AdminVoteResult from '@/views/admin/vote/AdminVoteResult.vue'

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
      // 관리자 기본 진입
      { path: '', redirect: '/admin/dashboard' },

      // 대시보드
      { path: 'dashboard', component: AdminDashboard, meta: adminRouteMeta },

      // 차량 관리
      { path: 'vehicles', component: AdminVehicleList, meta: adminRouteMeta },
      { path: 'vehicle-policies', component: AdminVehiclePolicy, meta: adminRouteMeta },

      // 방문차량 관리
      { path: 'visitor-vehicles', component: AdminVisitorVehicleList, meta: adminRouteMeta },
      { path: 'visitor-vehicles/create', component: AdminVisitorVehicleCreate, meta: adminRouteMeta },
      { path: 'visitor-policies', component: AdminVisitorPolicy, meta: adminRouteMeta },

      // 세대 관리
      { path: 'households', component: AdminHouseholdList, meta: adminRouteMeta },
      { path: 'households/create', component: AdminHouseholdCreate, meta: adminRouteMeta },
      { path: 'households/:householdId', component: AdminHouseholdDetail, meta: adminRouteMeta },
      { path: 'households/:householdId/edit', component: AdminHouseholdEdit, meta: adminRouteMeta },
      { path: 'household-match', component: AdminHouseholdMatchList, meta: adminRouteMeta },

      // 관리비 관리
      { path: 'bill-policy/basic', component: AdminBillPolicy, meta: adminRouteMeta },
      { path: 'bills', component: AdminBillList, meta: adminRouteMeta },
      { path: 'bills/:billId', component: AdminBillDetail, meta: adminRouteMeta },

      // 공지사항 관리
      { path: 'notices', component: AdminNoticeList, meta: adminRouteMeta },
      { path: 'notices/create', component: AdminNoticeCreate, meta: adminRouteMeta },
      { path: 'notices/:noticeId', component: AdminNoticeDetail, meta: adminRouteMeta },
      { path: 'notices/:noticeId/edit', component: AdminNoticeEdit, meta: adminRouteMeta },

      // 투표 관리
      { path: 'votes', component: AdminVoteList, meta: adminRouteMeta },
      { path: 'votes/create', component: AdminVoteCreate, meta: adminRouteMeta },
      { path: 'votes/:voteId', component: AdminVoteDetail, meta: adminRouteMeta },
      { path: 'votes/:voteId/edit', component: AdminVoteEdit, meta: adminRouteMeta },
      { path: 'votes/:voteId/results', component: AdminVoteResult, meta: adminRouteMeta },

      // 시설 관리
      { path: 'facilities', component: AdminFacilityList, meta: adminRouteMeta },
      { path: 'facilities/create', component: AdminFacilityCreate, meta: adminRouteMeta },
      { path: 'facilities/:facilityId', component: AdminFacilityDetail, meta: adminRouteMeta },
      { path: 'facilities/:facilityId/edit', component: AdminFacilityEdit, meta: adminRouteMeta },
      { path: 'facility-types', component: AdminFacilityType, meta: adminRouteMeta },
      { path: 'facility-policies', component: AdminFacilityPolicy, meta: adminRouteMeta },

      // 예약 관리
      { path: 'reservations', component: AdminReservationList, meta: adminRouteMeta },
      { path: 'reservations/:reservationId', component: AdminReservationDetail, meta: adminRouteMeta },
      { path: 'facility-usage/status', component: AdminFacilityUsageStatus, meta: adminRouteMeta },

      // GX 프로그램 관리
      { path: 'gx-programs', component: AdminGxProgramList, meta: adminRouteMeta },
      { path: 'gx-programs/create', component: AdminGxProgramCreate, meta: adminRouteMeta },
      { path: 'gx-programs/:programId', component: AdminGxProgramDetail, meta: adminRouteMeta },
      { path: 'gx-programs/:programId/edit', component: AdminGxProgramEdit, meta: adminRouteMeta },
      { path: 'gx-programs/:programId/approvals', component: AdminGxApprovalList, meta: adminRouteMeta },

      // 챗봇 관리
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
