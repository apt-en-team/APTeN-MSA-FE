import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// API-601 시설 등록
export const createFacility = async (body) => {
  const res = await apiClient.post('/api/admin/facilities', body)
  return unwrapApiData(res)
}

// API-602 관리자 시설 목록 조회
export const getAdminFacilities = async (params) => {
  const res = await apiClient.get('/api/admin/facilities', { params })
  return unwrapApiData(res)
}

// API-603 관리자 시설 상세 조회
export const getAdminFacilityDetail = async (facilityId) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}`)
  return unwrapApiData(res)
}

// API-604 시설 수정
export const updateFacility = async (facilityId, body) => {
  const res = await apiClient.patch(`/api/admin/facilities/${facilityId}`, body)
  return unwrapApiData(res)
}

// API-605 시설 삭제
export const deleteFacility = async (facilityId) => {
  const res = await apiClient.delete(`/api/admin/facilities/${facilityId}`)
  return unwrapApiData(res)
}

// API-606 시설 활성/비활성 변경
export const updateFacilityActive = async (facilityId, body) => {
  const res = await apiClient.patch(`/api/admin/facilities/${facilityId}/active`, body)
  return unwrapApiData(res)
}

// // 시설 타입 등록
// export const createFacilityType = async (body) => {
//   const res = await apiClient.post('/api/admin/facility-types', body)
//   return unwrapApiData(res)
// }

// API-608 시설 타입 목록 조회
export const getFacilityTypes = async (params) => {
  const res = await apiClient.get('/api/admin/facility-types', { params })
  return unwrapApiData(res)
}

// // 시설 타입 수정
// export const updateFacilityType = async (facilityTypeId, body) => {
//   const res = await apiClient.patch(`/api/admin/facility-types/${facilityTypeId}`, body)
//   return unwrapApiData(res)
// }

// API-610 시설 예약 정책 설정 (facilityId 기준)
export const saveFacilityPolicy = async (body) => {
  const res = await apiClient.put('/api/admin/facility-policies', body)
  return unwrapApiData(res)
}

// API-611 시설 예약 정책 조회 (facilityId 기준)
export const getFacilityPolicies = async (params) => {
  const query = typeof params === 'string' || typeof params === 'number' ? { facilityId: params } : params
  const res = await apiClient.get('/api/admin/facility-policies', { params: query })
  return unwrapApiData(res)
}

// API-612 시설 차단 시간 등록
export const createFacilityBlockTime = async (facilityId, body) => {
  const res = await apiClient.post(`/api/admin/facilities/${facilityId}/block-times`, body)
  return unwrapApiData(res)
}

// API-613 시설 차단 시간 조회
export const getFacilityBlockTimes = async (facilityId, params) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}/block-times`, { params })
  return unwrapApiData(res)
}

// 시설 반복 차단 시간 일괄 등록
export const createFacilityBlockTimeBatch = async (facilityId, body) => {
  const res = await apiClient.post(`/api/admin/facilities/${facilityId}/block-times/batch`, body)
  return unwrapApiData(res)
}

// 시설 반복 차단 일괄 비활성화
export const deactivateFacilityBlockTimeBatch = async (facilityId, batchId) => {
  const res = await apiClient.patch(
    `/api/admin/facilities/${facilityId}/block-times/batch/${batchId}/deactivate`,
  )
  return unwrapApiData(res)
}

// 시설 차단 시간 단건 비활성화
export const deactivateFacilityBlockTime = async (facilityId, blockTimeId) => {
  const res = await apiClient.patch(
    `/api/admin/facilities/${facilityId}/block-times/${blockTimeId}/deactivate`,
  )
  return unwrapApiData(res)
}

// 시설 차단 시간 단건 수정
export const updateFacilityBlockTime = async (facilityId, blockTimeId, body) => {
  const res = await apiClient.patch(
    `/api/admin/facilities/${facilityId}/block-times/${blockTimeId}`,
    body,
  )
  return unwrapApiData(res)
}

// 정기 휴무 규칙 등록
export const createClosureRule = async (facilityId, body) => {
  const res = await apiClient.post(`/api/admin/facilities/${facilityId}/closure-rules`, body)
  return unwrapApiData(res)
}

