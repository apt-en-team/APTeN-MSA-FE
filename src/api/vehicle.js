// 차량 관련 API 함수를 관리합니다.
import apiClient from './apiClient'

export default {
  getMyVehicles: (params) => apiClient.get('/vehicles/me', { params }),
  createVehicle: (data) => apiClient.post('/vehicles', data),
  updateVehicle: (vehicleId, data) => apiClient.patch(`/vehicles/${vehicleId}`, data),
  deleteVehicle: (vehicleId) => apiClient.delete(`/vehicles/${vehicleId}`),
  checkLicensePlate: (params) => apiClient.get('/vehicles/check-license-plate', { params }),
  getAdminVehicles: (params) => apiClient.get('/admin/vehicles', { params }),
  approveVehicle: (vehicleId, data) => apiClient.post(`/admin/vehicles/${vehicleId}/approve`, data),
  rejectVehicle: (vehicleId, data) => apiClient.post(`/admin/vehicles/${vehicleId}/reject`, data),
  getVisitorVehicles: (params) => apiClient.get('/vehicles/visitors', { params }),
  createVisitorVehicle: (data) => apiClient.post('/vehicles/visitors', data),
  updateVisitorVehicle: (visitorVehicleId, data) =>
    apiClient.patch(`/vehicles/visitors/${visitorVehicleId}`, data),
  cancelVisitorVehicle: (visitorVehicleId, data) =>
    apiClient.post(`/vehicles/visitors/${visitorVehicleId}/cancel`, data),
  deleteVisitorVehicle: (visitorVehicleId) => apiClient.delete(`/vehicles/visitors/${visitorVehicleId}`),
  reRegisterVisitorVehicle: (visitorVehicleId, data) =>
    apiClient.post(`/vehicles/visitors/${visitorVehicleId}/re-register`, data),
  getRegularVisitorVehicles: (params) => apiClient.get('/vehicles/regular-visitors', { params }),
  createRegularVisitorVehicle: (data) => apiClient.post('/vehicles/regular-visitors', data),
  deleteRegularVisitorVehicle: (regularVisitorVehicleId) =>
    apiClient.delete(`/vehicles/regular-visitors/${regularVisitorVehicleId}`),
}
