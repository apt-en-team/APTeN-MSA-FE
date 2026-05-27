import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 방문차량 등록
export const createVisitorVehicle = async (body) => {
  const res = await apiClient.post('/visitor-vehicles', body)
  return unwrapApiData(res)
}

// 방문차량 목록 조회
export const getVisitorVehicles = async (params) => {
  const res = await apiClient.get('/visitor-vehicles', { params })
  return unwrapApiData(res)
}

// 방문차량 수정
export const updateVisitorVehicle = async (visitorVehicleId, body) => {
  const res = await apiClient.patch(`/visitor-vehicles/${visitorVehicleId}`, body)
  return unwrapApiData(res)
}

// 방문차량 취소
export const cancelVisitorVehicle = async (visitorVehicleId) => {
  const res = await apiClient.patch(`/visitor-vehicles/${visitorVehicleId}/cancel`)
  return unwrapApiData(res)
}

// 방문차량 삭제
export const deleteVisitorVehicle = async (visitorVehicleId) => {
  const res = await apiClient.delete(`/visitor-vehicles/${visitorVehicleId}`)
  return unwrapApiData(res)
}

// 방문차량 재등록
export const reRegisterVisitorVehicle = async (visitorVehicleId, body) => {
  const res = await apiClient.post(`/visitor-vehicles/${visitorVehicleId}/re-register`, body)
  return unwrapApiData(res)
}

// 관리자 방문차량 등록
export const createAdminVisitorVehicle = async (body) => {
  const res = await apiClient.post('/admin/visitor-vehicles', body)
  return unwrapApiData(res)
}

// 관리자 방문 예정 차량 조회
export const getAdminVisitorVehicles = async (params) => {
  const res = await apiClient.get('/admin/visitor-vehicles', { params })
  return unwrapApiData(res)
}

// 방문차량 정책 설정
export const saveVisitorPolicy = async (body) => {
  const res = await apiClient.put('/admin/visitor-policies', body)
  return unwrapApiData(res)
}

// 방문차량 정책 조회
export const getVisitorPolicy = async () => {
  const res = await apiClient.get('/admin/visitor-policies')
  return unwrapApiData(res)
}

// 고정 방문차량 등록
export const createRegularVisitorVehicle = async (body) => {
  const res = await apiClient.post('/regular-visitor-vehicles', body)
  return unwrapApiData(res)
}

// 고정 방문차량 목록 조회
export const getRegularVisitorVehicles = async (params) => {
  const res = await apiClient.get('/regular-visitor-vehicles', { params })
  return unwrapApiData(res)
}

// 고정 방문차량 삭제
export const deleteRegularVisitorVehicle = async (regularVisitorVehicleId) => {
  const res = await apiClient.delete(`/regular-visitor-vehicles/${regularVisitorVehicleId}`)
  return unwrapApiData(res)
}

// 고정 방문차량 강제 삭제
export const deleteAdminRegularVisitorVehicle = async (regularVisitorVehicleId) => {
  const res = await apiClient.delete(`/admin/regular-visitor-vehicles/${regularVisitorVehicleId}`)
  return unwrapApiData(res)
}

// 고정 방문차량 수정
export const updateRegularVisitorVehicle = async (regularVisitorVehicleId, body) => {
  const res = await apiClient.patch(`/regular-visitor-vehicles/${regularVisitorVehicleId}`, body)
  return unwrapApiData(res)
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
