import apiClient from './apiClient'

// 관리자 세대 등록
export const createHousehold = async (body) => {
  const res = await apiClient.post('/api/admin/households', body)
  return res.data
}

// 관리자 세대 목록 조회
export const getAdminHouseholds = async (params) => {
  const res = await apiClient.get('/api/admin/households', { params })
  return res.data
}

// 관리자 세대 상세 조회
export const getAdminHouseholdDetail = async (householdId) => {
  const res = await apiClient.get(`/api/admin/households/${householdId}`)
  return res.data
}

// 세대 상태 변경
export const updateHouseholdStatus = async (householdId, body) => {
  const res = await apiClient.patch(`/api/admin/households/${householdId}/status`, body)
  return res.data
}

// 입주/퇴거 이력 조회
export const getHouseholdHistory = async (householdId) => {
  const res = await apiClient.get(`/api/admin/households/${householdId}/history`)
  return res.data
}

// 세대원 등록
export const createHouseholdMember = async (householdId, body) => {
  const res = await apiClient.post(`/api/admin/households/${householdId}/members`, body)
  return res.data
}

// 세대원 목록 조회
export const getHouseholdMembers = async (householdId) => {
  const res = await apiClient.get(`/api/admin/households/${householdId}/members`)
  return res.data
}

// 세대원 수정
export const updateHouseholdMember = async (householdMemberId, body) => {
  const res = await apiClient.patch(`/api/admin/household-members/${householdMemberId}`, body)
  return res.data
}

// 세대원 삭제
export const deleteHouseholdMember = async (householdMemberId) => {
  const res = await apiClient.delete(`/api/admin/household-members/${householdMemberId}`)
  return res.data
}

// 세대주 권한 변경
export const changeHouseholdHead = async (householdId, body) => {
  const res = await apiClient.patch(`/api/admin/households/${householdId}/head`, body)
  return res.data
}

// 수동 승인 대상 조회
export const getHouseholdMatchRequests = async (params) => {
  const res = await apiClient.get('/api/admin/household-match-requests', { params })
  return res.data
}

// 수동 승인 처리
export const approveHouseholdMatchRequest = async (matchRequestId) => {
  const res = await apiClient.patch(`/api/admin/household-match-requests/${matchRequestId}/approve`)
  return res.data
}

// 수동 거절 처리
export const rejectHouseholdMatchRequest = async (matchRequestId, body) => {
  const res = await apiClient.patch(`/api/admin/household-match-requests/${matchRequestId}/reject`, body)
  return res.data
}

// 세대 정보 수정
export const updateHousehold = async (householdId, body) => {
  const res = await apiClient.patch(`/api/admin/households/${householdId}`, body)
  return res.data
}

// 내 세대 정보 조회
export const getMyHousehold = async () => {
  const res = await apiClient.get('/api/households/me')
  return res.data
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
