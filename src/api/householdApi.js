import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 관리자 세대 등록
export const createHousehold = async (body) => {
  const res = await apiClient.post('/api/admin/households', body)
  return unwrapApiData(res)
}

// 관리자 세대 목록 조회
export const getAdminHouseholds = async (params) => {
  const res = await apiClient.get('/api/admin/households', { params })
  return unwrapApiData(res)
}

// 관리자 세대 상세 조회
export const getAdminHouseholdDetail = async (householdId) => {
  const res = await apiClient.get(`/api/admin/households/${householdId}`)
  return unwrapApiData(res)
}

// 세대 상태 변경
export const updateHouseholdStatus = async (householdId, body) => {
  const res = await apiClient.patch(`/api/admin/households/${householdId}/status`, body)
  return unwrapApiData(res)
}

// 입주/퇴거 이력 조회
export const getHouseholdHistory = async (householdId) => {
  const res = await apiClient.get(`/api/admin/households/${householdId}/history`)
  return unwrapApiData(res)
}

// 세대원 등록
export const createHouseholdMember = async (householdId, body) => {
  const res = await apiClient.post(`/api/admin/households/${householdId}/members`, body)
  return unwrapApiData(res)
}

// 세대원 목록 조회
export const getHouseholdMembers = async (householdId) => {
  const res = await apiClient.get(`/api/admin/households/${householdId}/members`)
  return unwrapApiData(res)
}

// 세대원 수정
export const updateHouseholdMember = async (householdMemberId, body) => {
  const res = await apiClient.patch(`/api/admin/household-members/${householdMemberId}`, body)
  return unwrapApiData(res)
}

// 세대원 삭제
export const deleteHouseholdMember = async (householdMemberId) => {
  const res = await apiClient.delete(`/api/admin/household-members/${householdMemberId}`)
  return unwrapApiData(res)
}

// 세대주 권한 변경
export const changeHouseholdHead = async (householdId, body) => {
  const res = await apiClient.patch(`/api/admin/households/${householdId}/head`, body)
  return unwrapApiData(res)
}

// 수동 승인 대상 조회
export const getHouseholdMatchRequests = async (params) => {
  const res = await apiClient.get('/api/admin/household-match-requests', { params })
  return unwrapApiData(res)
}

// 수동 승인 처리
export const approveHouseholdMatchRequest = async (matchRequestId) => {
  const res = await apiClient.patch(`/api/admin/household-match-requests/${matchRequestId}/approve`)
  return unwrapApiData(res)
}

// 수동 거절 처리
export const rejectHouseholdMatchRequest = async (matchRequestId, body) => {
  const res = await apiClient.patch(`/api/admin/household-match-requests/${matchRequestId}/reject`, body)
  return unwrapApiData(res)
}

// 세대 정보 수정
export const updateHousehold = async (householdId, body) => {
  const res = await apiClient.patch(`/api/admin/households/${householdId}`, body)
  return unwrapApiData(res)
}

// 내 세대 정보 조회
export const getMyHousehold = async () => {
  const res = await apiClient.get('/api/households/me')
  return unwrapApiData(res)
}

export default {
  createHousehold,
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
}
