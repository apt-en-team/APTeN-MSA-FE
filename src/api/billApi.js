import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 기본 관리비 정책 설정
export const saveBasicBillPolicy = async (body) => {
  const res = await apiClient.put('/admin/household-bill-policies/basic', body)
  return unwrapApiData(res)
}

// 월별 비용 확정
export const confirmHouseholdBill = async (billId) => {
  const res = await apiClient.patch(`/admin/household-bills/${billId}/confirm`)
  return unwrapApiData(res)
}

// 내 관리비 목록 조회
export const getMyHouseholdBills = async (params) => {
  const res = await apiClient.get('/household-bills', { params })
  return unwrapApiData(res)
}

// 내 관리비 상세 조회
export const getMyHouseholdBillDetail = async (billId) => {
  const res = await apiClient.get(`/household-bills/${billId}`)
  return unwrapApiData(res)
}

// 관리자 관리비 목록 조회
export const getAdminHouseholdBills = async (params) => {
  const res = await apiClient.get('/admin/household-bills', { params })
  return unwrapApiData(res)
}

// 관리자 관리비 상세 조회
export const getAdminHouseholdBillDetail = async (billId) => {
  const res = await apiClient.get(`/admin/household-bills/${billId}`)
  return unwrapApiData(res)
}

export default {
  saveBasicBillPolicy,
  confirmHouseholdBill,
  getMyHouseholdBills,
  getMyHouseholdBillDetail,
  getAdminHouseholdBills,
  getAdminHouseholdBillDetail,
}
