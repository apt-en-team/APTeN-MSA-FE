import apiClient from './apiClient'

// 입출차 기록 목록 조회
export const getParkingLogs = async (params) => {
  const res = await apiClient.get('/api/admin/parking-logs', { params })
  return res.data
}

// 주차 현황 조회
export const getParkingStatus = async () => {
  const res = await apiClient.get('/api/admin/parking/status')
  return res.data
}

// 주차층 목록 조회
export const getParkingFloors = async (params) => {
  const res = await apiClient.get('/api/admin/parking/floors', { params })
  return res.data
}

// 주차층 등록
export const createParkingFloor = async (body) => {
  const res = await apiClient.post('/api/admin/parking/floors', body)
  return res.data
}

// 주차층 수정
export const updateParkingFloor = async (parkingFloorId, body) => {
  const res = await apiClient.patch(`/api/admin/parking/floors/${parkingFloorId}`, body)
  return res.data
}

// 주차 통계 조회
export const getParkingStatistics = async (params) => {
  const res = await apiClient.get('/api/admin/parking/statistics', { params })
  return res.data
}

// 입출차 등록
export const createParkingLog = async (body) => {
  const res = await apiClient.post('/api/admin/parking-logs', body)
  return res.data
}

export default {
  getParkingLogs,
  getParkingStatus,
  getParkingFloors,
  createParkingFloor,
  updateParkingFloor,
  getParkingStatistics,
  createParkingLog,
}
