// 예약 관련 API 함수를 관리합니다.
import apiClient from './apiClient'

export default {
  getFacilityList: (params) => apiClient.get('/reservations/facilities', { params }),
  getFacilityDetail: (facilityId) => apiClient.get(`/reservations/facilities/${facilityId}`),
  getAvailableTimes: (facilityId, params) =>
    apiClient.get(`/reservations/facilities/${facilityId}/available-times`, { params }),
  getSeats: (facilityId, params) => apiClient.get(`/reservations/facilities/${facilityId}/seats`, { params }),
  createReservation: (data) => apiClient.post('/reservations', data),
  getMyReservations: (params) => apiClient.get('/reservations/me', { params }),
  getReservationDetail: (reservationId) => apiClient.get(`/reservations/${reservationId}`),
  cancelReservation: (reservationId, data) => apiClient.post(`/reservations/${reservationId}/cancel`, data),
  getGxPrograms: (params) => apiClient.get('/reservations/gx-programs', { params }),
  getMyGxReservations: (params) => apiClient.get('/reservations/gx-programs/me', { params }),
  createGxReservation: (data) => apiClient.post('/reservations/gx-programs', data),
  cancelGxReservation: (reservationId, data) =>
    apiClient.post(`/reservations/gx-programs/${reservationId}/cancel`, data),
  getAdminReservations: (params) => apiClient.get('/admin/reservations', { params }),
  cancelAdminReservation: (reservationId, data) =>
    apiClient.post(`/admin/reservations/${reservationId}/cancel`, data),
}
