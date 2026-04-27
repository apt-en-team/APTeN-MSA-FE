import apiClient from './apiClient'

// 방문차량 등록
export const createVisitorVehicle = async (body) => {
  const res = await apiClient.post('/api/visitor-vehicles', body)
  return res.data
}

// 방문차량 목록 조회
export const getVisitorVehicles = async (params) => {
  const res = await apiClient.get('/api/visitor-vehicles', { params })
  return res.data
}

// 방문차량 수정
export const updateVisitorVehicle = async (visitorVehicleId, body) => {
  const res = await apiClient.patch(`/api/visitor-vehicles/${visitorVehicleId}`, body)
  return res.data
}

// 방문차량 취소
export const cancelVisitorVehicle = async (visitorVehicleId) => {
  const res = await apiClient.patch(`/api/visitor-vehicles/${visitorVehicleId}/cancel`)
  return res.data
}

// 방문차량 삭제
export const deleteVisitorVehicle = async (visitorVehicleId) => {
  const res = await apiClient.delete(`/api/visitor-vehicles/${visitorVehicleId}`)
  return res.data
}

// 방문차량 재등록
export const reRegisterVisitorVehicle = async (visitorVehicleId, body) => {
  const res = await apiClient.post(`/api/visitor-vehicles/${visitorVehicleId}/re-register`, body)
  return res.data
}

// 관리자 방문차량 등록
export const createAdminVisitorVehicle = async (body) => {
  const res = await apiClient.post('/api/admin/visitor-vehicles', body)
  return res.data
}

// 관리자 방문 예정 차량 조회
export const getAdminVisitorVehicles = async (params) => {
  const res = await apiClient.get('/api/admin/visitor-vehicles', { params })
  return res.data
}

// 방문차량 정책 설정
export const saveVisitorPolicy = async (body) => {
  const res = await apiClient.put('/api/admin/visitor-policies', body)
  return res.data
}

// 방문차량 정책 조회
export const getVisitorPolicy = async () => {
  const res = await apiClient.get('/api/admin/visitor-policies')
  return res.data
}

// 고정 방문차량 등록
export const createRegularVisitorVehicle = async (body) => {
  const res = await apiClient.post('/api/regular-visitor-vehicles', body)
  return res.data
}

// 고정 방문차량 목록 조회
export const getRegularVisitorVehicles = async (params) => {
  const res = await apiClient.get('/api/regular-visitor-vehicles', { params })
  return res.data
}

// 고정 방문차량 삭제
export const deleteRegularVisitorVehicle = async (regularVisitorVehicleId) => {
  const res = await apiClient.delete(`/api/regular-visitor-vehicles/${regularVisitorVehicleId}`)
  return res.data
}

// 고정 방문차량 강제 삭제
export const deleteAdminRegularVisitorVehicle = async (regularVisitorVehicleId) => {
  const res = await apiClient.delete(`/api/admin/regular-visitor-vehicles/${regularVisitorVehicleId}`)
  return res.data
}

// 고정 방문차량 수정
export const updateRegularVisitorVehicle = async (regularVisitorVehicleId, body) => {
  const res = await apiClient.patch(`/api/regular-visitor-vehicles/${regularVisitorVehicleId}`, body)
  return res.data
}

export default {
  createVisitorVehicle,
  getVisitorVehicles,
  updateVisitorVehicle,
  cancelVisitorVehicle,
  deleteVisitorVehicle,
  reRegisterVisitorVehicle,
  createAdminVisitorVehicle,
  getAdminVisitorVehicles,
  saveVisitorPolicy,
  getVisitorPolicy,
  createRegularVisitorVehicle,
  getRegularVisitorVehicles,
  deleteRegularVisitorVehicle,
  deleteAdminRegularVisitorVehicle,
  updateRegularVisitorVehicle,
}
