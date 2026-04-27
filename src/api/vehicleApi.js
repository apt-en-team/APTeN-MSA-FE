import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 내 차량 등록 신청
export const createVehicle = async (body) => {
  const res = await apiClient.post('/api/vehicles', body)
  return unwrapApiData(res)
}

// 내 차량 수정
export const updateVehicle = async (vehicleId, body) => {
  const res = await apiClient.patch(`/api/vehicles/${vehicleId}`, body)
  return unwrapApiData(res)
}

// 내 차량 삭제
export const deleteVehicle = async (vehicleId) => {
  const res = await apiClient.delete(`/api/vehicles/${vehicleId}`)
  return unwrapApiData(res)
}

// 내 차량 목록 조회
export const getMyVehicles = async () => {
  const res = await apiClient.get('/api/vehicles')
  return unwrapApiData(res)
}

// 차량번호 중복 확인
export const checkLicensePlate = async (params) => {
  const res = await apiClient.get('/api/vehicles/check-license-plate', { params })
  return unwrapApiData(res)
}

// 내 차량 상세 조회
export const getMyVehicleDetail = async (vehicleId) => {
  const res = await apiClient.get(`/api/vehicles/${vehicleId}`)
  return unwrapApiData(res)
}

// 관리자 차량 목록 조회
export const getAdminVehicles = async (params) => {
  const res = await apiClient.get('/api/admin/vehicles', { params })
  return unwrapApiData(res)
}

// 관리자 차량 상세 조회
export const getAdminVehicleDetail = async (vehicleId) => {
  const res = await apiClient.get(`/api/admin/vehicles/${vehicleId}`)
  return unwrapApiData(res)
}

// 차량 승인
export const approveVehicle = async (vehicleId) => {
  const res = await apiClient.patch(`/api/admin/vehicles/${vehicleId}/approve`)
  return unwrapApiData(res)
}

// 차량 거절
export const rejectVehicle = async (vehicleId, body) => {
  const res = await apiClient.patch(`/api/admin/vehicles/${vehicleId}/reject`, body)
  return unwrapApiData(res)
}

// 차량 정책 설정
export const saveVehiclePolicies = async (body) => {
  const res = await apiClient.put('/api/admin/vehicle-policies', body)
  return unwrapApiData(res)
}

// 차량 정책 조회
export const getVehiclePolicies = async () => {
  const res = await apiClient.get('/api/admin/vehicle-policies')
  return unwrapApiData(res)
}

export default {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getMyVehicles,
  checkLicensePlate,
  getMyVehicleDetail,
  getAdminVehicles,
  getAdminVehicleDetail,
  approveVehicle,
  rejectVehicle,
  saveVehiclePolicies,
  getVehiclePolicies,
}
