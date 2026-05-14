import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 입출차 기록 목록 조회
export const getParkingLogs = async (params) => {
  const res = await apiClient.get('/api/admin/parking-logs', { params })
  return unwrapApiData(res)
}

// 관리자 주차 현황 조회
export const getParkingStatus = async () => {
  const res = await apiClient.get('/api/admin/parking/status')
  return unwrapApiData(res)
}

// 주차 구역 목록 조회
export const getParkingZones = async (params) => {
  const res = await apiClient.get('/api/admin/parking/zones', { params })
  return unwrapApiData(res)
}

// 주차 구역 등록
export const createParkingZone = async (body) => {
  const res = await apiClient.post('/api/admin/parking/zones', body)
  return unwrapApiData(res)
}

// 주차 구역 수정
export const updateParkingZone = async (zoneId, body) => {
  const res = await apiClient.patch(`/api/admin/parking/zones/${zoneId}`, body)
  return unwrapApiData(res)
}

// 주차 구역 삭제
export const deleteParkingZone = async (zoneId) => {
  const res = await apiClient.delete(`/api/admin/parking/zones/${zoneId}`)
  return unwrapApiData(res)
}

// 주차 통계 조회
export const getParkingStatistics = async (params) => {
  const res = await apiClient.get('/api/admin/parking/statistics', { params })
  return unwrapApiData(res)
}

// 입출차 등록
export const createParkingLog = async (body) => {
  const res = await apiClient.post('/api/admin/parking-logs', body)
  return unwrapApiData(res)
}

// 입주민 주차 현황 조회
export const getResidentParkingStatus = async () => {
  const res = await apiClient.get('/api/parking/status')
  return unwrapApiData(res)
}

export default {
  getParkingLogs,
  getParkingStatus,
  getParkingZones,
  createParkingZone,
  updateParkingZone,
  deleteParkingZone,
  getParkingStatistics,
  createParkingLog,
  getResidentParkingStatus,
}
