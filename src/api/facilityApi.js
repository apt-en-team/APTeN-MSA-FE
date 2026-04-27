import apiClient from './apiClient'

// 관리자 시설 등록
export const createFacility = async (body) => {
  const res = await apiClient.post('/api/admin/facilities', body)
  return res.data
}

// 관리자 시설 목록 조회
export const getAdminFacilities = async (params) => {
  const res = await apiClient.get('/api/admin/facilities', { params })
  return res.data
}

// 관리자 시설 상세 조회
export const getAdminFacilityDetail = async (facilityId) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}`)
  return res.data
}

// 관리자 시설 수정
export const updateFacility = async (facilityId, body) => {
  const res = await apiClient.patch(`/api/admin/facilities/${facilityId}`, body)
  return res.data
}

// 관리자 시설 삭제
export const deleteFacility = async (facilityId) => {
  const res = await apiClient.delete(`/api/admin/facilities/${facilityId}`)
  return res.data
}

// 시설 활성/비활성 변경
export const updateFacilityActive = async (facilityId, body) => {
  const res = await apiClient.patch(`/api/admin/facilities/${facilityId}/active`, body)
  return res.data
}

// 시설 타입 등록
export const createFacilityType = async (body) => {
  const res = await apiClient.post('/api/admin/facility-types', body)
  return res.data
}

// 시설 타입 목록 조회
export const getFacilityTypes = async (params) => {
  const res = await apiClient.get('/api/admin/facility-types', { params })
  return res.data
}

// 시설 타입 수정
export const updateFacilityType = async (facilityTypeId, body) => {
  const res = await apiClient.patch(`/api/admin/facility-types/${facilityTypeId}`, body)
  return res.data
}

// 시설 예약 정책 설정
export const saveFacilityPolicy = async (body) => {
  const res = await apiClient.put('/api/admin/facility-policies', body)
  return res.data
}

// 시설 예약 정책 조회
export const getFacilityPolicies = async (params) => {
  const res = await apiClient.get('/api/admin/facility-policies', { params })
  return res.data
}

// 시설 차단 시간 등록
export const createFacilityBlockTime = async (facilityId, body) => {
  const res = await apiClient.post(`/api/admin/facilities/${facilityId}/block-times`, body)
  return res.data
}

// 시설 차단 시간 목록 조회
export const getFacilityBlockTimes = async (facilityId, params) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}/block-times`, { params })
  return res.data
}

// 시설 좌석 등록
export const createFacilitySeat = async (facilityId, body) => {
  const res = await apiClient.post(`/api/admin/facilities/${facilityId}/seats`, body)
  return res.data
}

// 시설 좌석 목록 조회
export const getFacilitySeats = async (facilityId) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}/seats`)
  return res.data
}

// 시설 좌석 수정
export const updateFacilitySeat = async (seatId, body) => {
  const res = await apiClient.patch(`/api/admin/facility-seats/${seatId}`, body)
  return res.data
}

// 입주민 시설 목록 조회
export const getFacilities = async (params) => {
  const res = await apiClient.get('/api/facilities', { params })
  return res.data
}

// 입주민 시설 상세 조회
export const getFacilityDetail = async (facilityId) => {
  const res = await apiClient.get(`/api/facilities/${facilityId}`)
  return res.data
}

// 시설 이용 현황 조회
export const getFacilityUsageStatus = async (params) => {
  const res = await apiClient.get('/api/admin/facility-usage/status', { params })
  return res.data
}

// 좌석 상태 조회
export const getFacilitySeatStatus = async (facilityId, params) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}/seat-status`, { params })
  return res.data
}

// 정원형 이용 현황 조회
export const getFacilityCountStatus = async (facilityId, params) => {
  const res = await apiClient.get(`/api/admin/facilities/${facilityId}/count-status`, { params })
  return res.data
}

export default {
  createFacility,
  getAdminFacilities,
  getAdminFacilityDetail,
  updateFacility,
  deleteFacility,
  updateFacilityActive,
  createFacilityType,
  getFacilityTypes,
  updateFacilityType,
  saveFacilityPolicy,
  getFacilityPolicies,
  createFacilityBlockTime,
  getFacilityBlockTimes,
  createFacilitySeat,
  getFacilitySeats,
  updateFacilitySeat,
  getFacilities,
  getFacilityDetail,
  getFacilityUsageStatus,
  getFacilitySeatStatus,
  getFacilityCountStatus,
}
