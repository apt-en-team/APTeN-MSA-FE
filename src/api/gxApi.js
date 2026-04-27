import apiClient from './apiClient'

// 관리자 GX 프로그램 등록
export const createGxProgram = async (body) => {
  const res = await apiClient.post('/api/admin/gx-programs', body)
  return res.data
}

// 관리자 GX 프로그램 목록 조회
export const getAdminGxPrograms = async (params) => {
  const res = await apiClient.get('/api/admin/gx-programs', { params })
  return res.data
}

// 관리자 GX 프로그램 상세 조회
export const getAdminGxProgramDetail = async (programId) => {
  const res = await apiClient.get(`/api/admin/gx-programs/${programId}`)
  return res.data
}

// 관리자 GX 프로그램 수정
export const updateGxProgram = async (programId, body) => {
  const res = await apiClient.patch(`/api/admin/gx-programs/${programId}`, body)
  return res.data
}

// 관리자 GX 프로그램 취소
export const cancelGxProgram = async (programId, body) => {
  const res = await apiClient.patch(`/api/admin/gx-programs/${programId}/cancel`, body)
  return res.data
}

// 입주민 GX 프로그램 목록 조회
export const getGxPrograms = async (params) => {
  const res = await apiClient.get('/api/gx-programs', { params })
  return res.data
}

// 입주민 GX 프로그램 상세 조회
export const getGxProgramDetail = async (programId) => {
  const res = await apiClient.get(`/api/gx-programs/${programId}`)
  return res.data
}

// GX 예약 신청
export const createGxReservation = async (body) => {
  const res = await apiClient.post('/api/gx-reservations', body)
  return res.data
}

// GX 대기 순번 조회
export const getGxWaitingStatus = async (gxReservationId) => {
  const res = await apiClient.get(`/api/gx-reservations/${gxReservationId}/waiting`)
  return res.data
}

// GX 예약 취소
export const cancelGxReservation = async (gxReservationId) => {
  const res = await apiClient.patch(`/api/gx-reservations/${gxReservationId}/cancel`)
  return res.data
}

// 관리자 GX 단건 승인
export const approveGxReservation = async (gxReservationId) => {
  const res = await apiClient.patch(`/api/admin/gx-reservations/${gxReservationId}/approve`)
  return res.data
}

// 관리자 GX 단건 거절
export const rejectGxReservation = async (gxReservationId, body) => {
  const res = await apiClient.patch(`/api/admin/gx-reservations/${gxReservationId}/reject`, body)
  return res.data
}

// 관리자 GX 일괄 승인
export const bulkApproveGxProgram = async (programId, body) => {
  const res = await apiClient.post(`/api/admin/gx-programs/${programId}/bulk-approve`, body)
  return res.data
}

// 관리자 GX 최소 인원 검증
export const checkGxMinimum = async (programId) => {
  const res = await apiClient.post(`/api/admin/gx-programs/${programId}/minimum-check`)
  return res.data
}

// 관리자 GX 현황 조회
export const getGxProgramStatus = async (programId) => {
  const res = await apiClient.get(`/api/admin/gx-programs/${programId}/status`)
  return res.data
}

export default {
  createGxProgram,
  getAdminGxPrograms,
  getAdminGxProgramDetail,
  updateGxProgram,
  cancelGxProgram,
  getGxPrograms,
  getGxProgramDetail,
  createGxReservation,
  getGxWaitingStatus,
  cancelGxReservation,
  approveGxReservation,
  rejectGxReservation,
  bulkApproveGxProgram,
  checkGxMinimum,
  getGxProgramStatus,
}
