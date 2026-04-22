// 세대 관련 API 함수를 관리합니다.
import apiClient from './apiClient'

export default {
  getMyHousehold: () => apiClient.get('/households/me'),
  getMyBills: (params) => apiClient.get('/households/me/bills', { params }),
  getMyBillDetail: (billId) => apiClient.get(`/households/me/bills/${billId}`),
  getAdminHouseholds: (params) => apiClient.get('/admin/households', { params }),
  getAdminHouseholdDetail: (householdId) => apiClient.get(`/admin/households/${householdId}`),
  getHouseholdMatchRequests: (params) => apiClient.get('/admin/households/match-requests', { params }),
}
