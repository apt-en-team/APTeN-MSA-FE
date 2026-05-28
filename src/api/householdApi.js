import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 관리자 세대 등록
export const createHousehold = async (body) => {
  const res = await apiClient.post('/admin/households', body)
  return unwrapApiData(res)
}

// 관리자 세대 일괄 등록
export const createHouseholdsBulk = async (body) => {
  const res = await apiClient.post('/admin/households/bulk', body)
  return unwrapApiData(res)
}

// 관리자 세대 삭제
export const deleteHousehold = async (householdId) => {
  const res = await apiClient.delete(`/admin/households/${householdId}`)
  return unwrapApiData(res)
}

// 관리자 세대 목록 조회
export const getAdminHouseholds = async (params) => {
  const res = await apiClient.get('/admin/households', { params })
  return unwrapApiData(res)
}

// 관리자 세대 상세 조회
export const getAdminHouseholdDetail = async (householdId) => {
  const res = await apiClient.get(`/admin/households/${householdId}`)
  return unwrapApiData(res)
}

// 세대 상태 변경
export const updateHouseholdStatus = async (householdId, body) => {
  const res = await apiClient.patch(`/admin/households/${householdId}/status`, body)
  return unwrapApiData(res)
}

// 입주/퇴거 이력 조회
export const getHouseholdHistory = async (householdId) => {
  const res = await apiClient.get(`/admin/households/${householdId}/history`)
  return unwrapApiData(res)
}

// 세대원 등록
export const createHouseholdMember = async (householdId, body) => {
  const res = await apiClient.post(`/admin/households/${householdId}/members`, body)
  return unwrapApiData(res)
}

// 세대원 목록 조회
export const getHouseholdMembers = async (householdId) => {
  const res = await apiClient.get(`/admin/households/${householdId}/members`)
  return unwrapApiData(res)
}

// 세대원 수정
export const updateHouseholdMember = async (householdMemberId, body) => {
  const res = await apiClient.patch(`/admin/household-members/${householdMemberId}`, body)
  return unwrapApiData(res)
}

// 세대원 삭제
export const deleteHouseholdMember = async (householdMemberId) => {
  const res = await apiClient.delete(`/admin/household-members/${householdMemberId}`)
  return unwrapApiData(res)
}

// 세대주 권한 변경
export const changeHouseholdHead = async (householdId, body) => {
  const res = await apiClient.patch(`/admin/households/${householdId}/head`, body)
  return unwrapApiData(res)
}

// 수동 승인 대상 조회
export const getHouseholdMatchRequests = async (params) => {
  const res = await apiClient.get('/admin/household-match-requests', { params })
  return unwrapApiData(res)
}

// 수동 승인 처리
export const approveHouseholdMatchRequest = async (matchRequestId) => {
  const res = await apiClient.patch(`/admin/household-match-requests/${matchRequestId}/approve`)
  return unwrapApiData(res)
}

// 수동 거절 처리
export const rejectHouseholdMatchRequest = async (matchRequestId, body) => {
  const res = await apiClient.patch(`/admin/household-match-requests/${matchRequestId}/reject`, body)
  return unwrapApiData(res)
}

// 입주민 명부 등록
export const createExpectedResident = async (body) => {
  const res = await apiClient.post('/admin/expected-residents', body)
  return unwrapApiData(res)
}

// 관리자 입주민 명부 조회
export const getExpectedResidents = async (params) => {
  const res = await apiClient.get('/admin/expected-residents', { params })
  return unwrapApiData(res)
}

// 입주민 명부 수정
export const updateExpectedResident = async (expectedResidentId, body) => {
  const res = await apiClient.patch(`/admin/expected-residents/${expectedResidentId}`, body)
  return unwrapApiData(res)
}

// 입주민 명부 비활성화
export const disableExpectedResident = async (expectedResidentId) => {
  const res = await apiClient.patch(`/admin/expected-residents/${expectedResidentId}/disable`)
  return unwrapApiData(res)
}

// 세대 정보 수정
export const updateHousehold = async (householdId, body) => {
  const res = await apiClient.patch(`/admin/households/${householdId}`, body)
  return unwrapApiData(res)
}

// 내 세대 정보 조회
export const getMyHousehold = async () => {
  const res = await apiClient.get('/households/me')
  return unwrapApiData(res)
}

// 평형 목록 조회
export const getHouseholdTypes = async () => {
  const res = await apiClient.get('/admin/household-types')
  return unwrapApiData(res)
}

// 평형 등록
export const createHouseholdType = async (body) => {
  const res = await apiClient.post('/admin/household-types', body)
  return unwrapApiData(res)
}

// 평형 수정
export const updateHouseholdType = async (typeId, body) => {
  const res = await apiClient.patch(`/admin/household-types/${typeId}`, body)
  return unwrapApiData(res)
}

// 평형 삭제
export const deleteHouseholdType = async (typeId) => {
  const res = await apiClient.delete(`/admin/household-types/${typeId}`)
  return unwrapApiData(res)
}

// 동 라인 평형 목록 조회
export const getBuildingLineTypes = async (params) => {
  const res = await apiClient.get('/admin/building-line-types', { params })
  return unwrapApiData(res)
}

// 동호수 기준 평형 조회
export const resolveBuildingLineType = async (params) => {
  const res = await apiClient.get('/admin/building-line-types/resolve', { params })
  return unwrapApiData(res)
}

// 동 라인 평형 등록
export const createBuildingLineType = async (body) => {
  const res = await apiClient.post('/admin/building-line-types', body)
  return unwrapApiData(res)
}

// 동 라인 평형 수정
export const updateBuildingLineType = async (lineTypeId, body) => {
  const res = await apiClient.patch(`/admin/building-line-types/${lineTypeId}`, body)
  return unwrapApiData(res)
}

// 동 라인 평형 삭제
export const deleteBuildingLineType = async (lineTypeId) => {
  const res = await apiClient.delete(`/admin/building-line-types/${lineTypeId}`)
  return unwrapApiData(res)
}

export default {
  createHousehold,
  createHouseholdsBulk,
  deleteHousehold,
  createExpectedResident,
  getExpectedResidents,
  updateExpectedResident,
  disableExpectedResident,
  getAdminHouseholds,
  getAdminHouseholdDetail,
  updateHouseholdStatus,
  getHouseholdHistory,
  createHouseholdMember,
  getHouseholdMembers,
  updateHouseholdMember,
  deleteHouseholdMember,
  changeHouseholdHead,
  getHouseholdMatchRequests,
  approveHouseholdMatchRequest,
  rejectHouseholdMatchRequest,
  updateHousehold,
  getMyHousehold,
  getHouseholdTypes,
  createHouseholdType,
  updateHouseholdType,
  deleteHouseholdType,
  getBuildingLineTypes,
  resolveBuildingLineType,
  createBuildingLineType,
  updateBuildingLineType,
  deleteBuildingLineType,
}
