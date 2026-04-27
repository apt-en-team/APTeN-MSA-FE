import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 예약 가능 시간 조회
export const getAvailableTimes = async (params) => {
  const res = await apiClient.get('/api/reservations/available-times', { params })
  return unwrapApiData(res)
}

// 좌석 임시 선점
export const holdSeat = async (body) => {
  const res = await apiClient.post('/api/reservations/seat-holds', body)
  return unwrapApiData(res)
}

// 예약 생성
export const createReservation = async (body) => {
  const res = await apiClient.post('/api/reservations', body)
  return unwrapApiData(res)
}

// 내 예약 목록 조회
export const getMyReservations = async (params) => {
  const res = await apiClient.get('/api/reservations/my', { params })
  return unwrapApiData(res)
}

// 내 예약 상세 조회
export const getMyReservationDetail = async (reservationId) => {
  const res = await apiClient.get(`/api/reservations/${reservationId}`)
  return unwrapApiData(res)
}

// 예약 취소
export const cancelMyReservation = async (reservationId) => {
  const res = await apiClient.patch(`/api/reservations/${reservationId}/cancel`)
  return unwrapApiData(res)
}

// 관리자 예약 목록 조회
export const getAdminReservations = async (params) => {
  const res = await apiClient.get('/api/admin/reservations', { params })
  return unwrapApiData(res)
}

// 관리자 예약 상세 조회
export const getAdminReservationDetail = async (reservationId) => {
  const res = await apiClient.get(`/api/admin/reservations/${reservationId}`)
  return unwrapApiData(res)
}

// 관리자 예약 강제 취소
export const cancelAdminReservation = async (reservationId, body) => {
  const res = await apiClient.patch(`/api/admin/reservations/${reservationId}/cancel`, body)
  return unwrapApiData(res)
}

export default {
  getAvailableTimes,
  holdSeat,
  createReservation,
  getMyReservations,
  getMyReservationDetail,
  cancelMyReservation,
  getAdminReservations,
  getAdminReservationDetail,
  cancelAdminReservation,
}
