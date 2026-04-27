// 차량 관련 API를 관리합니다.
import apiClient from './apiClient'

export default {
  // 내 차량 등록 신청
  createVehicle(body) {
    return apiClient.post('/api/vehicles', body)
  },
  // 내 차량 수정
  updateVehicle(vehicleId, body) {
    return apiClient.patch(`/api/vehicles/${vehicleId}`, body)
  },
  // 내 차량 삭제
  deleteVehicle(vehicleId) {
    return apiClient.delete(`/api/vehicles/${vehicleId}`)
  },
  // 내 차량 목록 조회
  getMyVehicles() {
    return apiClient.get('/api/vehicles')
  },
  // 내 차량 상세 조회
  getMyVehicleDetail(vehicleId) {
    return apiClient.get(`/api/vehicles/${vehicleId}`)
  },
  // 차량번호 중복 확인
  checkLicensePlate(params) {
    return apiClient.get('/api/vehicles/check-license-plate', { params })
  },
  // 관리자 차량 목록 조회
  getAdminVehicles(params) {
    return apiClient.get('/api/admin/vehicles', { params })
  },
  // 관리자 차량 상세 조회
  getAdminVehicleDetail(vehicleId) {
    return apiClient.get(`/api/admin/vehicles/${vehicleId}`)
  },
  // 차량 승인
  approveVehicle(vehicleId) {
    return apiClient.patch(`/api/admin/vehicles/${vehicleId}/approve`)
  },
  // 차량 거절
  rejectVehicle(vehicleId, body) {
    return apiClient.patch(`/api/admin/vehicles/${vehicleId}/reject`, body)
  },
  // 차량 정책 조회
  getVehiclePolicies() {
    return apiClient.get('/api/admin/vehicle-policies')
  },
  // 차량 정책 설정
  saveVehiclePolicies(body) {
    return apiClient.put('/api/admin/vehicle-policies', body)
  },
}