// 정기 휴무 규칙 목록 조회
export const getClosureRules = async (facilityId) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}/closure-rules`)
  return unwrapApiData(res)
}

// 정기 휴무 규칙 수정
export const updateClosureRule = async (facilityId, ruleId, body) => {
  const res = await apiClient.patch(
    `/api/admin/facilities/${facilityId}/closure-rules/${ruleId}`,
    body,
  )
  return unwrapApiData(res)
}

// 정기 휴무 규칙 비활성화
export const deactivateClosureRule = async (facilityId, ruleId) => {
  const res = await apiClient.patch(
    `/api/admin/facilities/${facilityId}/closure-rules/${ruleId}/deactivate`,
  )
  return unwrapApiData(res)
}

// 시설 좌석 등록
export const createFacilitySeat = async (facilityId, body) => {
  const res = await apiClient.post(`/api/admin/facilities/${facilityId}/seats`, body)
  return unwrapApiData(res)
}

// 시설 좌석 일괄 등록
export const bulkCreateFacilitySeats = async (facilityId, body) => {
  const res = await apiClient.post(`/api/admin/facilities/${facilityId}/seats/bulk`, body)
  return unwrapApiData(res)
}

// 시설 좌석 목록 조회
export const getFacilitySeats = async (facilityId) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}/seats`)
  return unwrapApiData(res)
}

// 시설 좌석 수정
export const updateFacilitySeat = async (seatId, body) => {
  const res = await apiClient.patch(`/api/admin/facility-seats/${seatId}`, body)
  return unwrapApiData(res)
}

// 입주민 시설 목록 조회
export const getFacilities = async (params) => {
  const res = await apiClient.get('/api/facilities', { params })
  return unwrapApiData(res)
}

// 입주민 시설 상세 조회
export const getFacilityDetail = async (facilityId) => {
  const res = await apiClient.get(`/api/facilities/${facilityId}`)
  return unwrapApiData(res)
}

// 입주민 좌석 상태 조회
export const getResidentSeatStatus = async (facilityId, params) => {
  const res = await apiClient.get(`/api/facilities/${facilityId}/seat-status`, { params })
  return unwrapApiData(res)
}

// 시설 이용 현황 조회
export const getFacilityUsageStatus = async (params) => {
  const res = await apiClient.get('/api/admin/facility-usage/status', { params })
  return unwrapApiData(res)
}

// 좌석 상태 조회
export const getFacilitySeatStatus = async (facilityId, params) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}/seat-status`, { params })
  return unwrapApiData(res)
}

// 정원형 이용 현황 조회
export const getFacilityCountStatus = async (facilityId, params) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}/count-status`, { params })
  return unwrapApiData(res)
}

// API-651 입주민 시설 구독 해지
export const cancelFacilitySubscription = async (facilityId) => {
  const res = await apiClient.post(`/api/facility-subscriptions/${facilityId}/cancel`)
  return unwrapApiData(res)
}

// API-652 입주민 나의 구독 목록 조회
export const getMySubscriptions = async () => {
  const res = await apiClient.get('/api/facility-subscriptions')
  return unwrapApiData(res)
}

// API-653 관리자 구독 목록 조회 (facilityId, status 필터 선택)
export const getAdminSubscriptions = async (params) => {
  const res = await apiClient.get('/api/admin/facility-subscriptions', { params })
  return unwrapApiData(res)
}

// 관리자 세대별 구독 요약 목록 조회
export const getAdminHouseholdSubscriptionList = async () => {
  const res = await apiClient.get('/api/admin/facility-subscriptions/households')
  return unwrapApiData(res)
}

// 관리자 세대별 구독 상세 조회
export const getAdminHouseholdSubscriptionDetail = async (householdId) => {
  const res = await apiClient.get(`/api/admin/facility-subscriptions/households/${householdId}`)
  return unwrapApiData(res)
}

// 관리자 구독 강제 해지
export const adminCancelSubscription = async (subscriptionId) => {
  const res = await apiClient.delete(`/api/admin/facility-subscriptions/${subscriptionId}`)
  return unwrapApiData(res)
}

export default {
  createFacility,
  getAdminFacilities,
  getAdminFacilityDetail,
  updateFacility,
  deleteFacility,
  updateFacilityActive,
  getFacilityTypes,
  saveFacilityPolicy,
  getFacilityPolicies,
  createFacilityBlockTime,
  getFacilityBlockTimes,
  createFacilityBlockTimeBatch,
  deactivateFacilityBlockTimeBatch,
  deactivateFacilityBlockTime,
  updateFacilityBlockTime,
  createClosureRule,
  getClosureRules,
  updateClosureRule,
  deactivateClosureRule,
  createFacilitySeat,
  bulkCreateFacilitySeats,
  getFacilitySeats,
  updateFacilitySeat,
  getFacilities,
  getFacilityDetail,
  getResidentSeatStatus,
  getFacilityUsageStatus,
  getFacilitySeatStatus,
  getFacilityCountStatus,
  cancelFacilitySubscription,
  getMySubscriptions,
  getAdminSubscriptions,
  getAdminHouseholdSubscriptionList,
  getAdminHouseholdSubscriptionDetail,
  adminCancelSubscription,
}
