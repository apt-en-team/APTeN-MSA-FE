import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 기본 관리비 정책 설정
export const saveBasicBillPolicy = async (body) => {
  const res = await apiClient.put('/admin/household-bill-policies/basic', body)
  return unwrapApiData(res)
}

export const getBasicBillPolicy = async () => {
  const res = await apiClient.get('/admin/household-bill-policies/basic')
  return unwrapApiData(res)
}


// 월별 비용 확정
export const confirmHouseholdBill = async (billId) => {
  const res = await apiClient.patch(`/admin/household-bills/${billId}/confirm`)
  return unwrapApiData(res)
}

// 홈 화면 관리비 카드 조회 (표시 조건 만족 시 단건, 없으면 null)
export const getMyHomeBill = async () => {
  const res = await apiClient.get('/household-bills/home')
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

// 내 관리비 비교 조회 (동일 평형 6개월 비교)
export const getMyHouseholdBillComparison = async (billId) => {
  const res = await apiClient.get(`/household-bills/${billId}/comparison`)
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

// 월별 비용 확정 취소
export const unconfirmHouseholdBill = async (billId) => {
  const res = await apiClient.patch(`/admin/household-bills/${billId}/unconfirm`)
  return unwrapApiData(res)
}

// 기본 관리비 전 세대 청구서 반영
export const reflectBaseFee = async (body) => {
  const res = await apiClient.post('/admin/household-bills/base-fees', body)
  return unwrapApiData(res)
}

export default {
  getBasicBillPolicy,
  saveBasicBillPolicy,
  getMyHomeBill,
  confirmHouseholdBill,
  unconfirmHouseholdBill,
  getMyHouseholdBills,
  getMyHouseholdBillDetail,
  getMyHouseholdBillComparison,
  getAdminHouseholdBills,
  getAdminHouseholdBillDetail,
  reflectBaseFee,
}
